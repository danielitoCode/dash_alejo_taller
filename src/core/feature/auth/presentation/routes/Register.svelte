<script lang="ts">
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { registerStore } from "../viewmodel/register.store";
    import { authContainer } from "../../di/auth.container";
    import FrameModal from "../components/FrameModal.svelte";
    import { ENV } from "../../../../infrastructure/env";
    import { parseGoogleIdToken, type GoogleIdTokenProfile } from "../util/google-id-token";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { Chrome, LogIn, UserPlus } from "lucide-svelte";

    export let navController: NavController;

    let name = "";
    let email = "";
    let password = "";
    let confirmPassword = "";

    let loading = false;
    let error: string | null = null;
    let success: string | null = null;
    let contentVisible = false;

    setTimeout(() => {
        contentVisible = true;
    }, 20);

    $: passwordsMatch = password.length > 0 && password === confirmPassword;
    $: canSubmit =
        name.trim().length >= 2 &&
        email.trim().length >= 5 &&
        password.length >= 6 &&
        confirmPassword.length >= 6 &&
        passwordsMatch &&
        !loading;

    async function register() {
        if (!canSubmit) return;

        loading = true;
        error = null;
        success = null;

        try {
            await registerStore.createAccount({
                name: name.trim(),
                email: email.trim(),
                password,
                phone: "",
                photo_url: "",
                role: "user",
                sub: "",
                verification: false
            });
            success = "Usuario registrado";
            setTimeout(() => navController.navigate("login"), 700);
        } catch (e) {
            error = e instanceof Error ? e.message : "Error al registrar usuario";
        } finally {
            loading = false;
        }
    }

    let googleFrameOpen = false;
    let registerFrameOpen = false;
    let googleProfile: GoogleIdTokenProfile | null = null;
    let googleAuthSrc = "";
    let googleRegisterSrc = "";
    let linkOpen = false;
    let linkPassword = "";
    let linkError: string | null = null;

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
        success = null;
        linkError = null;

        try {
            const result = await authContainer.useCases.accounts.exchangeGoogleCredential({
                credential: profile.credential
            });

            if (result.kind === "session") {
                const userId = await authContainer.useCases.sessions.openSession.openTokenSession(
                    result.userId,
                    result.secret
                );
                const current = await authContainer.useCases.accounts.getCurrentUser();
                if (current.role !== "admin") {
                    navController.navigate("unauthorized", { message: "Tu cuenta existe, pero no tiene permisos de administrador." });
                    return;
                }
                navController.navigate("home", { id: userId });
                return;
            }

            if (result.kind === "link_required") {
                linkOpen = true;
                return;
            }

            googleRegisterSrc = getGoogleRegisterSrc(profile);
            registerFrameOpen = true;
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar sesiÃ³n con Google";
        } finally {
            loading = false;
        }
    }

    async function linkGoogleAccount() {
        if (!googleProfile) return;
        if (!linkPassword.trim()) {
            linkError = "Ingresa tu contraseÃ±a actual.";
            return;
        }

        loading = true;
        linkError = null;
        error = null;
        success = null;

        try {
            const userId = await authContainer.useCases.accounts.linkGoogleAccount({
                email: googleProfile.email,
                currentPassword: linkPassword,
                googleSub: googleProfile.sub,
                name: googleProfile.name || googleProfile.email.split("@")[0] || "Usuario",
                photoUrl: googleProfile.picture || ""
            });

            const current = await authContainer.useCases.accounts.getCurrentUser();
            if (current.role !== "admin") {
                navController.navigate("unauthorized", { message: "Tu cuenta existe, pero no tiene permisos de administrador." });
                return;
            }

            linkOpen = false;
            linkPassword = "";
            navController.navigate("home", { id: userId });
        } catch (e: any) {
            const code = typeof e?.code === "number" ? e.code : null;
            linkError = code === 401 ? "ContraseÃ±a incorrecta." : (e instanceof Error ? e.message : "No se pudo vincular la cuenta.");
        } finally {
            loading = false;
        }
    }
    async function registerStoreFromGoogle(profile: GoogleIdTokenProfile) {
        loading = true;
        error = null;
        success = null;

        try {
            const result = await authContainer.useCases.accounts.exchangeGoogleCredential({
                credential: profile.credential,
                allowCreate: true
            });

            if (result.kind !== "session") {
                throw new Error("No se pudo crear la sesi\u00f3n con Google.");
            }

            const userId = await authContainer.useCases.sessions.openSession.openTokenSession(result.userId, result.secret);
            const current = await authContainer.useCases.accounts.getCurrentUser();
            if (current.role !== "admin") {
                navController.navigate("unauthorized", { message: "Cuenta creada, pero sin permisos para el panel de gesti\u00f3n." });
                return;
            }
            navController.navigate("home", { id: userId });
        } catch (e: any) {
            error = e instanceof Error ? e.message : "No se pudo crear la cuenta";
        } finally {
            loading = false;
        }
    }
    async function continueWithGoogle() {
        if (loading) return;
        error = null;
        success = null;
        try {
            googleAuthSrc = getGoogleAuthSrc();
            googleFrameOpen = true;
        } catch (e) {
            error = e instanceof Error ? e.message : "No se pudo iniciar sesiÃ³n con Google";
        }
    }

    function goToLogin() {
        navController.navigate("login");
    }
</script>

<section class="register-screen" aria-label="Crear cuenta">
    <div class="register-shell {contentVisible ? 'is-visible' : ''}">
        <section class="register-title">
            <h1>Crear cuenta</h1>
            <p>Completa tus datos para comenzar.</p>
        </section>

        <section class="form-card" aria-label="Formulario de registro">
            <label class="field">
                <span>Nombre completo</span>
                <input type="text" bind:value={name} placeholder="Tu nombre" autocomplete="name" />
            </label>

            <label class="field">
                <span>Correo</span>
                <input type="email" bind:value={email} placeholder="correo@dominio.com" autocomplete="email" />
            </label>

            <label class="field">
                <span>ContraseÃƒÂ±a</span>
                <input
                    type="password"
                    bind:value={password}
                    placeholder="MÃƒÂ­nimo 6 caracteres"
                    autocomplete="new-password"
                />
            </label>

            <label class="field">
                <span>Confirmar contraseÃƒÂ±a</span>
                <input
                    type="password"
                    bind:value={confirmPassword}
                    placeholder="Repite la contraseÃƒÂ±a"
                    autocomplete="new-password"
                />
            </label>

            {#if confirmPassword && !passwordsMatch}
                <p class="warning">No coinciden las contraseÃƒÂ±as</p>
            {/if}

            {#if error}
                <p class="error">{error}</p>
            {/if}

            {#if success}
                <p class="success">{success}</p>
            {/if}

            <button class="btn primary" on:click={register} disabled={!canSubmit}>
                <Icon icon={UserPlus} size={18} className="btn-ico" ariaLabel="Registrarse" />
                {#if loading}Registrando...{:else}Registrarse{/if}
            </button>

            <button class="btn elevated" on:click={continueWithGoogle} disabled={loading}>
                <Icon icon={Chrome} size={18} className="btn-ico" ariaLabel="Google" />
                <span>Continuar con Google</span>
                <img src="/icon/googleIcon.png" alt="Google icon" class="g-badge" />
            </button>

            <button class="link-btn" on:click={goToLogin}>Ã‚Â¿Ya tienes cuenta? Inicia sesiÃƒÂ³n</button>
        </section>
    </div>
</section>

<FrameModal
    open={googleFrameOpen}
    title="Google"
    ariaLabel="AutenticaciÃ³n con Google"
    src={googleFrameOpen ? googleAuthSrc : ""}
    on:close={() => (googleFrameOpen = false)}
    on:frameMessage={(event) => {
        const data = (event as CustomEvent<{ data: any }>).detail.data;
        if (data?.type === 'google-cancel') googleFrameOpen = false;
        if (data?.type === 'google-credential' && typeof data.credential === 'string') {
            googleFrameOpen = false;
            try {
                handleGoogleProfile(parseGoogleIdToken(data.credential));
            } catch (e) {
                error = e instanceof Error ? e.message : 'Credencial invÃ¡lida';
            }
        }
    }}
/>

<FrameModal
    open={registerFrameOpen}
    title="Crear cuenta"
    ariaLabel="Registro con Google"
    src={registerFrameOpen ? googleRegisterSrc : ""}
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

{#if linkOpen && googleProfile}
    <div class="link-overlay" role="button" tabindex="0" aria-label="Cerrar vinculaciÃ³n" on:click|self={() => (linkOpen = false)} on:keydown|self={(e) => (e.key === "Enter" || e.key === " " ? (linkOpen = false) : null)}>
        <div class="link-card" role="dialog" aria-label="Vincular Google">
            <header class="link-head">
                <div class="link-title">
                    <strong>Vincular Google</strong>
                    <span>Ingresa tu contraseÃ±a actual una sola vez.</span>
                </div>
                <button class="link-x" type="button" aria-label="Cerrar" on:click={() => (linkOpen = false)} disabled={loading}>Ã—</button>
            </header>

            <div class="link-user">
                {#if googleProfile.picture}
                    <img class="link-avatar" src={googleProfile.picture} alt="" aria-hidden="true" />
                {/if}
                <div>
                    <div class="link-name">{googleProfile.name || "Cuenta de Google"}</div>
                    <div class="link-email">{googleProfile.email}</div>
                </div>
            </div>

            <label class="link-field">
                <span>ContraseÃ±a actual</span>
                <input type="password" bind:value={linkPassword} placeholder="Tu contraseÃ±a" autocomplete="current-password" />
            </label>

            {#if linkError}
                <div class="link-error">{linkError}</div>
            {/if}

            <div class="link-actions">
                <button class="link-btn ghost" type="button" on:click={() => (linkOpen = false)} disabled={loading}>Cancelar</button>
                <button
                    class="link-btn ghost"
                    type="button"
                    on:click={() => {
                        linkOpen = false;
                        registerFrameOpen = true;
                    }}
                    disabled={loading}
                >
                    Crear cuenta
                </button>
                <button class="link-btn primary" type="button" on:click={linkGoogleAccount} disabled={loading}>
                    {#if loading}Vinculando...{:else}Vincular{/if}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .register-screen {
        min-height: 100dvh;
        width: 100%;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
            radial-gradient(
                circle at 50% 8%,
                color-mix(in srgb, var(--md-sys-color-secondary) 22%, transparent),
                transparent 52%
            ),
            var(--md-sys-color-background);
    }

    .register-shell {
        width: min(100%, 980px);
        display: grid;
        gap: 24px;
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 650ms ease, transform 650ms ease;
    }

    .register-shell.is-visible {
        opacity: 1;
        transform: translateY(0);
    }

    .register-title {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 8px;
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
        max-width: 560px;
        justify-self: center;
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 20px;
        padding: 20px;
        display: grid;
        gap: 12px;
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
        height: 46px;
        padding: 0 12px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
    }

    .warning {
        color: #d08900;
        font-size: 0.92rem;
    }
    .error {
        color: var(--md-sys-color-error);
        font-size: 0.92rem;
    }
    .success {
        color: var(--md-sys-color-primary);
        font-size: 0.92rem;
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

    .btn-ico {
        opacity: 0.95;
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
        border: 0;
        background: transparent;
        color: var(--md-sys-color-primary);
        cursor: pointer;
        justify-self: center;
    }

    @media (min-width: 900px), (orientation: landscape) and (max-height: 680px) {
        .register-shell {
            grid-template-columns: 0.95fr 1.05fr;
            align-items: center;
            gap: 18px;
        }

        .register-title {
            justify-items: start;
            text-align: left;
            align-content: center;
            min-height: 420px;
            padding-inline: 12px;
        }

        .form-card {
            max-width: none;
        }
    }

    .link-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        padding: 16px;
        background: color-mix(in srgb, black 55%, transparent);
    }

    .link-card {
        width: min(520px, 100%);
        border-radius: 22px;
        overflow: hidden;
        background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 26px 60px color-mix(in srgb, black 35%, transparent);
        backdrop-filter: blur(14px);
        display: grid;
        gap: 12px;
        padding: 14px;
        color: var(--md-sys-color-on-surface);
    }

    .link-head {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 10px;
    }

    .link-title {
        display: grid;
        gap: 2px;
    }

    .link-title span {
        font-size: 0.9rem;
        color: color-mix(in srgb, var(--md-sys-color-on-surface) 70%, transparent);
    }

    .link-x {
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

    .link-user {
        display: grid;
        grid-template-columns: 44px 1fr;
        gap: 12px;
        align-items: center;
        padding: 10px;
        border-radius: 16px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 35%, transparent);
    }

    .link-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 70%, transparent);
    }

    .link-name {
        font-weight: 750;
        letter-spacing: -0.01em;
    }

    .link-email {
        font-size: 0.9rem;
        opacity: 0.9;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .link-field {
        display: grid;
        gap: 6px;
    }

    .link-field span {
        font-size: 0.92rem;
        color: var(--md-sys-color-on-surface-variant);
    }

    .link-field input {
        width: 100%;
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        height: 44px;
        padding: 0 12px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
    }

    .link-error {
        color: var(--md-sys-color-error);
        font-size: 0.92rem;
    }

    .link-actions {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
    }

    .link-btn {
        height: 44px;
        border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 0.98rem;
        font-weight: 700;
    }

    .link-btn.primary {
        border: 0;
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
        box-shadow: 0 10px 20px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    }

    .link-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>

