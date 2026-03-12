<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { authContainer } from "../../di/auth.container";
    import type { NavBackStackEntry } from "../../../../../lib/navigation/NavBackStackEntry";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { ArrowLeft, ShieldAlert } from "lucide-svelte";

    export let navController: NavController;
    export let navBackStackEntry: NavBackStackEntry<{ message?: string }> | undefined = undefined;
    export let message = "Tu usuario no está autorizado para acceder a la plataforma.";

    let seconds = 5;
    $: finalMessage = navBackStackEntry?.args?.message ?? message;

    onMount(() => {
        authContainer.useCases.sessions.closeSession.execute().catch(() => {});

        const id = window.setInterval(() => {
            seconds -= 1;
            if (seconds <= 0) {
                window.clearInterval(id);
                navController.navigate("login");
            }
        }, 1000);

        return () => window.clearInterval(id);
    });
</script>

<section class="unauth-screen" aria-label="Acceso no autorizado">
    <div class="card">
        <div class="top">
            <img src="/alejoicon_clean.svg" alt="Logo" class="logo" />
            <div class="badge" aria-hidden="true">
                <Icon icon={ShieldAlert} size={20} className="badge-ico" />
            </div>
        </div>

        <h1>Acceso restringido</h1>
        <p>{finalMessage}</p>

        <div class="hint" aria-live="polite">
            <span>Volviendo al inicio de sesión en</span>
            <strong>{seconds}s</strong>
        </div>

        <button class="btn" on:click={() => navController.navigate("login")}>
            <Icon icon={ArrowLeft} size={18} className="btn-ico" ariaLabel="Volver" />
            Volver ahora
        </button>
    </div>
</section>

<style>
    .unauth-screen {
        width: 100%;
        height: 100dvh;
        display: grid;
        place-items: center;
        padding: 16px;
        background:
            radial-gradient(
                circle at 50% 12%,
                color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent),
                transparent 60%
            ),
            var(--md-sys-color-background);
        color: var(--md-sys-color-on-background);
    }

    .card {
        width: min(560px, 100%);
        border-radius: 24px;
        padding: 18px;
        display: grid;
        gap: 10px;
        justify-items: center;
        text-align: center;
        background: color-mix(in srgb, var(--md-sys-color-surface) 92%, transparent);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 18px 44px color-mix(in srgb, black 22%, transparent);
    }

    .top {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .logo {
        width: 54px;
        height: 54px;
        object-fit: contain;
        opacity: 0.95;
    }

    .badge {
        width: 42px;
        height: 42px;
        border-radius: 14px;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-error-container) 72%, transparent);
        color: var(--md-sys-color-on-error-container);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-error) 25%, transparent);
        box-shadow: 0 12px 26px color-mix(in srgb, var(--md-sys-color-error) 18%, transparent);
    }

    .badge-ico {
        opacity: 0.95;
    }

    h1 {
        margin: 0;
        font-size: clamp(1.5rem, 3.4vw, 1.9rem);
        letter-spacing: -0.02em;
    }

    p {
        margin: 0;
        max-width: 46ch;
        opacity: 0.92;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 85%, transparent);
    }

    .hint {
        display: inline-flex;
        gap: 8px;
        align-items: baseline;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 45%, transparent);
        color: var(--md-sys-color-on-surface);
    }

    .btn {
        margin-top: 4px;
        width: min(320px, 100%);
        height: 46px;
        border-radius: 14px;
        border: 0;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 700;
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
        box-shadow: 0 10px 20px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .btn-ico {
        opacity: 0.95;
    }
</style>

