import { createRemoteJWKSet, jwtVerify } from "jose";

type Env = {
    APPWRITE_ENDPOINT: string;
    APPWRITE_PROJECT_ID: string;
    APPWRITE_API_KEY: string;
    GOOGLE_CLIENT_ID: string;
    ALLOW_CREATE?: string;
    CORS_ORIGIN?: string;
};

type ExchangeBody = {
    action: "exchange";
    credential: string;
    allowCreate?: boolean;
};

type GoogleProfile = {
    email: string;
    sub: string;
    name?: string;
    picture?: string;
};

type ExchangeResult =
    | ({ kind: "session"; userId: string; secret: string } & GoogleProfile)
    | ({ kind: "link_required" } & GoogleProfile)
    | ({ kind: "register_required" } & GoogleProfile);

const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function json(status: number, body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
            ...(init?.headers ?? {})
        }
    });
}

function withCors(req: Request, env: Env, res: Response): Response {
    const origin = req.headers.get("origin") || "";
    const allowed = env.CORS_ORIGIN || origin || "*";
    const headers = new Headers(res.headers);
    headers.set("access-control-allow-origin", allowed === "*" ? "*" : allowed);
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "content-type");
    headers.set("vary", "origin");
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

async function parseJson<T>(req: Request): Promise<T | null> {
    try {
        return (await req.json()) as T;
    } catch {
        return null;
    }
}

async function verifyGoogleIdToken(credential: string, env: Env): Promise<GoogleProfile> {
    if (!credential || typeof credential !== "string") throw new Error("Falta credential (Google ID token).");
    if (!env.GOOGLE_CLIENT_ID) throw new Error("Falta configurar GOOGLE_CLIENT_ID.");

    const { payload } = await jwtVerify(credential, GOOGLE_JWKS, {
        audience: env.GOOGLE_CLIENT_ID,
        issuer: ["https://accounts.google.com", "accounts.google.com"]
    });

    const email = typeof payload.email === "string" ? payload.email : "";
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const name = typeof payload.name === "string" ? payload.name : "";
    const picture = typeof payload.picture === "string" ? payload.picture : "";
    const emailVerified = Boolean(payload.email_verified);

    if (!email || !sub) throw new Error("ID token incompleto (sin email/sub).");
    if (!emailVerified) throw new Error("El email de Google no está verificado.");

    return { email, sub, name, picture };
}

function appwriteHeaders(env: Env): Record<string, string> {
    if (!env.APPWRITE_ENDPOINT || !env.APPWRITE_PROJECT_ID || !env.APPWRITE_API_KEY) {
        throw new Error("Faltan variables de Appwrite: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY.");
    }
    return {
        "x-appwrite-project": env.APPWRITE_PROJECT_ID,
        "x-appwrite-key": env.APPWRITE_API_KEY,
        "content-type": "application/json"
    };
}

async function appwrite<T>(env: Env, path: string, init: RequestInit): Promise<T> {
    const endpoint = env.APPWRITE_ENDPOINT.replace(/\/$/, "");
    const url = `${endpoint}${path}`;
    const res = await fetch(url, init);
    const text = await res.text();
    let data: any = {};
    try {
        data = text ? JSON.parse(text) : {};
    } catch {
        // ignore
    }
    if (!res.ok) {
        const message = typeof data?.message === "string" ? data.message : `Appwrite error ${res.status}`;
        throw new Error(message);
    }
    return data as T;
}

type AppwriteUser = { $id: string; email?: string; name?: string; prefs?: any };

async function findUserByEmail(env: Env, email: string): Promise<AppwriteUser | null> {
    const list = await appwrite<{ users: AppwriteUser[] }>(env, `/users?search=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: appwriteHeaders(env)
    });

    const lower = email.toLowerCase();
    const hit =
        Array.isArray(list?.users) ? list.users.find((u) => String(u?.email || "").toLowerCase() === lower) : null;
    if (!hit) return null;

    return await appwrite<AppwriteUser>(env, `/users/${encodeURIComponent(hit.$id)}`, {
        method: "GET",
        headers: appwriteHeaders(env)
    });
}

function randomPassword(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    // base64url
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

async function createUser(env: Env, profile: GoogleProfile): Promise<AppwriteUser> {
    const created = await appwrite<AppwriteUser>(
        env,
        "/users",
        {
            method: "POST",
            headers: appwriteHeaders(env),
            body: JSON.stringify({
                email: profile.email,
                password: randomPassword(),
                name: profile.name || "Usuario"
            })
        }
    );

    const userId = created?.$id;
    if (!userId) throw new Error("No se pudo crear el usuario en Appwrite.");

    const current = await appwrite<AppwriteUser>(env, `/users/${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: appwriteHeaders(env)
    });

    const prefs = current?.prefs && typeof current.prefs === "object" ? current.prefs : {};
    const merged = {
        ...prefs,
        sub: profile.sub,
        google_linked: true,
        photo_url: profile.picture || prefs.photo_url,
        name: profile.name || prefs.name
    };

    await appwrite(env, `/users/${encodeURIComponent(userId)}/prefs`, {
        method: "PATCH",
        headers: appwriteHeaders(env),
        body: JSON.stringify({ prefs: merged })
    });

    return await appwrite<AppwriteUser>(env, `/users/${encodeURIComponent(userId)}`, {
        method: "GET",
        headers: appwriteHeaders(env)
    });
}

function isLinked(prefs: any, sub: string): boolean {
    if (!prefs || typeof prefs !== "object") return false;
    const stored = typeof prefs.sub === "string" ? prefs.sub : "";
    return Boolean(stored) && stored === sub;
}

async function createToken(env: Env, userId: string): Promise<{ secret: string }> {
    return await appwrite<{ secret: string }>(env, `/users/${encodeURIComponent(userId)}/tokens`, {
        method: "POST",
        headers: appwriteHeaders(env),
        body: JSON.stringify({})
    });
}

async function exchange(env: Env, body: ExchangeBody): Promise<ExchangeResult> {
    const profile = await verifyGoogleIdToken(body.credential, env);

    const allowCreate = Boolean(body.allowCreate) || env.ALLOW_CREATE === "1";

    let user = await findUserByEmail(env, profile.email);

    if (!user) {
        if (!allowCreate) return { kind: "register_required", ...profile };
        user = await createUser(env, profile);
    }

    const prefs = user?.prefs && typeof user.prefs === "object" ? user.prefs : {};
    if (!isLinked(prefs, profile.sub)) {
        return { kind: "link_required", ...profile };
    }

    const token = await createToken(env, user.$id);
    if (!token?.secret) throw new Error("No se pudo crear token de sesión.");

    return { kind: "session", userId: user.$id, secret: token.secret, ...profile };
}

export default {
    async fetch(req: Request, env: Env): Promise<Response> {
        if (req.method === "OPTIONS") {
            return withCors(req, env, new Response(null, { status: 204 }));
        }

        if (req.method !== "POST") {
            return withCors(req, env, json(405, { success: false, error: "Method not allowed" }));
        }

        const body = await parseJson<ExchangeBody>(req);
        if (!body || body.action !== "exchange") {
            return withCors(req, env, json(400, { success: false, error: "Body inválido" }));
        }

        try {
            const result = await exchange(env, body);
            return withCors(req, env, json(200, { success: true, ...result }));
        } catch (e) {
            const message = e instanceof Error ? e.message : "Error inesperado";
            return withCors(req, env, json(400, { success: false, error: message }));
        }
    }
};

