<script lang="ts">
    import { fly, fade } from "svelte/transition";
    import { flip } from "svelte/animate";
    import { toastStore, type ToastType } from "../viewmodel/toast.store";
    import Icon from "./Icon.svelte";
    import {
        CheckCircle2,
        XCircle,
        Info,
        AlertTriangle,
        Loader2,
        X
    } from "lucide-svelte";

    const iconMap: Record<ToastType, typeof CheckCircle2> = {
        success: CheckCircle2,
        error: XCircle,
        info: Info,
        warning: AlertTriangle,
        loading: Loader2
    };

    const labelMap: Record<ToastType, string> = {
        success: "Éxito",
        error: "Error",
        info: "Info",
        warning: "Aviso",
        loading: "En curso"
    };

    $: loadings = $toastStore.queue.filter((t) => t.type === "loading");
</script>

<section class="toast-host" aria-live="polite" aria-atomic="false">
    {#if loadings.length > 1}
        <div class="activity-chip" transition:fade={{ duration: 160 }}>
            <Icon icon={Loader2} size={14} className="spin" ariaLabel="Operaciones en curso" />
            <span>{loadings.length} operaciones en curso</span>
        </div>
    {/if}

    {#each $toastStore.queue as toast (toast.id)}
        <article
            class="toast {toast.type}"
            role="status"
            in:fly={{ y: 16, duration: 220 }}
            out:fade={{ duration: 160 }}
            animate:flip={{ duration: 200 }}
        >
            <span class="toast-ico" class:spin={toast.type === "loading"}>
                <Icon icon={iconMap[toast.type]} size={20} ariaLabel={labelMap[toast.type]} />
            </span>
            <div class="toast-body">
                <strong class="toast-label">{labelMap[toast.type]}</strong>
                <span class="toast-text">{toast.text}</span>
            </div>
            {#if toast.type !== "loading"}
                <button
                    class="toast-close"
                    type="button"
                    aria-label="Cerrar notificación"
                    on:click={() => toastStore.remove(toast.id)}
                >
                    <Icon icon={X} size={16} ariaLabel="Cerrar" />
                </button>
            {/if}
            {#if toast.type === "loading"}
                <div class="toast-progress" aria-hidden="true"></div>
            {/if}
        </article>
    {/each}
</section>

<style>
    .toast-host {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 10000;
        display: grid;
        gap: 10px;
        width: min(400px, calc(100vw - 24px));
        pointer-events: none;
    }

    .activity-chip {
        pointer-events: none;
        justify-self: end;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28);
    }

    .toast {
        position: relative;
        pointer-events: auto;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: start;
        gap: 12px;
        border-radius: 14px;
        padding: 12px 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(
            in srgb,
            var(--md-sys-color-surface-container-highest, var(--md-sys-color-surface)) 92%,
            black
        );
        color: var(--md-sys-color-on-surface);
        font-weight: 600;
        font-size: 0.92rem;
        line-height: 1.35;
        box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.42),
            0 0 0 1px rgba(255, 255, 255, 0.04) inset;
        overflow: hidden;
    }

    .toast-ico {
        display: grid;
        place-items: center;
        margin-top: 1px;
        flex-shrink: 0;
    }

    .toast-body {
        min-width: 0;
        display: grid;
        gap: 2px;
    }

    .toast-label {
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        opacity: 0.85;
    }

    .toast-text {
        font-weight: 650;
        word-break: break-word;
    }

    .toast-close {
        border: 0;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        color: inherit;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        opacity: 0.75;
        transition: opacity 0.15s, background 0.15s;
    }

    .toast-close:hover {
        opacity: 1;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 70%, transparent);
    }

    .toast.success {
        border-color: color-mix(in srgb, #22c55e 55%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 16%, var(--md-sys-color-surface) 84%);
        color: #bbf7d0;
    }

    .toast.error {
        border-color: color-mix(in srgb, #ef4444 60%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 16%, var(--md-sys-color-surface) 84%);
        color: #fecaca;
    }

    .toast.info {
        border-color: color-mix(in srgb, #38bdf8 50%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #38bdf8 14%, var(--md-sys-color-surface) 86%);
        color: #e0f2fe;
    }

    .toast.warning {
        border-color: color-mix(in srgb, #f59e0b 55%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f59e0b 16%, var(--md-sys-color-surface) 84%);
        color: #fde68a;
    }

    .toast.loading {
        border-color: color-mix(in srgb, #a78bfa 50%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #8b5cf6 14%, var(--md-sys-color-surface) 86%);
        color: #e9d5ff;
    }

    .toast-progress {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 3px;
        width: 40%;
        border-radius: 0 2px 0 0;
        background: color-mix(in srgb, currentColor 70%, transparent);
        animation: progress-indeterminate 1.4s ease-in-out infinite;
    }

    :global(.spin) {
        animation: spin 0.9s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes progress-indeterminate {
        0% {
            left: 0;
            width: 30%;
        }
        50% {
            left: 35%;
            width: 40%;
        }
        100% {
            left: 100%;
            width: 20%;
        }
    }

    @media (max-width: 600px) {
        .toast-host {
            left: 12px;
            right: 12px;
            bottom: 12px;
            width: auto;
        }
    }
</style>
