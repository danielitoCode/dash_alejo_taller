<script lang="ts">
    import Screen from "../components/Screen.svelte";
    import Icon from "../components/Icon.svelte";
    import type { NavController } from "../../../../lib/navigation/NavController";
    import { LogIn, UserPlus } from "lucide-svelte";

    export let navController: NavController;

    type ShowcaseItem = {
        id: string;
        title: string;
        subtitle: string;
        imageUrl: string;
    };

    const baseItems: ShowcaseItem[] = [
        {
            id: "1",
            title: "EcoFlow",
            subtitle: "Power · Solar",
            imageUrl:
                "https://us.ecoflow.com/cdn/shop/files/ecoflow-ecoflow-delta-pro-ultra-whole-home-backup-power-ul-9540-certificated-dpu-bundle-delta-pro-ultra-1-x-inverter-1-x-battery-1179495744.png?v=1767511531&width=1240"
        },
        {
            id: "2",
            title: "BMS",
            subtitle: "Battery Safety",
            imageUrl:
                "https://www.anernstore.com/cdn/shop/articles/Technician_troubleshooting_a_LiFePO4_battery_BMS_w.png?v=1761728830&width=1200"
        },
        {
            id: "3",
            title: "LI3-2A",
            subtitle: "Controller",
            imageUrl: "https://lian-li.com/wp-content/uploads/2024/10/TL_Controller_02a.jpg"
        },
        {
            id: "4",
            title: "T2N3904",
            subtitle: "Electronics",
            imageUrl:
                "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80"
        }
    ];

    const rows = [
        { id: 0, reverse: false, speed: 48, items: [...baseItems, ...baseItems] },
        { id: 1, reverse: true, speed: 56, items: [...baseItems, ...baseItems] },
        { id: 2, reverse: false, speed: 64, items: [...baseItems, ...baseItems] }
    ];

    function signIn() {
        navController.navigate("login");
    }

    function signUp() {
        navController.navigate("register");
    }
</script>

<Screen ariaLabel="Welcome" scrollable={false}>
    <section class="landing-screen" aria-label="Landing">
        <div class="content-shell">
            <section class="landing-left" aria-label="Acciones">
                <section class="landing-title" aria-label="Bienvenida">
                    <img src="/alejoicon_clean.svg" alt="Logo" class="brand-mark" />
                    <h1>Bienvenido</h1>
                    <p>Inicia sesión o crea tu cuenta para continuar.</p>
                </section>

                <section class="landing-buttons" aria-label="Navegación">
                    <button class="btn btn-primary" on:click={signIn}>
                        <Icon icon={LogIn} size={18} className="btn-ico" ariaLabel="Iniciar sesión" />
                        Iniciar sesión
                    </button>
                    <button class="btn btn-elevated" on:click={signUp}>
                        <Icon icon={UserPlus} size={18} className="btn-ico" ariaLabel="Crear cuenta" />
                        Crear cuenta
                    </button>
                </section>
            </section>

            <section class="auto-scroll" aria-label="Galería automática">
                {#each rows as row}
                    <div class="row-mask">
                        <div
                            class="row-track {row.reverse ? 'reverse' : ''}"
                            style={`--duration:${Math.max(18, 220 / row.speed)}s`}
                        >
                            {#each row.items as item, idx (`${row.id}-${item.id}-${idx}`)}
                                <article class="media-card" aria-label={item.title}>
                                    <img
                                        class="media-image"
                                        src={item.imageUrl}
                                        alt={item.title}
                                        loading="lazy"
                                        decoding="async"
                                    />
                                    <div class="media-overlay">
                                        <span class="media-title">{item.title}</span>
                                        <span class="media-subtitle">{item.subtitle}</span>
                                    </div>
                                </article>
                            {/each}
                        </div>
                    </div>
                {/each}
            </section>
        </div>
    </section>
</Screen>

<style>
    .landing-screen {
        width: 100%;
        height: 100%;
        display: grid;
        place-items: center;
        --screen-pad: clamp(10px, 2.2vw, 16px);
        --card-size: clamp(150px, 18vmin, 220px);
        padding: var(--screen-pad);
        padding:
            calc(var(--screen-pad) + env(safe-area-inset-top))
            calc(var(--screen-pad) + env(safe-area-inset-right))
            calc(var(--screen-pad) + env(safe-area-inset-bottom))
            calc(var(--screen-pad) + env(safe-area-inset-left));
        overflow: hidden;
        position: relative;
        background:
            radial-gradient(
                circle at 50% 12%,
                color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent) 0%,
                transparent 48%
            ),
            var(--md-sys-color-background);
        color: var(--md-sys-color-on-background);
    }

    .content-shell {
        width: min(100%, 1180px);
        height: 100%;
        display: grid;
        align-content: center;
        gap: clamp(16px, 2.4vw, 24px);
        position: relative;
    }

    .landing-left {
        display: grid;
        justify-items: center;
        gap: 14px;
        z-index: 1;
        padding: clamp(14px, 2.4vw, 18px);
        border-radius: 26px;
        background: color-mix(in srgb, var(--md-sys-color-background) 72%, transparent);
        border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
        box-shadow: 0 16px 40px color-mix(in srgb, black 22%, transparent);
    }

    .landing-title {
        display: grid;
        justify-items: center;
        text-align: center;
        gap: 8px;
        animation: reveal 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .brand-mark {
        width: clamp(44px, 9vw, 56px);
        height: clamp(44px, 9vw, 56px);
        display: block;
        object-fit: contain;
        opacity: 0.95;
    }

    h1 {
        margin: 0;
        font-size: clamp(1.9rem, 3.3vw, 2.35rem);
        line-height: 1.12;
        letter-spacing: -0.02em;
    }

    p {
        margin: 0;
        max-width: 460px;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 90%, transparent);
        font-size: clamp(1rem, 2vw, 1.1rem);
    }

    .auto-scroll {
        display: grid;
        gap: 20px;
        min-height: 0;
        align-content: center;
        z-index: 0;
    }

    .row-mask {
        overflow: hidden;
        width: 100%;
        height: var(--card-size);
        mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    }

    .row-track {
        display: flex;
        width: max-content;
        gap: 18px;
        will-change: transform;
        animation: marquee var(--duration) linear infinite;
    }

    .row-track.reverse {
        animation-name: marquee-reverse;
    }

    .auto-scroll:hover .row-track {
        animation-play-state: paused;
    }

    .media-card {
        width: var(--card-size);
        aspect-ratio: 1;
        border-radius: 30px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2);
        border: 1px solid color-mix(in srgb, white 28%, transparent);
        background: var(--md-sys-color-surface-variant);
    }

    .media-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        transform: scale(1.02);
    }

    .media-overlay {
        position: absolute;
        inset: auto 0 0;
        display: grid;
        gap: 2px;
        padding: 16px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.66), rgba(0, 0, 0, 0.08));
        color: #fff;
    }

    .media-title {
        font-weight: 700;
        letter-spacing: 0.02em;
    }

    .media-subtitle {
        font-size: 0.88rem;
        opacity: 0.92;
    }

    .landing-buttons {
        width: min(100%, 420px);
        justify-self: center;
        display: grid;
        gap: 10px;
    }

    .btn {
        width: 100%;
        height: 50px;
        border-radius: 16px;
        border: 0;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 180ms ease, background-color 180ms ease, filter 180ms ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }

    .btn:active {
        transform: translateY(1px);
    }

    .btn-primary {
        color: var(--md-sys-color-on-primary);
        background: var(--md-sys-color-primary);
        box-shadow: 0 8px 16px color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
    }

    .btn-elevated {
        color: var(--md-sys-color-on-surface);
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 6px 14px color-mix(in srgb, var(--md-sys-color-outline) 24%, transparent);
    }

    .btn:hover {
        filter: brightness(1.04);
    }

    .btn-ico {
        opacity: 0.95;
    }

    /* Mobile / tablet: el carrusel queda detrás con opacidad + degradado para legibilidad */
    @media (max-width: 1023px) {
        .content-shell {
            grid-template-columns: 1fr;
            place-items: center;
        }

        .auto-scroll {
            position: absolute;
            inset: -12% -24%;
            opacity: 0.18;
            pointer-events: none;
            filter: saturate(0.9) contrast(1.05);
        }

        .landing-screen::after {
            content: "";
            position: absolute;
            inset: 0;
            z-index: 0;
            background:
                radial-gradient(
                    circle at 50% 0%,
                    color-mix(in srgb, var(--md-sys-color-background) 30%, transparent) 0%,
                    transparent 60%
                ),
                linear-gradient(
                    to bottom,
                    color-mix(in srgb, var(--md-sys-color-background) 92%, transparent) 0%,
                    color-mix(in srgb, var(--md-sys-color-background) 70%, transparent) 45%,
                    color-mix(in srgb, var(--md-sys-color-background) 92%, transparent) 100%
                );
            pointer-events: none;
        }

        .landing-left {
            z-index: 1;
            width: min(100%, 460px);
            backdrop-filter: blur(10px);
        }
    }

    @media (orientation: landscape) and (max-height: 600px) {
        .content-shell {
            min-height: 100%;
            grid-template-columns: minmax(260px, 1fr) minmax(340px, 1.4fr);
            grid-template-rows: 1fr auto;
            column-gap: clamp(18px, 3vw, 36px);
            row-gap: 16px;
            align-items: center;
        }

        .landing-left {
            justify-items: start;
        }

        .landing-title {
            justify-items: start;
            text-align: left;
            align-self: end;
        }

        .auto-scroll {
            grid-column: 2;
            grid-row: 1 / span 2;
            min-height: 260px;
            position: static;
            inset: auto;
            opacity: 1;
            pointer-events: auto;
            filter: none;
        }

        .landing-buttons {
            width: min(100%, 300px);
            justify-self: start;
            align-self: start;
        }
    }

    @media (min-width: 1024px) {
        .content-shell {
            grid-template-columns: minmax(280px, 0.9fr) minmax(420px, 1.3fr);
            grid-template-rows: 1fr auto;
            align-items: center;
            min-height: min(84dvh, 760px);
        }

        .landing-left {
            justify-items: start;
            background: transparent;
            border-color: transparent;
            box-shadow: none;
            padding: 0;
        }

        .landing-title {
            justify-items: start;
            text-align: left;
            align-self: end;
        }

        .auto-scroll {
            grid-column: 2;
            grid-row: 1 / span 2;
            position: static;
            inset: auto;
            opacity: 1;
            pointer-events: auto;
            filter: none;
        }

        .landing-buttons {
            justify-self: start;
            width: min(100%, 320px);
        }
    }

    @keyframes marquee {
        from {
            transform: translateX(0);
        }
        to {
            transform: translateX(-50%);
        }
    }

    @keyframes marquee-reverse {
        from {
            transform: translateX(-50%);
        }
        to {
            transform: translateX(0);
        }
    }

    @keyframes reveal {
        from {
            opacity: 0;
            transform: translateY(28px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>

