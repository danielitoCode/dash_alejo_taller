import { describe, expect, it } from "vitest";
import { parseGoogleIdToken } from "./google-id-token";

function toBase64Url(value: string): string {
    return btoa(value)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

function createCredential(payload: Record<string, unknown>): string {
    const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
    const body = toBase64Url(JSON.stringify(payload));
    return `${header}.${body}.signature`;
}

describe("parseGoogleIdToken", () => {
    it("extrae email, sub, nombre y picture desde la credencial", () => {
        const credential = createCredential({
            email: "admin@example.com",
            sub: "google-sub-123",
            name: "Admin Test",
            picture: "https://cdn.test/avatar.png"
        });

        expect(parseGoogleIdToken(credential)).toEqual({
            credential,
            email: "admin@example.com",
            sub: "google-sub-123",
            name: "Admin Test",
            picture: "https://cdn.test/avatar.png"
        });
    });

    it("lanza error si la credencial no tiene formato JWT", () => {
        expect(() => parseGoogleIdToken("invalid-token")).toThrow("Credencial inv");
    });

    it("lanza error si faltan email o sub", () => {
        const credential = createCredential({ email: "admin@example.com" });
        expect(() => parseGoogleIdToken(credential)).toThrow("Credencial incompleta");
    });
});
