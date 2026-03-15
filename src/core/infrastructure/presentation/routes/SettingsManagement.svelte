<script lang="ts">
    import { onMount } from "svelte";
    import { authContainer } from "../../../feature/auth/di/auth.container";
    import { toastStore } from "../viewmodel/toast.store";
    import Icon from "../components/Icon.svelte";
    import { KeyRound, Link2, Mail } from "lucide-svelte";

    let loading = false;
    let email = "";
    let googleLinked = false;

    let code = "";
    let newPassword = "";
    let confirmPassword = "";

    $: canConfirm = code.trim().length >= 4 && newPassword.length >= 8 && newPassword === confirmPassword && !loading;

    onMount(async () => {
        try {
            const user = await authContainer.useCases.accounts.getCurrentUser();
            email = user.email ?? "";
            googleLinked = Boolean((user.sub ?? "").trim().length);
        } catch (e) {
            toastStore.error(e instanceof Error ? e.message : "No se pudieron cargar los ajustes");
        }
    });

    async function requestCode() {
        if (loading) return;
        loading = true;
        try {
            await authContainer.useCases.accounts.requestPasswordResetCode();
            toastStore.success("Código enviado a tu correo.");
        } catch (e) {
            toastStore.error(e instanceof Error ? e.message : "No se pudo enviar el código");
        } finally {
            loading = false;
        }
    }

    async function confirmChange() {
        if (!canConfirm) return;
        loading = true;
        try {
            await authContainer.useCases.accounts.confirmPasswordResetCode({
                code: code.trim(),
                newPassword
            });
            toastStore.success("Contraseña actualizada.");
            code = "";
            newPassword = "";
            confirmPassword = "";
        } catch (e) {
            toastStore.error(e instanceof Error ? e.message : "No se pudo cambiar la contraseña");
        } finally {
            loading = false;
        }
    }
</script>

<section class="grid">
    <section class="card">
        <header class="head">
            <h2>Ajustes del negocio</h2>
            <p>Configura reglas operativas y seguridad.</p>
        </header>
    </section>

    <section class="card">
        <header class="head">
            <div class="head-row">
                <Icon icon={KeyRound} size={18} ariaLabel="Seguridad" />
                <h3>Seguridad</h3>
            </div>
            <p>Cambia tu contraseña con un código enviado a tu correo.</p>
        </header>

        <div class="row">
            <div class="pill">
                <Icon icon={Mail} size={16} ariaLabel="Correo" />
                <span class="mono">{email || "—"}</span>
            </div>
            <div class="pill {googleLinked ? 'ok' : ''}">
                <Icon icon={Link2} size={16} ariaLabel="Google" />
                <span>{googleLinked ? "Google vinculado" : "Google no vinculado"}</span>
            </div>
        </div>

        <div class="actions">
            <button class="btn primary" type="button" on:click={requestCode} disabled={loading}>
                {#if loading}Enviando...{:else}Enviar código{/if}
            </button>
        </div>

        <div class="form">
            <label class="field">
                <span>Código</span>
                <input bind:value={code} inputmode="numeric" placeholder="123456" autocomplete="one-time-code" />
            </label>

            <label class="field">
                <span>Nueva contraseña</span>
                <input type="password" bind:value={newPassword} placeholder="Mínimo 8 caracteres" autocomplete="new-password" />
            </label>

            <label class="field">
                <span>Confirmar contraseña</span>
                <input type="password" bind:value={confirmPassword} placeholder="Repite la contraseña" autocomplete="new-password" />
            </label>

            <button class="btn" type="button" on:click={confirmChange} disabled={!canConfirm}>
                Cambiar contraseña
            </button>
        </div>
    </section>
</section>

<style>
    .grid {
        display: grid;
        gap: 14px;
        align-content: start;
    }

    .card {
        border-radius: 18px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        padding: 14px;
        display: grid;
        gap: 12px;
        color: var(--md-sys-color-on-surface);
    }

    .head {
        display: grid;
        gap: 4px;
    }

    .head-row {
        display: inline-flex;
        align-items: center;
        gap: 10px;
    }

    h2,
    h3 {
        margin: 0;
        letter-spacing: -0.01em;
    }

    p {
        margin: 0;
        color: var(--md-sys-color-on-surface-variant);
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
    }

    .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 22%, transparent);
    }

    .pill.ok {
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 55%, var(--md-sys-color-outline-variant));
        background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
        color: var(--md-sys-color-on-surface);
    }

    .mono {
        font-variant-numeric: tabular-nums;
    }

    .actions {
        display: flex;
        gap: 10px;
    }

    .form {
        display: grid;
        gap: 10px;
        max-width: 520px;
    }

    .field {
        display: grid;
        gap: 6px;
    }

    .field span {
        font-size: 0.92rem;
        color: var(--md-sys-color-on-surface-variant);
    }

    .field input {
        height: 44px;
        border-radius: 12px;
        border: 1px solid var(--md-sys-color-outline-variant);
        padding: 0 12px;
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
        color: var(--md-sys-color-on-surface);
        font: inherit;
    }

    .btn {
        height: 44px;
        border-radius: 14px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent;
        color: inherit;
        cursor: pointer;
        font-size: 0.98rem;
        font-weight: 750;
        padding: 0 14px;
        width: max-content;
    }

    .btn.primary {
        border: 0;
        background: var(--md-sys-color-primary);
        color: var(--md-sys-color-on-primary);
        box-shadow: 0 10px 20px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
