<script lang="ts">

    import type {NavController} from "../../../../lib/navigation/NavController";

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
            imageUrl: "https://us.ecoflow.com/cdn/shop/files/ecoflow-ecoflow-delta-pro-ultra-whole-home-backup-power-ul-9540-certificated-dpu-bundle-delta-pro-ultra-1-x-inverter-1-x-battery-1179495744.png?v=1767511531&width=1240"
        },
        {
            id: "2",
            title: "BMS",
            subtitle: "Battery Safety",
            imageUrl: "https://www.anernstore.com/cdn/shop/articles/Technician_troubleshooting_a_LiFePO4_battery_BMS_w.png?v=1761728830&width=1200"
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
            imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=900&q=80"
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
<section class="landing-screen" aria-label="Landing">
    <div class="content-shell">
        <section class="landing-title">
            <img src="/public/ilustration/undraw_road-sign_navigation_gray.svg" alt="" class="title-icon" aria-hidden="true"/>
            <h1>Bienvenido</h1>
            <p>Inicia sesión o crea tu cuenta para continuar.</p>
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
                                <img class="media-image" src={item.imageUrl} alt={item.title} loading="lazy" decoding="async" />
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

        <section class="landing-buttons">
            <button class="btn btn-primary" on:click={signIn}>Iniciar sesión</button>
            <button class="btn btn-elevated" on:click={signUp}>Crear cuenta</button>
        </section>
    </div>
</section>

<style>
    .landing-screen {
        width: 100%;
        display: grid;
        place-items: center;
        padding: 32px 24px;
        background:
                radial-gradient(circle at 50% 12%, color-mix(in srgb, var(--md-sys-color-primary) 28%, transparent) 0%, transparent 48%),
                var(--md-sys-color-background);
        color: var(--md-sys-color-on-background);
    }

    .content-shell {
        width: min(100%, 1060px);
        height: 100%;
        display: grid;
        align-content: center;
        gap: 24px;
    }

    .landing-title {
        display: grid;
        justify-items: self-start;
        text-align: center;
        gap: 10px;
        animation: reveal 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    .title-icon {
        width: 172px;
        height: 172px;
        display: grid;
        place-items: center;
        box-shadow: 0 4px 14px color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
        animation: glow 2.8s ease-in-out infinite alternate;
    }

    h1 {
        margin: 0;
        font-size: clamp(2rem, 3.6vw, 2.4rem);
        line-height: 1.12;
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
        min-height: 350px;
        align-content: center;
    }

    .row-mask {
        overflow: hidden;
        width: 100%;
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
        width: clamp(170px, 26vw, 250px);
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
        gap: 12px;
    }

    .btn {
        width: 100%;
        height: 52px;
        border-radius: 16px;
        border: 0;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 180ms ease, background-color 180ms ease;
    }

    .btn:active { transform: translateY(1px); }

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

    @media (orientation: landscape) and (max-height: 600px) {
        .content-shell {
            min-height: 100%;
            grid-template-columns: minmax(260px, 1fr) minmax(340px, 1.4fr);
            grid-template-rows: 1fr auto;
            column-gap: 24px;
            row-gap: 16px;
            align-items: center;
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

        .landing-title {
            justify-items: start;
            text-align: left;
            align-self: end;
        }

        .auto-scroll {
            grid-column: 2;
            grid-row: 1 / span 2;
        }

        .landing-buttons {
            justify-self: start;
            width: min(100%, 320px);
        }
    }

    @keyframes marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
    }

    @keyframes marquee-reverse {
        from { transform: translateX(-50%); }
        to { transform: translateX(0); }
    }

    @keyframes reveal {
        from { opacity: 0; transform: translateY(28px); }
        to { opacity: 1; transform: translateY(0); }
    }

    @keyframes glow {
        from { opacity: 0.15; }
        to { opacity: 0.35; }
    }
</style>