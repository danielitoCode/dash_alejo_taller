<script lang="ts">
    /**
     * Acciones Auth0 panel: Universal Login + Google directo (free plan, hasta 2 social).
     * Requiere connection Google habilitada en Auth0 Dashboard → Authentication → Social.
     */
    import { getAuthPort } from "../../di/authPort.factory";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { Chrome, LogIn } from "lucide-svelte";

    export let disabled = false;

    let loading = false;
    let error: string | null = null;

    async function login(opts?: { connection?: string }) {
        const auth = getAuthPort();
        if (!auth) {
            error = "Auth0 no está activo (VITE_AUTH_PROVIDER=auth0)";
            return;
        }
        loading = true;
        error = null;
        try {
            await auth.init();
            await auth.loginWithRedirect({
                returnTo: typeof window !== "undefined" ? window.location.origin : undefined,
                connection: opts?.connection,
            });
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar Auth0";
            loading = false;
        }
    }
</script>

<div class="auth0-actions">
    {#if error}
        <p class="error">{error}</p>
    {/if}
    <button
        class="btn primary"
        type="button"
        disabled={disabled || loading}
        on:click={() => login()}
    >
        <Icon icon={LogIn} size={18} className="btn-ico" ariaLabel="Auth0" />
        {#if loading}Redirigiendo...{:else}Continuar con Auth0{/if}
    </button>
    <button
        class="btn elevated"
        type="button"
        disabled={disabled || loading}
        on:click={() => login({ connection: "google-oauth2" })}
    >
        <Icon icon={Chrome} size={18} className="btn-ico" ariaLabel="Google" />
        Continuar con Google
    </button>
    <p class="hint">Google vía Auth0 Social (plan free). Staff: claim roles.</p>
</div>

<style>
    .auth0-actions {
        display: grid;
        gap: 10px;
        width: 100%;
    }
    .btn {
        height: 52px;
        border-radius: 14px;
        border: 0;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    .btn.primary {
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
    }
    .btn.elevated {
        color: var(--md-sys-color-on-surface);
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
    }
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .error {
        color: var(--md-sys-color-error);
        font-size: 0.92rem;
        margin: 0;
    }
    .hint {
        margin: 0;
        font-size: 0.8rem;
        color: var(--md-sys-color-on-surface-variant);
        text-align: center;
    }
</style>
