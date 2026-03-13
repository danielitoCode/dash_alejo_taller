<script lang="ts">
    import { onMount } from "svelte";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { logger } from "../../../../infrastructure/presentation/util/logger.service";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import { userManagementStore, type BusinessRole } from "../viewmodel/user-management.store";
    import { KeyRound, Lock, Search, Unlock, UserPlus, Users } from "lucide-svelte";

    let name = "";
    let email = "";
    let password = "";
    let role: BusinessRole = "viewer";
    let query = "";

    async function createUser() {
        if (!name.trim() || !email.trim() || password.length < 6) return;
        try {
            toastStore.info("Creando usuario…");
            await userManagementStore.createUser({ name: name.trim(), email: email.trim(), password, role });
            toastStore.success("Usuario creado.");
            name = "";
            email = "";
            password = "";
            role = "viewer";
        } catch (e: any) {
            logger.error(e?.message ?? e, e?.stack);
            toastStore.error(e instanceof Error ? e.message : "No se pudo crear el usuario.");
        }
    }

    function handleRoleChange(userId: string, event: Event) {
        const select = event.currentTarget as HTMLSelectElement | null;
        if (!select) return;
        userManagementStore
            .setRole(userId, select.value as BusinessRole)
            .then(() => toastStore.success("Rol actualizado."))
            .catch((e) => {
                logger.error(e?.message ?? e, e?.stack);
                toastStore.error(e instanceof Error ? e.message : "No se pudo actualizar el rol.");
            });
    }

    onMount(() => {
        userManagementStore.syncAll().catch(() => {});
        userManagementStore.loadUsers().catch(() => {
            logger.error("Error cargando usuarios");
        });
    });

    $: items = $userManagementStore.items;
    $: filtered =
        query.trim().length === 0
            ? items
            : items.filter((u) => {
                  const q = query.trim().toLowerCase();
                  return (
                      (u.name || "").toLowerCase().includes(q) ||
                      (u.email || "").toLowerCase().includes(q) ||
                      (u.role || "").toLowerCase().includes(q) ||
                      (u.id || "").toLowerCase().includes(q)
                  );
              });

    $: canSubmit = name.trim().length >= 2 && email.trim().length >= 5 && password.length >= 6;
</script>

<section class="mgmt-page" aria-label="Gestión de usuarios">
    <header class="mgmt-header">
        <div class="mgmt-toolbar">
            <div>
                <h1 class="mgmt-title">Usuarios</h1>
                <p class="mgmt-subtitle">Crea usuarios internos, asigna roles y gestiona accesos de forma segura.</p>
            </div>

            <div class="mgmt-meta">
                <span class="mgmt-chip">
                    <Icon icon={Users} size={18} ariaLabel="Total" />
                    {filtered.length} / {items.length}
                </span>
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
                        <option value="owner">owner</option>
                        <option value="admin">admin</option>
                        <option value="sales">sales</option>
                        <option value="viewer">viewer</option>
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
                {#if filtered.length === 0}
                    <div class="mgmt-muted">No hay resultados.</div>
                {/if}

                {#each filtered as user (user.id)}
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
                            </div>
                        </div>

                        <div class="mgmt-row-actions">
                            <label class="mgmt-field" style="margin:0; min-width: 160px">
                                <span style="display:none">Rol</span>
                                <select class="mgmt-select" value={user.role} on:change={(event) => handleRoleChange(user.id, event)}>
                                    <option value="owner">owner</option>
                                    <option value="admin">admin</option>
                                    <option value="sales">sales</option>
                                    <option value="viewer">viewer</option>
                                </select>
                            </label>

                            <button class="mgmt-btn ghost" on:click={() => userManagementStore.toggleBlocked(user.id)}>
                                <Icon icon={user.blocked ? Unlock : Lock} size={18} ariaLabel={user.blocked ? "Desbloquear" : "Bloquear"} />
                                {user.blocked ? "Desbloquear" : "Bloquear"}
                            </button>

                            <button class="mgmt-btn ghost" on:click={() => userManagementStore.requestPasswordReset(user.id)}>
                                <Icon icon={KeyRound} size={18} ariaLabel="Solicitar cambio de password" />
                                Reset password
                            </button>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    </div>
</section>
