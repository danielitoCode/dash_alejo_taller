import { ID } from "appwrite";
import { storage } from "../../di/appwrite.config";
import { ENV } from "../../env";
import { logger } from "../util/logger.service";

export type ImageUploadKind = "product" | "avatar";

function toUrlString(value: unknown): string {
    if (typeof value === "string") return value;
    try {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(value);
    } catch {
        return "";
    }
}

function isCloudinaryEnabled(): boolean {
    const provider = String(ENV.filesProvider ?? "").trim().toLowerCase();
    if (provider === "cloudinary") return true;
    if (provider === "appwrite") return false;
    return Boolean(ENV.cloudinaryCloudName && (ENV.cloudinaryPresetProducts || ENV.cloudinaryPresetAvatars));
}

function resolvePreset(kind: ImageUploadKind): string {
    const preset =
        kind === "avatar"
            ? ENV.cloudinaryPresetAvatars || ENV.cloudinaryPresetProducts
            : ENV.cloudinaryPresetProducts || ENV.cloudinaryPresetAvatars;
    if (!preset) {
        throw new Error(
            "Falta VITE_CLOUDINARY_UPLOAD_PRESET_PRODUCTS (o _AVATARS). Crea presets unsigned en Cloudinary.",
        );
    }
    return preset;
}

async function uploadToCloudinary(file: File, kind: ImageUploadKind): Promise<string> {
    const cloud = String(ENV.cloudinaryCloudName ?? "").trim();
    if (!cloud) throw new Error("Falta VITE_CLOUDINARY_CLOUD_NAME");

    const preset = resolvePreset(kind);
    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`;

    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", preset);

    logger.info(`[Cloudinary] upload kind=${kind} preset=${preset} file=${file.name} size=${file.size}`);

    const res = await fetch(endpoint, { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as {
        secure_url?: string;
        url?: string;
        error?: { message?: string };
        message?: string;
    };

    if (!res.ok) {
        const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
        logger.error(`[Cloudinary] upload failed: ${msg}`);
        throw new Error(`Cloudinary: ${msg}`);
    }

    const url = (data.secure_url || data.url || "").trim();
    if (!url) throw new Error("Cloudinary no devolvió secure_url");

    logger.info(`[Cloudinary] OK ${url.slice(0, 64)}…`);
    return url;
}

async function uploadToAppwrite(file: File): Promise<string> {
    const bucketId = ENV.storageBucketId;
    if (!bucketId) throw new Error("Falta configurar VITE_APPWRITE_STORAGE_BUCKET_ID");

    const created = await storage.createFile(bucketId, ID.unique(), file);
    const view = storage.getFileView(bucketId, created.$id);
    const url = toUrlString(view);
    if (!url) throw new Error("No se pudo obtener la URL del archivo subido.");
    return url;
}

export async function uploadImageToStorage(
    file: File,
    kind: ImageUploadKind = "product",
): Promise<string> {
    if (isCloudinaryEnabled()) {
        return uploadToCloudinary(file, kind);
    }
    return uploadToAppwrite(file);
}
