<script lang="ts">
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { registerStore } from "../viewmodel/register.store";

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
                <span>Contraseña</span>
                <input type="password" bind:value={password} placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
            </label>

            <label class="field">
                <span>Confirmar contraseña</span>
                <input type="password" bind:value={confirmPassword} placeholder="Repite la contraseña" autocomplete="new-password" />
            </label>

            {#if confirmPassword && !passwordsMatch}
                <p class="warning">No coinciden las contraseñas</p>
            {/if}

            {#if error}
                <p class="error">{error}</p>
            {/if}

            {#if success}
                <p class="success">{success}</p>
            {/if}

            <button class="btn primary" on:click={register} disabled={!canSubmit}>
                {#if loading}Registrando...{:else}Registrarse{/if}
            </button>

            <button class="link-btn" on:click={goToLogin}>
                ¿Ya tienes cuenta? Inicia sesión
            </button>
        </section>
    </div>
</section>

<style>
    .register-screen {
        min-height: 100dvh;
        width: 100%;
        display: grid;
        place-items: center;
        padding: 24px;
        background:
                radial-gradient(circle at 50% 8%, color-mix(in srgb, var(--md-sys-color-secondary) 22%, transparent), transparent 52%),
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

    .warning { color: #d08900; font-size: 0.92rem; }
    .error { color: var(--md-sys-color-error); font-size: 0.92rem; }
    .success { color: var(--md-sys-color-primary); font-size: 0.92rem; }

    .btn {
        height: 52px;
        border-radius: 14px;
        border: 0;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 600;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .primary {
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
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
</style>
