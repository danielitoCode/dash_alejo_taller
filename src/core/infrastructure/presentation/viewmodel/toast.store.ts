import { writable } from "svelte/store"

/**
 * Tipos de notificación del panel.
 * - success / error / info / warning → feedback puntual
 * - loading → operación en curso (sticky hasta update/dismiss)
 */
export type ToastType = "success" | "error" | "info" | "warning" | "loading"

export interface ToastMessage {
    id: string
    type: ToastType
    /** Título corto opcional (p. ej. "Anular entrada"). */
    title?: string
    text: string
    /** 0 = no auto-cierra (loading / sticky). */
    timeoutMs: number
    dismissible: boolean
    createdAt: number
}

export type ToastInput = {
    type: ToastType
    text: string
    title?: string
    /** Default: 3200 success/info, 5200 error/warning, 0 loading. */
    timeoutMs?: number
    dismissible?: boolean
}

interface ToastState {
    queue: ToastMessage[]
}

const initialState: ToastState = {
    queue: [],
}

const timers = new Map<string, ReturnType<typeof setTimeout>>()

function defaultTimeout(type: ToastType): number {
    switch (type) {
        case "loading":
            return 0
        case "error":
        case "warning":
            return 5600
        case "success":
            return 3600
        default:
            return 3200
    }
}

function newId(): string {
    return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createToastStore() {
    const { subscribe, update, set } = writable<ToastState>(initialState)

    function clearTimer(id: string): void {
        const t = timers.get(id)
        if (t != null) {
            clearTimeout(t)
            timers.delete(id)
        }
    }

    function scheduleRemove(id: string, timeoutMs: number): void {
        clearTimer(id)
        if (timeoutMs <= 0) return
        const handle = setTimeout(() => remove(id), timeoutMs)
        timers.set(id, handle)
    }

    function push(input: ToastInput): string {
        const id = newId()
        const type = input.type
        const timeoutMs =
            input.timeoutMs !== undefined ? input.timeoutMs : defaultTimeout(type)
        const dismissible =
            input.dismissible !== undefined
                ? input.dismissible
                : type !== "loading"

        const toast: ToastMessage = {
            id,
            type,
            title: input.title?.trim() || undefined,
            text: String(input.text || "").trim() || "…",
            timeoutMs,
            dismissible,
            createdAt: Date.now(),
        }

        update((state) => ({
            ...state,
            queue: [...state.queue, toast].slice(-8),
        }))

        scheduleRemove(id, timeoutMs)
        return id
    }

    function remove(id: string): void {
        clearTimer(id)
        update((state) => ({
            ...state,
            queue: state.queue.filter((t) => t.id !== id),
        }))
    }

    /** Actualiza un toast existente (p. ej. loading → success/error). */
    function patch(
        id: string,
        patchInput: Partial<Pick<ToastMessage, "type" | "title" | "text" | "timeoutMs" | "dismissible">>
    ): void {
        let nextTimeout: number | undefined
        update((state) => {
            const queue = state.queue.map((t) => {
                if (t.id !== id) return t
                const type = patchInput.type ?? t.type
                const timeoutMs =
                    patchInput.timeoutMs !== undefined
                        ? patchInput.timeoutMs
                        : type !== t.type
                          ? defaultTimeout(type)
                          : t.timeoutMs
                nextTimeout = timeoutMs
                const dismissible =
                    patchInput.dismissible !== undefined
                        ? patchInput.dismissible
                        : type !== "loading"
                return {
                    ...t,
                    type,
                    title:
                        patchInput.title !== undefined
                            ? patchInput.title?.trim() || undefined
                            : t.title,
                    text:
                        patchInput.text !== undefined
                            ? String(patchInput.text || "").trim() || t.text
                            : t.text,
                    timeoutMs,
                    dismissible,
                }
            })
            return { ...state, queue }
        })
        if (nextTimeout !== undefined) {
            scheduleRemove(id, nextTimeout)
        }
    }

    function success(text: string, timeoutMs?: number, title?: string): string {
        return push({ type: "success", text, timeoutMs, title })
    }

    function error(text: string, timeoutMs?: number, title?: string): string {
        return push({ type: "error", text, timeoutMs, title })
    }

    function info(text: string, timeoutMs?: number, title?: string): string {
        return push({ type: "info", text, timeoutMs, title })
    }

    function warning(text: string, timeoutMs?: number, title?: string): string {
        return push({ type: "warning", text, timeoutMs, title })
    }

    /** Operación en curso; no se auto-cierra hasta patch/dismiss. */
    function loading(text: string, title?: string): string {
        return push({
            type: "loading",
            text,
            title,
            timeoutMs: 0,
            dismissible: false,
        })
    }

    /**
     * Ejecuta trabajo async mostrando un toast loading que sobrevive a la navegación.
     * Al terminar pasa a success o error. Lanza el error original tras actualizar la UI.
     */
    async function run<T>(
        loadingText: string,
        work: () => Promise<T>,
        opts?: {
            title?: string
            success?: string | ((result: T) => string)
            error?: string | ((err: unknown) => string)
            successTimeoutMs?: number
            errorTimeoutMs?: number
        }
    ): Promise<T> {
        const id = loading(loadingText, opts?.title)
        try {
            const result = await work()
            const msg =
                typeof opts?.success === "function"
                    ? opts.success(result)
                    : opts?.success ?? "Operación completada."
            patch(id, {
                type: "success",
                text: msg,
                timeoutMs: opts?.successTimeoutMs ?? defaultTimeout("success"),
                dismissible: true,
            })
            return result
        } catch (err) {
            const msg =
                typeof opts?.error === "function"
                    ? opts.error(err)
                    : opts?.error ??
                      (err instanceof Error ? err.message : "No se pudo completar la operación.")
            patch(id, {
                type: "error",
                text: msg,
                timeoutMs: opts?.errorTimeoutMs ?? defaultTimeout("error"),
                dismissible: true,
            })
            throw err
        }
    }

    function clear(): void {
        for (const id of timers.keys()) clearTimer(id)
        set(initialState)
    }

    return {
        subscribe,
        push,
        remove,
        dismiss: remove,
        patch,
        update: patch,
        success,
        error,
        info,
        warning,
        loading,
        run,
        clear,
    }
}

export const toastStore = createToastStore()
