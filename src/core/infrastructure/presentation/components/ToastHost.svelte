<script lang="ts">
    import { toastStore } from "../viewmodel/toast.store";
</script>

<section class="toast-host" aria-live="polite" aria-atomic="true">
    {#each $toastStore.queue as toast (toast.id)}
        <article class={`toast ${toast.type}`} role="status">
            <span>{toast.text}</span>
            <button aria-label="Cerrar notificación" on:click={() => toastStore.remove(toast.id)}>✕</button>
        </article>
    {/each}
</section>

<style>
    .toast-host {
        position: fixed;
        right: 16px;
        bottom: 16px;
        /* Por encima de dialogs / overlays del panel */
        z-index: 10000;
        display: grid;
        gap: 8px;
        width: min(380px, calc(100vw - 24px));
        pointer-events: none;
    }

    .toast {
        pointer-events: auto;
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: center;
        gap: 10px;
        border-radius: 12px;
        padding: 12px 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-container-highest, var(--md-sys-color-surface)) 92%, black);
        color: var(--md-sys-color-on-surface);
        font-weight: 650;
        font-size: 0.92rem;
        line-height: 1.35;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    }

    .toast.success {
        border-color: color-mix(in srgb, #22c55e 55%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #22c55e 18%, var(--md-sys-color-surface) 82%);
        color: #bbf7d0;
    }

    .toast.error {
        border-color: color-mix(in srgb, #ef4444 60%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #ef4444 18%, var(--md-sys-color-surface) 82%);
        color: #fecaca;
    }

    .toast.info {
        border-color: color-mix(in srgb, #38bdf8 50%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, #38bdf8 14%, var(--md-sys-color-surface) 86%);
        color: #e0f2fe;
    }

    button {
        border: 0;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        cursor: pointer;
        color: inherit;
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 55%, transparent);
        flex-shrink: 0;
    }
</style>
