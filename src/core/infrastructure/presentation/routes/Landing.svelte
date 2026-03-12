<script lang="ts">
    import type { NavController } from "../../../lib/navigation/NavController";

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
<div class="landing-screen">
    <div class="content-shell">
        <section class="landing-title">
            <img src="/public/ilustration/undraw_road-sign_navigation_gray.svg" alt="" class="title-icon" aria-hidden="true"/>
            <h1>Bienvenido</h1>
            <p>Inicia sesión o crea tu cuenta para continuar.</p>
        </section>
        <p>B</p>
    </div>
</div>

<style>
    .landing-screen {
        text-align: center;
        place-items: center;
        height: 100%;
        width: 100%;
        color: var(--md-sys-color-on-background);
    }

    .content-shell {
        display:grid;
        height: 100%;
        width: -webkit-fill-available;
        grid-template-columns:auto auto;
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
</style>