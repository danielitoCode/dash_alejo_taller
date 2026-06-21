const PRODUCT_IMAGES_VERSION = 1;

type SerializedProductImages = {
    version?: unknown;
    images?: unknown;
};

function isValidImageUrl(value: unknown): value is string {
    if (typeof value !== "string") return false;

    const trimmed = value.trim();
    if (!trimmed) return false;

    try {
        const url = new URL(trimmed);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function normalizeImageUrls(images: unknown): string[] {
    if (!Array.isArray(images)) return [];
    return images.map((image) => (typeof image === "string" ? image.trim() : image)).filter(isValidImageUrl);
}

export function parseProductImages(photoUrl: string): string[] {
    const trimmed = photoUrl.trim();
    if (!trimmed) return [];

    try {
        const parsed = JSON.parse(trimmed) as SerializedProductImages;
        return normalizeImageUrls(parsed?.images);
    } catch {
        return isValidImageUrl(trimmed) ? [trimmed] : [];
    }
}

export function serializeProductImages(images: string[]): string {
    const validImages = normalizeImageUrls(images);

    if (validImages.length <= 1) return validImages[0] ?? "";

    return JSON.stringify({ version: PRODUCT_IMAGES_VERSION, images: validImages });
}