<script lang="ts">
    import { onMount } from "svelte";
    import type { NavController } from "../../../../lib/navigation/NavController";

    /** Inyectado por el shell de navegación (opcional). */
    export let navController: NavController | undefined = undefined;
    void navController;

    import Icon from "../components/Icon.svelte";
    import LoadingSpinner from "../components/LoadingSpinner.svelte";
    import { toastStore } from "../viewmodel/toast.store";
    import { reservationStore } from "../../../feature/reservation/presentation/viewmodel/reservation.store";
    import {
        WORKSHOP_RESERVATION_STATUSES,
        WORKSHOP_RESERVATION_STATUS_LABELS,
        WORKSHOP_SERVICE_TYPES,
        WORKSHOP_SERVICE_TYPE_LABELS,
        type WorkshopReservationStatus,
    } from "../../../feature/reservation/domain/entity/enums";
    import type { WorkshopReservation } from "../../../feature/reservation/domain/entity/WorkshopReservation";
    import {
        CalendarCheck2,
        Clock,
        Phone,
        Plus,
        RefreshCw,
        User,
        Wrench,
    } from "lucide-svelte";

    let statusFilter: WorkshopReservationStatus | "all" = "all";
    let showForm = false;

    let clientName = "";
    let clientPhone = "";
    let equipment = "";
    let serviceType = "reparacion";
    let scheduledLocal = "";
    let durationMinutes = 60;
    let notes = "";
    let formError = "";

    onMount(() => {
        void load();
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(10, 0, 0, 0);
        scheduledLocal = toLocalInput(d);
    });

    function toLocalInput(d: Date): string {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function formatWhen(iso: string): string {
        const t = Date.parse(iso);
        if (!Number.isFinite(t)) return iso;
        return new Date(t).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    }

    async function load(): Promise<void> {
        try {
            await reservationStore.load(statusFilter);
        } catch (e: any) {
            toastStore.error(e?.message ?? "No se pudieron cargar las reservas");
        }
    }

    async function onFilter(s: WorkshopReservationStatus | "all"): Promise<void> {
        statusFilter = s;
        await load();
    }

    async function submitForm(): Promise<void> {
        formError = "";
        const name = clientName.trim();
        const eq = equipment.trim();
        if (!name) {
            formError = "Indica el nombre del cliente";
            return;
        }
        if (!eq) {
            formError = "Describe el equipo";
            return;
        }
        if (!scheduledLocal) {
            formError = "Indica fecha y hora del turno";
            return;
        }
        const iso = new Date(scheduledLocal).toISOString();
        if (!Number.isFinite(Date.parse(iso))) {
            formError = "Fecha/hora inválida";
            return;
        }
        try {
            await reservationStore.create({
                clientName: name,
                clientPhone: clientPhone.trim() || undefined,
                equipment: eq,
                serviceType: serviceType.trim() || "otro",
                scheduledAtIso: iso,
                durationMinutes: durationMinutes || 60,
                notes: notes.trim() || undefined,
                status: "requested",
            });
            toastStore.success("Reserva creada");
            showForm = false;
            clientName = "";
            clientPhone = "";
            equipment = "";
            notes = "";
            await load();
        } catch (e: any) {
            formError = e?.message ?? "Error al crear la reserva";
            toastStore.error(formError);
        }
    }

    async function changeStatus(r: WorkshopReservation, status: WorkshopReservationStatus): Promise<void> {
        if (r.status === status) return;
        try {
            await reservationStore.setStatus(r.id, status);
            toastStore.success(`Estado → ${WORKSHOP_RESERVATION_STATUS_LABELS[status]}`);
        } catch (e: any) {
            toastStore.error(e?.message ?? "No se pudo actualizar el estado");
        }
    }

    $: items = $reservationStore.items;
    $: loading = $reservationStore.loading;
    $: saving = $reservationStore.saving;
</script>

<section class="mgmt-page res-page" aria-label="Reservas de taller">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Reservas de taller</h1>
                <p class="mgmt-subtitle">
                    Turnos de diagnóstico y reparación. No gestiona pedidos de la tienda (eso es Ventas).
                </p>
            </div>
            <div class="mgmt-meta res-actions">
                <button type="button" class="btn-secondary" on:click={() => load()} disabled={loading} title="Actualizar listado">
                    <Icon icon={RefreshCw} size={16} ariaLabel="" />
                    Actualizar
                </button>
                <button type="button" class="btn-primary" on:click={() => (showForm = !showForm)}>
                    <Icon icon={Plus} size={16} ariaLabel="" />
                    {showForm ? "Cerrar" : "Nueva reserva"}
                </button>
            </div>
        </div>
    </header>

    <div class="res-filters" role="tablist" aria-label="Filtrar por estado">
        <button type="button" class="res-chip" class:active={statusFilter === "all"} on:click={() => onFilter("all")}>Todas</button>
        {#each WORKSHOP_RESERVATION_STATUSES as st}
            <button type="button" class="res-chip" class:active={statusFilter === st} on:click={() => onFilter(st)}>
                {WORKSHOP_RESERVATION_STATUS_LABELS[st]}
            </button>
        {/each}
    </div>

    {#if showForm}
        <section class="mgmt-card res-form" aria-label="Nueva reserva">
            <h2 class="res-form-title">Nueva reserva</h2>
            <div class="res-form-grid">
                <label class="res-field">
                    <span>Cliente *</span>
                    <input bind:value={clientName} placeholder="Nombre completo" maxlength="128" />
                </label>
                <label class="res-field">
                    <span>Teléfono</span>
                    <input bind:value={clientPhone} placeholder="+53 …" maxlength="32" />
                </label>
                <label class="res-field res-span-2">
                    <span>Equipo *</span>
                    <input bind:value={equipment} placeholder="Ej. iPhone 12 — pantalla rota" maxlength="256" />
                </label>
                <label class="res-field">
                    <span>Servicio</span>
                    <select bind:value={serviceType}>
                        {#each WORKSHOP_SERVICE_TYPES as t}
                            <option value={t}>{WORKSHOP_SERVICE_TYPE_LABELS[t]}</option>
                        {/each}
                    </select>
                </label>
                <label class="res-field">
                    <span>Fecha y hora *</span>
                    <input type="datetime-local" bind:value={scheduledLocal} />
                </label>
                <label class="res-field">
                    <span>Duración (min)</span>
                    <input type="number" min="15" step="15" bind:value={durationMinutes} />
                </label>
                <label class="res-field res-span-2">
                    <span>Notas</span>
                    <textarea bind:value={notes} rows="2" maxlength="1024" placeholder="Observaciones opcionales"></textarea>
                </label>
            </div>
            {#if formError}<p class="res-form-error">{formError}</p>{/if}
            <div class="res-form-actions">
                <button type="button" class="btn-secondary" on:click={() => (showForm = false)}>Cancelar</button>
                <button type="button" class="btn-primary" on:click={submitForm} disabled={saving}>
                    {saving ? "Guardando…" : "Crear reserva"}
                </button>
            </div>
        </section>
    {/if}

    {#if loading && items.length === 0}
        <div class="res-loading"><LoadingSpinner size={28} label="Cargando reservas" /></div>
    {:else if items.length === 0}
        <section class="mgmt-card res-empty">
            <div class="res-empty-ico"><Icon icon={CalendarCheck2} size={28} ariaLabel="" /></div>
            <h2>No hay reservas en este filtro</h2>
            <p>Crea una reserva o cambia el filtro de estado.</p>
        </section>
    {:else}
        <div class="res-list" aria-label="Listado de reservas">
            {#each items as r (r.id)}
                <article class="mgmt-card res-card" data-status={r.status}>
                    <div class="res-card-top">
                        <div class="res-when">
                            <Icon icon={Clock} size={16} ariaLabel="" />
                            <strong>{formatWhen(r.scheduledAtIso)}</strong>
                            {#if r.durationMinutes}<span class="res-dur">{r.durationMinutes} min</span>{/if}
                        </div>
                        <span class="res-status">{WORKSHOP_RESERVATION_STATUS_LABELS[r.status]}</span>
                    </div>
                    <div class="res-card-body">
                        <div class="res-row">
                            <Icon icon={User} size={16} ariaLabel="" />
                            <span>{r.clientName}</span>
                            {#if r.clientPhone}
                                <span class="res-phone"><Icon icon={Phone} size={14} ariaLabel="" />{r.clientPhone}</span>
                            {/if}
                        </div>
                        <div class="res-row">
                            <Icon icon={Wrench} size={16} ariaLabel="" />
                            <span>{r.equipment}</span>
                            <span class="res-svc">{r.serviceType}</span>
                        </div>
                        {#if r.notes}<p class="res-notes">{r.notes}</p>{/if}
                    </div>
                    <div class="res-card-actions">
                        <label class="res-status-select">
                            <span class="sr-only">Cambiar estado</span>
                            <select
                                value={r.status}
                                disabled={saving}
                                on:change={(e) =>
                                    changeStatus(
                                        r,
                                        (e.currentTarget as HTMLSelectElement).value as WorkshopReservationStatus
                                    )}
                            >
                                {#each WORKSHOP_RESERVATION_STATUSES as st}
                                    <option value={st}>{WORKSHOP_RESERVATION_STATUS_LABELS[st]}</option>
                                {/each}
                            </select>
                        </label>
                    </div>
                </article>
            {/each}
        </div>
    {/if}
</section>

<style>
    .res-page { min-width: 0; }
    .res-actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .btn-primary, .btn-secondary {
        display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px;
        border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer;
        border: 1px solid var(--md-sys-color-outline-variant); background: transparent; color: inherit;
    }
    .btn-primary {
        background: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, var(--md-sys-color-outline-variant));
        color: var(--md-sys-color-primary);
    }
    .res-filters { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 16px; }
    .res-chip {
        padding: 6px 12px; border-radius: 999px; border: 1px solid var(--md-sys-color-outline-variant);
        background: transparent; font-size: 0.8rem; font-weight: 700; cursor: pointer; color: inherit;
    }
    .res-chip.active {
        background: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
        border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
        color: var(--md-sys-color-primary);
    }
    .res-form { margin-bottom: 16px; padding: 16px 18px; }
    .res-form-title { margin: 0 0 12px; font-size: 1.05rem; font-weight: 850; }
    .res-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .res-span-2 { grid-column: 1 / -1; }
    .res-field {
        display: grid; gap: 4px; font-size: 0.8rem; font-weight: 700;
        color: var(--md-sys-color-on-surface-variant);
    }
    .res-field input, .res-field select, .res-field textarea {
        padding: 8px 10px; border-radius: 10px; border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface); color: inherit; font: inherit; font-weight: 500;
    }
    .res-form-error { color: var(--md-sys-color-error); font-size: 0.88rem; margin: 10px 0 0; }
    .res-form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
    .res-loading, .res-empty { text-align: center; padding: 32px 20px; }
    .res-empty-ico {
        width: 52px; height: 52px; margin: 0 auto 12px; border-radius: 16px; display: grid; place-items: center;
        background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent); color: var(--md-sys-color-primary);
    }
    .res-list {
        display: grid; gap: 12px;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
    }
    .res-card {
        padding: 14px 16px; display: grid; gap: 10px;
        border-left: 4px solid var(--md-sys-color-outline-variant);
    }
    .res-card[data-status="requested"] { border-left-color: #a855f7; }
    .res-card[data-status="confirmed"] { border-left-color: #2563eb; }
    .res-card[data-status="in_progress"] { border-left-color: #d97706; }
    .res-card[data-status="completed"] { border-left-color: #16a34a; }
    .res-card[data-status="cancelled"], .res-card[data-status="no_show"] {
        border-left-color: #94a3b8; opacity: 0.92;
    }
    .res-card-top {
        display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;
    }
    .res-when { display: inline-flex; align-items: center; gap: 6px; font-size: 0.9rem; }
    .res-dur { font-size: 0.75rem; font-weight: 700; opacity: 0.7; }
    .res-status {
        font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em;
        padding: 4px 10px; border-radius: 999px; border: 1px solid var(--md-sys-color-outline-variant);
        background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent);
    }
    .res-card-body { display: grid; gap: 6px; font-size: 0.92rem; }
    .res-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; }
    .res-phone { display: inline-flex; align-items: center; gap: 4px; font-size: 0.84rem; opacity: 0.85; }
    .res-svc {
        font-size: 0.75rem; font-weight: 750; padding: 2px 8px; border-radius: 6px;
        background: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
        color: var(--md-sys-color-primary); text-transform: capitalize;
    }
    .res-notes { margin: 4px 0 0; font-size: 0.84rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.4; }
    .res-card-actions {
        display: flex; justify-content: flex-end;
        border-top: 1px solid var(--md-sys-color-outline-variant); padding-top: 10px;
    }
    .res-status-select select {
        padding: 6px 10px; border-radius: 8px; border: 1px solid var(--md-sys-color-outline-variant);
        background: var(--md-sys-color-surface); color: inherit; font-size: 0.82rem; font-weight: 650;
    }
    .sr-only {
        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
        overflow: hidden; clip: rect(0, 0, 0, 0); border: 0;
    }
    @media (max-width: 640px) {
        .res-form-grid { grid-template-columns: 1fr; }
        .res-span-2 { grid-column: 1; }
        .res-actions { width: 100%; }
        .btn-primary, .btn-secondary { flex: 1 1 auto; justify-content: center; }
    }
</style>
