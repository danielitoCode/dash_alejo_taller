<script lang="ts">
    import { onMount } from "svelte";
    import { authContainer } from "../../di/auth.container";
    import { canAccessDashboard, dashboardDeniedMessage } from "../../domain/config/RoleConfig";
    import alejoIcon from "/alejoicon_clean.svg";

    export let navController;

    /** UX bajo el logo — mismo lenguaje visual que tienda web (órbitas + copy) */
    type SplashStatus = "loading" | "welcome" | "unauthorized" | "guest";
    let status: SplashStatus = "loading";
    let displayName = "";
    let busy = true;

    const STATUS_HOLD_MS = 900;

    function sleep(ms: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    function resolveDisplayName(user: any): string {
        const name = typeof user?.name === "string" ? user.name.trim() : "";
        if (name) return name;
        const email = typeof user?.email === "string" ? user.email.trim() : "";
        if (email.includes("@")) return email.split("@")[0] || email;
        return email || "equipo";
    }

    async function holdStatus(next: SplashStatus, name = "") {
        status = next;
        displayName = name;
        await sleep(STATUS_HOLD_MS);
    }

    onMount(async () => {
        status = "loading";
        busy = true;
        try {
            const user = await authContainer.useCases.accounts.getCurrentUser();

            if (!canAccessDashboard(user.role)) {
                await holdStatus("unauthorized", resolveDisplayName(user));
                navController.navigate("unauthorized", {
                    message: dashboardDeniedMessage(),
                });
                return;
            }

            await holdStatus("welcome", resolveDisplayName(user));
            navController.navigate("home", { id: user.id });
        } catch {
            await holdStatus("guest");
            navController.navigate("welcome");
        } finally {
            busy = false;
        }
    });

    $: statusTitle =
        status === "loading"
            ? "Cargando sesión de usuario"
            : status === "welcome"
              ? `Bienvenido${displayName ? `, ${displayName}` : ""}`
              : status === "unauthorized"
                ? "Sin acceso al panel"
                : "Panel de gestión AlejoTaller";

    $: statusSubtitle =
        status === "loading"
            ? "Comprobando permisos del equipo"
            : status === "welcome"
              ? "Entrando al panel de gestión"
              : status === "unauthorized"
                ? "Esta cuenta no tiene acceso al panel de gestión"
                : "Inicia sesión con tu cuenta de staff";

    $: showDots = status === "loading";
    $: orbitActive = busy || status === "loading";
</script>

<div
    class="splash-screen"
    role="status"
    aria-live="polite"
    aria-busy={busy}
    aria-label="Cargando panel AlejoTaller"
>
    <div class="splash-stage">
        <div class="logo-orbit" class:active={orbitActive} aria-hidden="true">
            <span class="ring ring-a"></span>
            <span class="ring ring-b"></span>
            <span class="ring ring-c"></span>
            <img src={alejoIcon} class="app-icon" alt="AlejoTaller" />
        </div>

        <div class="status-block">
            <p class="status-title">{statusTitle}</p>
            <p class="status-subtitle">{statusSubtitle}</p>
            {#if showDots}
                <div class="dots" aria-hidden="true">
                    <span></span><span></span><span></span>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    .splash-screen {
        width: 100%;
        height: 100dvh;
        display: grid;
        place-items: center;
        background:
            radial-gradient(
                circle at 50% 38%,
                color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent),
                transparent 52%
            ),
            var(--md-sys-color-background);
        color: var(--md-sys-color-on-background);
        position: relative;
        padding: 24px;
        box-sizing: border-box;
    }

    .splash-stage {
        display: grid;
        justify-items: center;
        gap: 28px;
        width: min(100%, 420px);
    }

    .logo-orbit {
        position: relative;
        width: 220px;
        height: 220px;
        display: grid;
        place-items: center;
    }

    .app-icon {
        width: 180px;
        height: 180px;
        object-fit: contain;
        color: var(--md-sys-color-on-background);
        position: relative;
        z-index: 1;
        filter: drop-shadow(0 12px 28px color-mix(in srgb, black 22%, transparent));
    }

    .ring {
        position: absolute;
        border-radius: 50%;
        border: 2px solid transparent;
        pointer-events: none;
        opacity: 0.95;
    }

    .ring-a {
        inset: 0;
        border-top-color: var(--md-sys-color-primary);
        border-right-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    }

    .ring-b {
        inset: 14px;
        border-bottom-color: var(--md-sys-color-tertiary, #c9a227);
        border-left-color: color-mix(
            in srgb,
            var(--md-sys-color-tertiary, #c9a227) 40%,
            transparent
        );
    }

    .ring-c {
        inset: 28px;
        border-top-color: color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent);
        border-left-color: color-mix(
            in srgb,
            var(--md-sys-color-outline-variant, #888) 55%,
            transparent
        );
        opacity: 0.7;
    }

    .logo-orbit.active .ring-a {
        animation: spin 1.15s linear infinite;
    }

    .logo-orbit.active .ring-b {
        animation: spin 1.7s linear infinite reverse;
    }

    .logo-orbit.active .ring-c {
        animation: spin 2.4s linear infinite;
    }

    .status-block {
        display: grid;
        gap: 8px;
        text-align: center;
        max-width: 22rem;
        animation: fade-up 0.35s ease both;
    }

    .status-title {
        margin: 0;
        font-size: clamp(1.05rem, 2.6vw, 1.25rem);
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--md-sys-color-on-surface);
        line-height: 1.3;
    }

    .status-subtitle {
        margin: 0;
        font-size: 0.84rem;
        line-height: 1.45;
        color: var(--md-sys-color-on-surface-variant);
    }

    .dots {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 6px;
    }

    .dots span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--md-sys-color-primary);
        opacity: 0.35;
        animation: pulse 1.2s ease-in-out infinite;
    }

    .dots span:nth-child(2) {
        animation-delay: 0.18s;
    }

    .dots span:nth-child(3) {
        animation-delay: 0.36s;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.3;
            transform: translateY(0);
        }
        50% {
            opacity: 1;
            transform: translateY(-3px);
        }
    }

    @keyframes fade-up {
        from {
            opacity: 0;
            transform: translateY(8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .logo-orbit.active .ring-a,
        .logo-orbit.active .ring-b,
        .logo-orbit.active .ring-c,
        .dots span {
            animation: none !important;
        }

        .status-block {
            animation: none !important;
        }
    }
</style>
