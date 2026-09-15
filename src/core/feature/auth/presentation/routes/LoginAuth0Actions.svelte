<script lang="ts">
    /**
     * Acciones Auth0 panel: solo Database (usuario/contraseña).
     * Google eliminado del backoffice.
     */
    import { getAuthPort } from "../../di/authPort.factory";
    import { AUTH0_DB_CONNECTION } from "../../data/Auth0AuthAdapter";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { LogIn } from "lucide-svelte";

    export let disabled = false;
    export let loginHint = "";

    let loading = false;
    let error: string | null = null;

    async function login() {
        const auth = getAuthPort();
        if (!auth) {
            error = "Auth0 no está activo (VITE_AUTH_PROVIDER=auth0)";
            logger.warn("[Auth] Login: Auth0 inactivo");
            return;
        }
        loading = true;
        error = null;
        try {
            logger.info(`[Auth] Login DB connection=${AUTH0_DB_CONNECTION}`);
            await auth.init();
            await auth.loginWithRedirect({
                returnTo: typeof window !== "undefined" ? window.location.origin : undefined,
                connection: AUTH0_DB_CONNECTION,
                loginHint: loginHint.trim() || undefined,
            });
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar Auth0";
            logger.error(`[Auth] Login falló: ${error}`);
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
        {#if loading}Redirigiendo…{:else}Entrar con usuario y contraseña{/if}
    </button>
    <p class="hint">Solo Auth0 Database · sin Google · sin Appwrite</p>
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
