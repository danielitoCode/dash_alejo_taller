<script lang="ts">
    import { createEventDispatcher, onDestroy } from "svelte";

    export let open = false;
    export let src = "";
    export let title = "";
    export let ariaLabel = "Modal";

    const dispatch = createEventDispatcher<{
        close: void;
        frameMessage: { data: unknown };
    }>();

    function close() {
        dispatch("close");
    }

    function handleMessage(event: MessageEvent) {
        if (event.origin !== window.location.origin) return;
        dispatch("frameMessage", { data: event.data });
    }

    $: {
        if (open) window.addEventListener("message", handleMessage);
        else window.removeEventListener("message", handleMessage);
    }

    onDestroy(() => {
        window.removeEventListener("message", handleMessage);
    });
</script>

{#if open}
    <div class="overlay" role="presentation" on:click|self={close}>
        <div class="sheet" role="dialog" aria-label={ariaLabel}>
            <header>
                <strong>{title}</strong>
                <button class="x" type="button" aria-label="Cerrar" on:click={close}>×</button>
            </header>
            <iframe title={title} src={src} class="frame" allow="identity-credentials-get"></iframe>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        padding: 16px;
        background: color-mix(in srgb, black 55%, transparent);
        z-index: 1000;
    }

    .sheet {
        width: min(520px, 100%);
        border-radius: 20px;
        overflow: hidden;
        background: color-mix(in srgb, var(--md-sys-color-surface) 86%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
        box-shadow: 0 26px 60px color-mix(in srgb, black 35%, transparent);
        backdrop-filter: blur(14px);
        display: grid;
        grid-template-rows: auto 1fr;
    }

    header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        gap: 10px;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        border-bottom: 1px solid var(--md-sys-color-outline-variant);
    }

    .x {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 1.2rem;
        line-height: 1;
    }

    .frame {
        width: 100%;
        height: min(520px, 74vh);
        border: 0;
        background: transparent;
    }
</style>

