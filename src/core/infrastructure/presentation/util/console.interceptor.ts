import { logStore } from "../viewmodel/log.store";

function safeArgToString(value: unknown): string {
    if (value == null) return String(value);
    const t = typeof value;
    if (t === "string") return value as string;
    if (t === "number" || t === "boolean" || t === "bigint") return String(value);
    if (t === "symbol") return (value as symbol).toString();
    if (value instanceof Error) {
        const anyErr = value as Error & { code?: unknown; type?: unknown };
        const extra = [
            anyErr.code != null ? `code=${anyErr.code}` : null,
            typeof anyErr.type === "string" ? `type=${anyErr.type}` : null,
        ]
            .filter(Boolean)
            .join(" ");
        return extra ? `${value.message} ${extra}` : value.message || value.name;
    }
    try {
        return JSON.stringify(value);
    } catch {
        try {
            return Object.prototype.toString.call(value);
        } catch {
            return "[unprintable]";
        }
    }
}

export function initGlobalLogger() {
    ["log", "info", "warn", "error"].forEach((level) => {
        const original = (console[level as keyof Console] as Function).bind(console);
        (console as any)[level] = (...args: any[]) => {
            try {
                original(...args);
            } catch {
                /* ignore */
            }
            try {
                const stack = level === "error" ? new Error().stack : undefined;
                const message = args.map(safeArgToString).join(" ");
                logStore.add(message, level as any, stack);
            } catch {
                /* never break app */
            }
        };
    });

    window.addEventListener("error", (event) => {
        logStore.add(event.message, "error", event.error?.stack);
    });

    window.addEventListener("unhandledrejection", (event) => {
        logStore.add(
            `Unhandled Promise: ${safeArgToString(event.reason)}`,
            "error",
            (event.reason as Error)?.stack,
        );
    });
}
