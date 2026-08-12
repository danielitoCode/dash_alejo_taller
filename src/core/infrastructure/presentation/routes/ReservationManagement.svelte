<script lang="ts">
    import type { NavController } from "../../../../lib/navigation/NavController";
    import Icon from "../components/Icon.svelte";
    import { CalendarCheck2, Clock, Wrench } from "lucide-svelte";

    export let navController: NavController;
    // Reservado para Core futuro: turnos de reparación de equipos (no pedidos de tienda).
    void navController;
</script>

<section class="mgmt-screen" aria-label="Reservas de taller">
    <div class="mgmt-container">
        <header class="mgmt-page-head">
            <div class="mgmt-page-title">
                <h1 class="mgmt-h1">Reservas</h1>
                <p class="mgmt-muted">
                    Turnos para reparaciones de equipos en el taller. No gestiona pedidos de la tienda.
                </p>
            </div>
            <div class="mgmt-chip-row">
                <span class="mgmt-chip">
                    <Icon icon={CalendarCheck2} size={18} ariaLabel="Agenda" />
                    Agenda de taller
                </span>
                <span class="mgmt-chip muted-chip">
                    <Icon icon={Clock} size={18} ariaLabel="Próximo" />
                    Core futuro
                </span>
            </div>
        </header>

        <section class="mgmt-card placeholder-card">
            <div class="placeholder-ico" aria-hidden="true">
                <Icon icon={Wrench} size={28} ariaLabel="" />
            </div>
            <h2 class="placeholder-title">Próximamente: citas de reparación</h2>
            <p class="placeholder-body">
                Aquí se programarán y supervisarán las reservas de turno de los clientes para diagnóstico y
                reparación de equipos. Los pedidos de compra con stock reservado se gestionan en
                <strong> Ventas → Pendientes</strong>.
            </p>
            <ul class="placeholder-list">
                <li>Reserva de franja horaria en el taller</li>
                <li>Cliente, equipo y tipo de servicio</li>
                <li>Estados del turno (solicitado, confirmado, atendido…)</li>
            </ul>
        </section>
    </div>
</section>

<style>
    .muted-chip {
        opacity: 0.9;
        border-style: dashed;
    }

    .placeholder-card {
        display: grid;
        gap: 12px;
        justify-items: start;
        padding: 22px 20px;
        max-width: 640px;
    }

    .placeholder-ico {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
        color: var(--md-sys-color-primary);
    }

    .placeholder-title {
        margin: 0;
        font-size: 1.15rem;
        font-weight: 900;
        letter-spacing: -0.01em;
    }

    .placeholder-body {
        margin: 0;
        line-height: 1.45;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 82%, transparent);
        font-size: 0.95rem;
    }

    .placeholder-list {
        margin: 4px 0 0;
        padding-left: 1.15rem;
        display: grid;
        gap: 6px;
        color: color-mix(in srgb, var(--md-sys-color-on-background) 78%, transparent);
        font-size: 0.9rem;
    }
</style>
