<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { authContainer } from "../../di/auth.container";
    import type { NavBackStackEntry } from "../../../../../lib/navigation/NavBackStackEntry";

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
        <img src="/alejoicon_clean.svg" alt="Logo" class="logo" />
        <h1>Acceso restringido</h1>
        <p>{finalMessage}</p>
        <div class="hint">
            <span>Volviendo al inicio de sesión en</span>
            <strong>{seconds}s</strong>
        </div>
        <button class="btn" on:click={() => navController.navigate("login")}>Volver ahora</button>
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
            radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent), transparent 60%),
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

    .logo {
        width: 56px;
        height: 56px;
        object-fit: contain;
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
    }
</style>
