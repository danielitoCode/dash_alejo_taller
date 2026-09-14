<script lang="ts">
    import { onMount } from "svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import { getAuthPort } from "../../di/authPort.factory";
    import { canAccessDashboard, dashboardDeniedMessage } from "../../domain/config/RoleConfig";
    import { authContainer } from "../../di/auth.container";
    import { userLikeFromAuthSession } from "../../domain/util/authSessionBridge";
    import alejoIcon from "/alejoicon_clean.svg";

    export let navController: NavController;

    type SplashStatus = "loading" | "authenticated" | "guest" | "denied";
    let status: SplashStatus = "loading";
    let displayName = "";
    let denyMessage = "";

    const STATUS_HOLD_MS = 900;

    function sleep(ms: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    async function holdStatus(next: SplashStatus, name = "") {
        status = next;
        displayName = name;
        await sleep(STATUS_HOLD_MS);
    }

    function resolveDisplayName(user: { name?: string; email?: string }): string {
        const name = typeof user?.name === "string" ? user.name.trim() : "";
        if (name) return name;
        const email = typeof user?.email === "string" ? user.email.trim() : "";
        if (email.includes("@")) return email.split("@")[0] || email;
        return email || "usuario";
    }

    onMount(async () => {
        status = "loading";
        try {
            const authPort = getAuthPort();

            if (authPort) {
                logger.info("[Auth] Splash: provider=auth0");
                await authPort.init();
                await authPort.handleRedirectCallback();
                const session = await authPort.getSession();
                if (!session) {
                    logger.info("[Auth] Splash: sin sesión Auth0 → welcome");
                    await holdStatus("guest");
                    navController.navigate("welcome");
                    return;
                }
                logger.info(`[Auth] Splash: sesión OK roles=[${session.roles.join(",")}]`);
                const user = userLikeFromAuthSession(session);
                if (!canAccessDashboard(user.role)) {
                    logger.warn(`[Auth] acceso denegado role=${user.role}`);
                    denyMessage = dashboardDeniedMessage();
                    await holdStatus("denied", resolveDisplayName(user));
                    navController.navigate("unauthorized");
                    return;
                }
                await holdStatus("authenticated", resolveDisplayName(user));
                navController.resetTo("dashboard", { id: user.id });
                return;
            }

            logger.info("[Auth] Splash: provider=appwrite (legacy)");
            const user = await authContainer.useCases.accounts.getCurrentUser();
            if (!canAccessDashboard(user.role)) {
                logger.warn(`[Auth] acceso denegado role=${user.role}`);
                denyMessage = dashboardDeniedMessage();
                await holdStatus("denied", resolveDisplayName(user));
                navController.navigate("unauthorized");
                return;
            }
            await holdStatus("authenticated", resolveDisplayName(user));
            navController.resetTo("dashboard", { id: user.$id ?? user.id });
        } catch (e) {
            logger.error(
                `[Auth] Splash error: ${e instanceof Error ? e.message : String(e)}`,
            );
            await holdStatus("guest");
            navController.navigate("welcome");
        }
    });

    $: title =
        status === "loading"
            ? "Comprobando sesión…"
            : status === "authenticated"
              ? `Bienvenido${displayName ? `, ${displayName}` : ""}`
              : status === "denied"
                ? "Sin acceso al panel"
                : "Entrando…";

    $: subtitle =
        status === "loading"
            ? "Auth0 / sesión de staff"
            : status === "authenticated"
              ? "Abriendo panel de gestión"
              : status === "denied"
                ? denyMessage || "Tu rol no tiene permiso"
                : "Redirigiendo";
</script>

<div class="splash" role="status" aria-live="polite">
    <div class="stage">
        <img src={alejoIcon} class="logo" alt="AlejoTaller" />
        <p class="title">{title}</p>
        <p class="subtitle">{subtitle}</p>
        {#if status === "loading"}
            <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
        {/if}
    </div>
</div>

<style>
    .splash {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        background: var(--md-sys-color-background);
        color: var(--md-sys-color-on-background);
        padding: 24px;
    }
    .stage {
        display: grid;
        justify-items: center;
        gap: 12px;
        text-align: center;
        max-width: 22rem;
    }
    .logo {
        width: 120px;
        height: 120px;
        object-fit: contain;
    }
    .title {
        margin: 0;
        font-weight: 800;
        font-size: 1.15rem;
    }
    .subtitle {
        margin: 0;
        font-size: 0.88rem;
        color: var(--md-sys-color-on-surface-variant);
    }
    .dots {
        display: flex;
        gap: 6px;
        margin-top: 8px;
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
    @keyframes pulse {
        0%,
        100% {
            opacity: 0.3;
        }
        50% {
            opacity: 1;
        }
    }
</style>
