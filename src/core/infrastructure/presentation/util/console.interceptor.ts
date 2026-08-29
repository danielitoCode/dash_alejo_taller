import { logStore} from "../viewmodel/log.store";

export function initGlobalLogger() {

    // Console interception
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const consoleAny = console as unknown as Record<string, (...args: any[]) => void>;
    ["log", "info", "warn", "error"].forEach(level => {
        const original = consoleAny[level];

        consoleAny[level] = (...args: any[]) => {
            original(...args);

            const stack =
                level === "error"
                    ? new Error().stack
                    : undefined;

            logStore.add(args.join(" "), level as any, stack);
        };
    });

    // Runtime errors
    window.addEventListener("error", (event) => {
        logStore.add(
            event.message,
            "error",
            event.error?.stack
        );
    });

    // Unhandled promises
    window.addEventListener("unhandledrejection", (event) => {
        logStore.add(
            `Unhandled Promise: ${event.reason}`,
            "error",
            event.reason?.stack
        );
    });
}