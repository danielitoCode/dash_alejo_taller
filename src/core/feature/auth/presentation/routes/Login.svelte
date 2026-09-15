<script lang="ts">
    /**
     * Login panel: SOLO Auth0 Database (usuario/contraseña).
     * Sin Google, sin Appwrite openSession.
     * SPA no puede enviar password al IdP de forma segura → redirect
     * a Universal Login con connection Username-Password-Authentication.
     */
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { getAuthPort } from "../../di/authPort.factory";
    import { AUTH0_DB_CONNECTION } from "../../data/Auth0AuthAdapter";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { LogIn } from "lucide-svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";

    export let navController: NavController;

    let email = "";
    let loading = false;
    let error: string | null = null;
    let contentVisible = false;

    const glowAlpha = 0.45;

    $: canSubmit = email.trim().length > 3 && !loading;

    setTimeout(() => {
        contentVisible = true;
    }, 20);

    async function signIn() {
        if (!canSubmit) return;

        const auth = getAuthPort();
        if (!auth) {
            error =
                "Auth0 no está activo. Configura VITE_AUTH_PROVIDER=auth0 y VITE_AUTH0_DOMAIN / CLIENT_ID.";
            return;
        }

        loading = true;
        error = null;

        try {
            const hint = email.trim();
            logger.info(`[Auth] Login panel → Auth0 DB connection hint=${hint.slice(0, 4)}…`);
            await auth.init();
            await auth.loginWithRedirect({
                connection: AUTH0_DB_CONNECTION,
                loginHint: hint,
                returnTo: typeof window !== "undefined" ? window.location.origin : undefined,
            });
            // redirect: no vuelve aquí
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar sesión con Auth0";
            logger.error(`[Auth] Login falló: ${error}`);
            loading = false;
        }
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && canSubmit) void signIn();
    }
</script>

<section class="login-screen" aria-label="Iniciar sesión">
    <div class="login-shell {contentVisible ? 'is-visible' : ''}">
        <section class="login-title">
            <div class="surface-icon" style={`--glow:${glowAlpha}`}>
                <div class="loader-ring" aria-hidden="true"></div>
                <img src="/alejoicon_clean.svg" alt="App icon" class="logo" />
            </div>
            <h1>Iniciar sesión</h1>
            <p>Panel de gestión · Auth0 (usuario y contraseña)</p>
        </section>

        <section class="form-card" aria-label="Formulario de acceso">
            <p class="hint">
                Introduce tu correo de staff. Auth0 pedirá la contraseña de la conexión
                <strong>Database</strong> (sin Google).
            </p>

            <label class="field">
                <span>Correo</span>
                <input
                    type="email"
                    bind:value={email}
                    placeholder="correo@dominio.com"
                    autocomplete="username"
                    on:keydown={onKeydown}
                />
            </label>

            {#if error}
                <p class="error">{error}</p>
            {/if}

            <div class="actions">
                <button class="btn primary" type="button" on:click={signIn} disabled={!canSubmit}>
                    <Icon icon={LogIn} size={18} className="btn-ico" ariaLabel="Entrar" />
                    {#if loading}Redirigiendo a Auth0…{:else}Entrar{/if}
                </button>
            </div>

            <p class="foot">
                Roles vía <code>app_metadata.role</code> + Action. Sin Appwrite.
            </p>
        </section>
    </div>
</section>

<style>
    .login-screen {
        min-height: 100dvh;
        width: 100%;
        display: grid;
        place-items: center;
        padding: 15px;
        background:
            radial-gradient(
                circle at 50% 10%,
                color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent),
                transparent 50%
            ),
            var(--md-sys-color-background);
    }

    .login-shell {
        width: min(100%, 520px);
        display: grid;
        gap: 24px;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 650ms ease, transform 650ms ease;
    }

    .login-shell.is-visible {
        opacity: 1;
        transform: translateY(0);
    }

    .login-title {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 8px;
    }

    .surface-icon {
        width: min(180px, 42vw);
        aspect-ratio: 1;
        position: relative;
        display: grid;
        place-items: center;
    }

    .loader-ring {
        position: absolute;
        inset: 0;
        border-radius: 28%;
        border: 7px solid
            color-mix(in srgb, var(--md-sys-color-primary-container) calc(var(--glow) * 100%), transparent);
        animation: pulse 600ms ease-in-out infinite alternate;
    }

    .logo {
        width: 70%;
        height: 70%;
        object-fit: contain;
        filter: drop-shadow(0 8px 15px color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent));
    }

    h1 {
        margin: 0;
        color: var(--md-sys-color-on-background);
        font-size: clamp(1.8rem, 4vw, 2.1rem);
    }

    p {
        margin: 0;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 75%, transparent);
    }

    .form-card {
        width: 100%;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 20px;
        padding: 20px;
        display: grid;
        gap: 12px;
        box-shadow: 0 10px 24px color-mix(in srgb, var(--md-sys-color-outline) 20%, transparent);
    }

    .hint {
        font-size: 0.88rem;
        color: var(--md-sys-color-on-surface-variant);
        line-height: 1.4;
    }

    .field {
        display: grid;
        gap: 6px;
    }

    .field span {
        font-size: 0.92rem;
        color: var(--md-sys-color-on-surface-variant);
    }

    input {
        width: 100%;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        height: 44px;
        padding: 0 12px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
        box-sizing: border-box;
    }

    .error {
        color: var(--md-sys-color-error);
        font-size: 0.92rem;
        margin: 0;
    }

    .actions {
        margin-top: 4px;
        display: grid;
        gap: 10px;
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

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .primary {
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
    }

    .foot {
        margin: 0;
        font-size: 0.78rem;
        color: var(--md-sys-color-on-surface-variant);
        text-align: center;
    }

    .foot code {
        font-size: 0.75rem;
    }

    @keyframes pulse {
        from {
            opacity: 0.12;
        }
        to {
            opacity: 0.78;
        }
    }
</style>
