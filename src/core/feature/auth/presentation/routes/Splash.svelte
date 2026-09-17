<script lang="ts">
    import { onMount } from "svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import type { NavController } from "../../../../../lib/navigation/NavController";
    import {
        getAuthPort,
        isExternalAuthProvider,
        resolveAuthProvider,
    } from "../../di/authPort.factory";
    import { canAccessDashboard, dashboardDeniedMessage } from "../../domain/config/RoleConfig";
    import { userLikeFromAuthSession } from "../../domain/util/authSessionBridge";
    import alejoIcon from "/alejoicon_clean.svg";

    export let navController: NavController;

    type SplashStatus = "loading" | "authenticated" | "guest" | "denied";
    let status: SplashStatus = "loading";
    let displayName = "";
    let denyMessage = "";

    /** Hold corto solo si hay sesión OK; sin sesión ir a login ya. */
    const STATUS_HOLD_MS = 500;
    const provider = resolveAuthProvider();

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

    function goHome(userId: string) {
        logger.info(`[Auth] navigate → home id=${userId.slice(0, 12)}…`);
        navController.navigate("home", { id: userId });
    }

    /** Sin sesión / sin port → login (Login auto-redirige a Clerk). */
    function goLogin(reason: string) {
        logger.info(`[Auth] Splash → login (${reason})`);
        navController.navigate("login");
    }

    onMount(async () => {
        status = "loading";
        try {
            if (!isExternalAuthProvider()) {
                logger.warn(
                    `[Auth] Splash: provider=${provider} no soportado en Core6 panel → login`,
                );
                goLogin("provider-unsupported");
                return;
            }

            const authPort = getAuthPort();
            if (!authPort) {
                logger.error(`[Auth] Splash: ${provider} activo pero sin port`);
                goLogin("no-auth-port");
                return;
            }

            logger.info(`[Auth] Splash: provider=${provider}`);
            await authPort.init();
            await authPort.handleRedirectCallback();
            const session = await authPort.getSession();
            if (!session) {
                goLogin(`sin-sesión-${provider}`);
                return;
            }
            logger.info(
                `[Auth] Splash: sesión OK roles=[${session.roles.join(",") || "none"}]`,
            );
            const user = userLikeFromAuthSession(session);
            if (!canAccessDashboard(user.role)) {
                logger.warn(`[Auth] acceso denegado role=${user.role}`);
                denyMessage = dashboardDeniedMessage();
                await holdStatus("denied", resolveDisplayName(user));
                navController.navigate("unauthorized", {
                    message: denyMessage,
                });
                return;
            }
            await holdStatus("authenticated", resolveDisplayName(user));
            goHome(user.id);
        } catch (e) {
            logger.error(
                `[Auth] Splash error: ${e instanceof Error ? e.message : String(e)}`,
            );
            goLogin("splash-error");
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
            ? `${provider}`
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
