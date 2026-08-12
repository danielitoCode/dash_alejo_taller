<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import LoadingSpinner from "../../../../infrastructure/presentation/components/LoadingSpinner.svelte";
    import SkeletonList from "../../../../infrastructure/presentation/components/SkeletonList.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import {
        canManageRole,
        assignableRoles,
    } from "../../domain/config/RoleConfig";
    import {
        userManagementStore,
        type BusinessRole,
    } from "../viewmodel/user-management.store";
    import { BadgeCheck, KeyRound, Lock, Search, Trash2, Unlock, UserPlus, Users } from "lucide-svelte";

    let name = "";
    let email = "";
    let password = "";
    let role: BusinessRole = "viewer";
    let query = "";
    let searchTimer: number | null = null;

    $: managerRole = $userManagementStore.managerRole ?? "viewer";
    $: rolesForCreate = assignableRoles(managerRole);
    $: if (!rolesForCreate.includes(role) && rolesForCreate.length > 0) {
        role = rolesForCreate[rolesForCreate.length - 1];
    }

    function rolesForUser(targetRole: BusinessRole): BusinessRole[] {
        if (!canManageRole(managerRole, targetRole)) {
            return [targetRole];
        }
        return assignableRoles(managerRole);
    }

    function canTouchUser(targetRole: BusinessRole): boolean {
        return canManageRole(managerRole, targetRole);
    }

    async function createUser() {
        if (!name.trim() || !email.trim() || password.length < 6) return;
        if (!canManageRole(managerRole, role)) {
            toastStore.error(`Tu rol (${managerRole}) no puede crear usuarios ${role}.`);
            return;
        }
        try {
            toastStore.info("Creando usuario...");
            await userManagementStore.createUser({
                name: name.trim(),
                email: email.trim(),
                password,
                role,
            });
            toastStore.success("Usuario creado.");
            name = "";
            email = "";
            password = "";
            role = rolesForCreate[rolesForCreate.length - 1] ?? "viewer";
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear el usuario.");
        }
    }

    function handleRoleChange(userId: string, currentRole: BusinessRole, event: Event) {
        const select = event.currentTarget as HTMLSelectElement | null;
        if (!select) return;
        const next = select.value as BusinessRole;

        if (!canManageRole(managerRole, currentRole) || !canManageRole(managerRole, next)) {
            toastStore.error("No puedes cambiar el rol de este usuario.");
            select.value = currentRole;
            return;
        }

        userManagementStore
            .setRole(userId, next)
            .then(() => toastStore.success("Rol actualizado."))
            .catch((e) => {
                logger.error(e?.message ?? e, e?.stack);
                toastStore.error(e instanceof Error ? e.message : "No se pudo actualizar el rol.");
                select.value = currentRole;
            });
    }

    onMount(() => {
        userManagementStore.syncAll().catch(() => {});
        userManagementStore.loadUsers("").catch(() => {
            logger.error("Error cargando usuarios");
        });
    });

    $: items = $userManagementStore.items;
    $: {
        const q = query.trim();
        if (searchTimer) window.clearTimeout(searchTimer);
        searchTimer = window.setTimeout(() => {
            userManagementStore.loadUsers(q).catch(() => {});
        }, q.length === 0 ? 0 : 350);
    }

    $: filtered = items;
    $: canSubmit =
        name.trim().length >= 2 &&
        email.trim().length >= 5 &&
        password.length >= 6 &&
        canManageRole(managerRole, role);
    $: isRefreshing = $userManagementStore.loading && items.length > 0;
    $: isInitialLoading = $userManagementStore.loading && items.length === 0;

    async function toggleBlocked(userId: string, targetRole: BusinessRole) {
        if (!canTouchUser(targetRole)) {
            toastStore.error("No puedes bloquear/desbloquear este usuario.");
            return;
        }
        try {
            toastStore.info("Actualizando estado...", 1200);
            await userManagementStore.toggleBlocked(userId);
            toastStore.success("Estado actualizado.", 1200);
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
        }
    }

    async function resetPassword(userId: string, targetRole: BusinessRole) {
        if (!canTouchUser(targetRole)) {
            toastStore.error("No puedes resetear el password de este usuario.");
            return;
        }
        const newPassword = window.prompt("Nuevo password temporal (mínimo 6 caracteres):");
        if (!newPassword || newPassword.trim().length < 6) return;
        try {
            toastStore.info("Actualizando password...", 1200);
            await userManagementStore.requestPasswordReset(userId, newPassword.trim());
            toastStore.success("Password actualizado.", 1400);
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo actualizar el password.");
        }
    }

    $: canPurgeAnonymous = managerRole === "owner" || managerRole === "admin";

    async function purgeAnonymous() {
        if (!canPurgeAnonymous) {
            toastStore.error("Solo owner o admin pueden limpiar anónimos.");
            return;
        }
        const ok = window.confirm(
            "¿Borrar en Appwrite todas las cuentas anónimas/visitante (sin email)?\n\n" +
                "No afecta usuarios con correo. Esto libera cupo del plan (Users)."
        );
        if (!ok) return;
        try {
            toastStore.info("Limpiando anónimos…");
            const result = await userManagementStore.purgeAnonymousUsers();
            if (result.found === 0) {
                toastStore.info("No había usuarios anónimos.");
            } else if (result.failed === 0) {
                toastStore.success(`Eliminados ${result.deleted} anónimos.`);
            } else {
                toastStore.error(
                    `Eliminados ${result.deleted} de ${result.found}. Fallaron ${result.failed}.`
                );
            }
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo limpiar anónimos.");
        }
    }
</script>

<section class="mgmt-page" aria-label="Gestión de usuarios">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Usuarios</h1>
                <p class="mgmt-subtitle">
                    Solo puedes asignar roles de jerarquía menor o igual a la tuya ({managerRole}).
                </p>
            </div>

            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={Users} size={18} ariaLabel="Total" />
                    {filtered.length} / {items.length}
                </span>
                {#if canPurgeAnonymous}
                    <button
                        class="mgmt-btn ghost"
                        type="button"
                        on:click={purgeAnonymous}
                        disabled={$userManagementStore.saving || $userManagementStore.loading}
                        title="Borrar en Appwrite cuentas sin email (sesiones anónimas)"
                    >
                        <Icon icon={Trash2} size={18} ariaLabel="Limpiar anónimos" />
                        Limpiar anónimos
                    </button>
                {/if}
                {#if isRefreshing}
                    <span class="mgmt-chip" aria-label="Sincronizando">
                        <LoadingSpinner size={16} label="Sincronizando" subtle />
                        Sincronizando...
                    </span>
                {/if}
            </div>
        </div>
    </header>

    <div class="mgmt-layout">
        <section class="mgmt-card mgmt-form-card" aria-label="Formulario">
            <h2 class="mgmt-card-title">Nuevo usuario</h2>

            <div class="mgmt-grid">
                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Nombre</span>
                    <input class="mgmt-input" placeholder="Nombre completo" autocomplete="name" bind:value={name} />
                </label>

                <label class="mgmt-field" style="grid-column:1/-1">
                    <span>Correo</span>
                    <input
                        class="mgmt-input"
                        type="email"
                        placeholder="correo@dominio.com"
                        autocomplete="email"
                        bind:value={email}
                    />
                </label>

                <label class="mgmt-field">
                    <span>Rol</span>
                    <select class="mgmt-select" bind:value={role}>
                        {#each rolesForCreate as r}
                            <option value={r}>{r}</option>
                        {/each}
                    </select>
                </label>

                <label class="mgmt-field">
                    <span>Password temporal</span>
                    <input
                        class="mgmt-input"
                        placeholder="Mínimo 6 caracteres"
                        type="password"
                        autocomplete="new-password"
                        bind:value={password}
                    />
                </label>

                <div class="mgmt-actions" style="grid-column:1/-1">
                    <button class="mgmt-btn primary" on:click={createUser} disabled={!canSubmit}>
                        <Icon icon={UserPlus} size={18} ariaLabel="Crear usuario" />
                        Crear usuario
                    </button>
                </div>
            </div>
        </section>

        <section class="mgmt-card" aria-label="Listado">
            <div class="mgmt-toolbar" style="margin-bottom:12px">
                <h2 class="mgmt-card-title" style="margin:0">Listado</h2>

                <label class="mgmt-field" style="min-width:min(420px,100%); margin:0">
                    <span class="mgmt-muted" style="display:none">Buscar</span>
                    <div style="display:flex; gap:10px; align-items:center">
                        <Icon icon={Search} size={18} ariaLabel="Buscar" />
                        <input
                            class="mgmt-input"
                            type="search"
                            placeholder="Buscar usuarios..."
                            aria-label="Buscar usuarios"
                            bind:value={query}
                        />
                    </div>
                </label>
            </div>

            <div class="mgmt-list">
                {#if isInitialLoading}
                    <SkeletonList rows={8} />
                {:else if filtered.length === 0}
                    <div class="mgmt-muted">No hay resultados.</div>
                {/if}

                {#each filtered as user (user.id)}
                    {@const touch = canTouchUser(user.role)}
                    <article class="mgmt-row" aria-label={user.name}>
                        <div style="display:grid; grid-template-columns:58px 1fr; gap:12px; align-items:center">
                            {#if user.photoUrl}
                                <img class="mgmt-avatar" src={user.photoUrl} alt="" aria-hidden="true" />
                            {:else}
                                <div class="mgmt-avatar" aria-hidden="true"></div>
                            {/if}

                            <div class="mgmt-row-main">
                                <div class="mgmt-row-title">
                                    {user.name}
                                    {#if user.blocked}
                                        <span class="mgmt-muted" style="font-weight:700"> · bloqueado</span>
                                    {/if}
                                </div>
                                <p class="mgmt-row-sub">{user.email}</p>
                                <p class="mgmt-row-sub">
                                    <span class="mgmt-chip" style="padding:4px 10px">
                                        <Icon icon={BadgeCheck} size={16} ariaLabel="Verificación" />
                                        {user.verified ? "verificado" : "sin verificar"}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div class="mgmt-row-actions">
                            <label class="mgmt-field" style="margin:0; min-width:140px">
                                <span class="mgmt-muted" style="display:none">Rol</span>
                                <select
                                    class="mgmt-select"
                                    value={user.role}
                                    disabled={!touch || $userManagementStore.saving}
                                    on:change={(e) => handleRoleChange(user.id, user.role, e)}
                                >
                                    {#each rolesForUser(user.role) as r}
                                        <option value={r}>{r}</option>
                                    {/each}
                                </select>
                            </label>

                            <button
                                class="mgmt-btn ghost"
                                type="button"
                                disabled={!touch || $userManagementStore.saving}
                                on:click={() => toggleBlocked(user.id, user.role)}
                            >
                                <Icon icon={user.blocked ? Unlock : Lock} size={18} ariaLabel="Bloqueo" />
                                {user.blocked ? "Desbloquear" : "Bloquear"}
                            </button>

                            <button
                                class="mgmt-btn ghost"
                                type="button"
                                disabled={!touch || $userManagementStore.saving}
                                on:click={() => resetPassword(user.id, user.role)}
                            >
                                <Icon icon={KeyRound} size={18} ariaLabel="Password" />
                                Password
                            </button>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    </div>
</section>
