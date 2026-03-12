<script lang="ts">
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { authContainer } from "../../di/auth.container";
    import FrameModal from "../components/FrameModal.svelte";
    import { ENV } from "../../../../infrastructure/env";
    import { parseGoogleIdToken, type GoogleIdTokenProfile } from "../util/google-id-token";
    import { registerStore } from "../viewmodel/register.store";

    export let navController: NavController;

    let email = "";
    let password = "";
    let loading = false;
    let error: string | null = null;
    let contentVisible = false;

    const glowAlpha = 0.45;

    $: canSubmit = email.trim().length > 3 && password.trim().length > 3 && !loading;

    setTimeout(() => {
        contentVisible = true;
    }, 20);

    async function signIn() {
        if (!canSubmit) return;

        loading = true;
        error = null;

        try {
            const userId = await authContainer.useCases.sessions.openSession.openCustomSession(
                email.trim(),
                password
            );
            const current = await authContainer.useCases.accounts.getCurrentUser();
            if (current.role !== "admin") {
                navController.navigate("unauthorized");
                return;
            }
            navController.navigate("home", { id: userId });
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar sesiÃ³n";
        } finally {
            loading = false;
        }
    }

    function getReturnUrl(): string {
        return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
    }

    let googleFrameOpen = false;
    let registerFrameOpen = false;
    let googleProfile: GoogleIdTokenProfile | null = null;

    function getGoogleAuthSrc(): string {
        const clientId = ENV.googleClientId;
        if (!clientId) throw new Error("Falta configurar VITE_GOOGLE_CLIENT_ID");
        const params = new URLSearchParams({
            client_id: clientId,
            parent_origin: window.location.origin
        });
        return `/google-auth.html#${params.toString()}`;
    }

    function getGoogleRegisterSrc(profile: GoogleIdTokenProfile): string {
        const params = new URLSearchParams({
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            parent_origin: window.location.origin
        });
        return `/google-register.html#${params.toString()}`;
    }

    async function handleGoogleProfile(profile: GoogleIdTokenProfile) {
        googleProfile = profile;

        loading = true;
        error = null;

        try {
            const userId = await authContainer.useCases.sessions.openSession.openCustomSession(profile.email, profile.sub);
            const current = await authContainer.useCases.accounts.getCurrentUser();
            if (current.role !== "admin") {
                navController.navigate("unauthorized");
                return;
            }
            navController.navigate("home", { id: userId });
        } catch {
            registerFrameOpen = true;
        } finally {
            loading = false;
        }
    }

    async function continueWithGoogle() {
        if (loading) return;
        error = null;
        try {
            googleFrameOpen = true;
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar sesión con Google";
        }
    }

    function goToRegister() {
        navController.navigate("register");
    }

    async function registerStoreFromGoogle(profile: GoogleIdTokenProfile) {
        loading = true;
        error = null;

        try {
            await registerStore.createAccount({
                name: profile.name || profile.email.split("@")[0] || "Usuario",
                email: profile.email,
                password: profile.sub,
                phone: "",
                photo_url: profile.picture,
                role: "viewer",
                sub: profile.sub,
                verification: true
            });

            const current = await authContainer.useCases.accounts.getCurrentUser();
            if (current.role !== "admin") {
                navController.navigate("unauthorized");
                return;
            }
            navController.navigate("home", { id: current.id });
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo crear la cuenta";
        } finally {
            loading = false;
        }
    }
</script>

<section class="login-screen" aria-label="Iniciar sesiÃ³n">
    <div class="login-shell {contentVisible ? 'is-visible' : ''}">
        <section class="login-title">
            <div class="surface-icon" style={`--glow:${glowAlpha}`}>
                <div class="loader-ring" aria-hidden="true"></div>
                <img src="/alejoicon_clean.svg" alt="App icon" class="logo" />
            </div>
            <h1>Iniciar sesiÃ³n</h1>
            <p>Accede con tu cuenta para continuar.</p>
        </section>

        <section class="form-card" aria-label="Formulario de acceso">
            <label class="field">
                <span>Correo</span>
                <input type="email" bind:value={email} placeholder="correo@dominio.com" autocomplete="email" />
            </label>

            <label class="field">
                <span>ContraseÃ±a</span>
                <input
                    type="password"
                    bind:value={password}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    autocomplete="current-password"
                />
            </label>

            {#if error}
                <p class="error">{error}</p>
            {/if}

            <div class="actions">
                <button class="btn primary" on:click={signIn} disabled={!canSubmit}>
                    {#if loading}Entrando...{:else}Entrar{/if}
                </button>

                <button class="btn elevated" on:click={continueWithGoogle} disabled={loading}>
                    <span>Google</span>
                    <img src="/icon/googleIcon.png" alt="Google icon" class="g-badge" />
                </button>
            </div>

            <button class="link-btn" on:click={goToRegister}>Â¿No tienes cuenta? RegÃ­strate</button>
        </section>
    </div>
</section>

<FrameModal
    open={googleFrameOpen}
    title="Google"
    ariaLabel="Autenticación con Google"
    src={googleFrameOpen ? getGoogleAuthSrc() : ""}
    on:close={() => (googleFrameOpen = false)}
    on:frameMessage={(event) => {
        const data = (event as CustomEvent<{ data: any }>).detail.data;
        if (data?.type === 'google-cancel') googleFrameOpen = false;
        if (data?.type === 'google-credential' && typeof data.credential === 'string') {
            googleFrameOpen = false;
            try {
                handleGoogleProfile(parseGoogleIdToken(data.credential));
            } catch (e) {
                error = e instanceof Error ? e.message : 'Credencial inválida';
            }
        }
    }}
/>

<FrameModal
    open={registerFrameOpen}
    title="Crear cuenta"
    ariaLabel="Registro con Google"
    src={registerFrameOpen && googleProfile ? getGoogleRegisterSrc(googleProfile) : ""}
    on:close={() => (registerFrameOpen = false)}
    on:frameMessage={(event) => {
        const data = (event as CustomEvent<{ data: any }>).detail.data;
        if (data?.type === 'google-register-cancel') registerFrameOpen = false;
        if (data?.type === 'google-register-accept' && googleProfile) {
            registerFrameOpen = false;
            registerStoreFromGoogle(googleProfile);
        }
    }}
/>

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
        width: min(100%, 980px);
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
        max-width: 520px;
        justify-self: center;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 20px;
        padding: 20px;
        display: grid;
        gap: 10px;
        box-shadow: 0 10px 24px color-mix(in srgb, var(--md-sys-color-outline) 20%, transparent);
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
    }

    .error {
        color: var(--md-sys-color-error);
        font-size: 0.92rem;
    }

    .actions {
        margin-top: 5px;
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

    .elevated {
        color: var(--md-sys-color-on-surface);
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
    }

    .g-badge {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: inline-grid;
        place-items: center;
    }

    .link-btn {
        margin-top: 4px;
        border: 0;
        background: transparent;
        color: var(--md-sys-color-primary);
        cursor: pointer;
        justify-self: center;
    }

    @media (min-width: 900px), (orientation: landscape) and (max-height: 650px) {
        .login-shell {
            grid-template-columns: 1fr 1fr;
            align-items: center;
            gap: 18px;
        }

        .login-title {
            justify-items: center;
            align-content: center;
            min-height: 420px;
        }

        .form-card {
            max-width: none;
            align-self: stretch;
            align-content: center;
        }

        .actions {
            grid-template-columns: 1fr 1fr;
        }
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
