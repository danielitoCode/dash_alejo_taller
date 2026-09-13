<script lang="ts">
    /**
     * Acciones Auth0 para el panel (login Universal Login).
     * Tras redirect, Splash procesa code/state y gates de rol.
     */
    import { getAuthPort } from "../../di/authPort.factory";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { LogIn } from "lucide-svelte";

    export let disabled = false;

    let loading = false;
    let error: string | null = null;

    async function continueWithAuth0(signup = false) {
        const auth = getAuthPort();
        if (!auth) {
            error = "Auth0 no está activo (VITE_AUTH_PROVIDER=auth0)";
            return;
        }
        loading = true;
        error = null;
        try {
            await auth.init();
            // screen_hint via appState no es estándar; loginWithRedirect usa Universal Login
            await auth.loginWithRedirect({
                returnTo: typeof window !== "undefined" ? window.location.origin : undefined,
            });
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar Auth0";
            loading = false;
        }
        // si redirect OK, la página se navega fuera
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
        on:click={() => continueWithAuth0(false)}
    >
        <Icon icon={LogIn} size={18} className="btn-ico" ariaLabel="Auth0" />
        {#if loading}Redirigiendo...{:else}Continuar con Auth0{/if}
    </button>
    <p class="hint">Staff: owner / admin / sales vía claim o rol en Auth0.</p>
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
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
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
