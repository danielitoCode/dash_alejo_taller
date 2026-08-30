<script lang="ts">
    import { fly, fade } from "svelte/transition"
    import { quintOut } from "svelte/easing"
    import Icon from "./Icon.svelte"
    import { toastStore, type ToastMessage, type ToastType } from "../viewmodel/toast.store"
    import {
        AlertTriangle,
        CheckCircle2,
        Info,
        Loader2,
        X,
        XCircle,
    } from "lucide-svelte"

    function iconFor(type: ToastType) {
        switch (type) {
            case "success":
                return CheckCircle2
            case "error":
                return XCircle
            case "warning":
                return AlertTriangle
            case "loading":
                return Loader2
            default:
                return Info
        }
    }

    function ariaRole(type: ToastType): "alert" | "status" {
        return type === "error" || type === "warning" ? "alert" : "status"
    }

    $: loadingCount = $toastStore.queue.filter((t) => t.type === "loading").length
    $: visible = $toastStore.queue
</script>

<section class="toast-host" aria-live="polite" aria-relevant="additions text">
    {#if loadingCount > 1}
        <div class="activity-chip" transition:fade={{ duration: 160 }}>
            <span class="spin-wrap" aria-hidden="true">
                <Icon icon={Loader2} size={14} />
            </span>
            <span>{loadingCount} operaciones en curso</span>
        </div>
    {/if}

    {#each visible as toast (toast.id)}
        <article
            class="toast toast-{toast.type}"
            role={ariaRole(toast.type)}
            aria-busy={toast.type === "loading" ? "true" : undefined}
            in:fly={{ y: 18, duration: 280, easing: quintOut }}
            out:fly={{ y: 8, duration: 180 }}
        >
            <div class="toast-icon" aria-hidden="true">
                <span class:spin={toast.type === "loading"}>
                    <Icon icon={iconFor(toast.type)} size={18} />
                </span>
            </div>

            <div class="toast-body">
                {#if toast.title}
                    <strong class="toast-title">{toast.title}</strong>
                {/if}
                <p class="toast-text">{toast.text}</p>
            </div>

            {#if toast.dismissible}
                <button
                    type="button"
                    class="toast-close"
                    aria-label="Cerrar notificación"
                    on:click={() => toastStore.dismiss(toast.id)}
                >
                    <Icon icon={X} size={14} />
                </button>
            {/if}

            {#if toast.type !== "loading" && toast.timeoutMs > 0}
                <div
                    class="toast-progress"
                    style={`--toast-ttl: ${toast.timeoutMs}ms`}
                    aria-hidden="true"
                ></div>
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
        display: flex;
        flex-direction: column-reverse;
        align-items: stretch;
        gap: 10px;
        width: min(400px, calc(100vw - 24px));
        pointer-events: none;
        max-height: min(70vh, 520px);
        overflow: visible;
    }

    .activity-chip {
        pointer-events: none;
        align-self: flex-end;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--md-sys-color-on-surface-variant);
        background: color-mix(
            in srgb,
            var(--md-sys-color-surface-container-highest, var(--md-sys-color-surface)) 92%,
            transparent
        );
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 4px 14px color-mix(in srgb, black 18%, transparent);
    }

    .toast {
        pointer-events: auto;
        position: relative;
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: start;
        gap: 12px;
        padding: 12px 14px 14px;
        border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(
            in srgb,
            var(--md-sys-color-surface-container-highest, var(--md-sys-color-surface)) 94%,
            black
        );
        color: var(--md-sys-color-on-surface);
        box-shadow:
            0 12px 32px color-mix(in srgb, black 28%, transparent),
            0 0 0 1px color-mix(in srgb, white 4%, transparent) inset;
        overflow: hidden;
        backdrop-filter: blur(10px);
    }

    .toast-icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        flex-shrink: 0;
        margin-top: 1px;
    }

    .toast-body {
        min-width: 0;
        display: grid;
        gap: 2px;
        padding-top: 2px;
    }

    .toast-title {
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        opacity: 0.85;
    }

    .toast-text {
        margin: 0;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.4;
        word-break: break-word;
    }

    .toast-close {
        border: 0;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        color: inherit;
        opacity: 0.7;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        transition: opacity 0.15s, background 0.15s;
    }

    .toast-close:hover {
        opacity: 1;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 70%, transparent);
    }

    .toast-progress {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background: color-mix(in srgb, currentColor 22%, transparent);
        transform-origin: left center;
        animation: toast-ttl var(--toast-ttl) linear forwards;
    }

    @keyframes toast-ttl {
        from {
            transform: scaleX(1);
        }
        to {
            transform: scaleX(0);
        }
    }

    .spin,
    .spin-wrap {
        display: inline-flex;
        animation: toast-spin 0.85s linear infinite;
    }

    @keyframes toast-spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* —— Variants —— */
    .toast-success {
        border-color: color-mix(in srgb, #22c55e 50%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 14%, var(--md-sys-color-surface) 86%);
    }
    .toast-success .toast-icon {
        color: #4ade80;
        background: color-mix(in srgb, #22c55e 18%, transparent);
    }
    .toast-success .toast-title {
        color: #86efac;
    }

    .toast-error {
        border-color: color-mix(in srgb, #ef4444 55%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 14%, var(--md-sys-color-surface) 86%);
    }
    .toast-error .toast-icon {
        color: #f87171;
        background: color-mix(in srgb, #ef4444 18%, transparent);
    }
    .toast-error .toast-title {
        color: #fca5a5;
    }

    .toast-warning {
        border-color: color-mix(in srgb, #f59e0b 50%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #f59e0b 12%, var(--md-sys-color-surface) 88%);
    }
    .toast-warning .toast-icon {
        color: #fbbf24;
        background: color-mix(in srgb, #f59e0b 18%, transparent);
    }
    .toast-warning .toast-title {
        color: #fcd34d;
    }

    .toast-info {
        border-color: color-mix(in srgb, #38bdf8 45%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #38bdf8 12%, var(--md-sys-color-surface) 88%);
    }
    .toast-info .toast-icon {
        color: #7dd3fc;
        background: color-mix(in srgb, #38bdf8 16%, transparent);
    }
    .toast-info .toast-title {
        color: #bae6fd;
    }

    .toast-loading {
        border-color: color-mix(
            in srgb,
            var(--md-sys-color-primary) 40%,
            var(--md-sys-color-outline-variant)
        );
        background: color-mix(
            in srgb,
            var(--md-sys-color-primary) 10%,
            var(--md-sys-color-surface) 90%
        );
    }
    .toast-loading .toast-icon {
        color: var(--md-sys-color-primary);
        background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
    }
    .toast-loading .toast-title {
        color: var(--md-sys-color-primary);
    }

    @media (max-width: 480px) {
        .toast-host {
            right: 10px;
            left: 10px;
            bottom: 12px;
            width: auto;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .spin,
        .spin-wrap {
            animation: none;
        }
        .toast-progress {
            animation: none;
            transform: scaleX(0.35);
        }
    }
</style>
