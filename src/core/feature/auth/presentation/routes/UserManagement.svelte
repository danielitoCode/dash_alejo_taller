<script lang="ts">
    import { userManagementStore, type BusinessRole } from "../viewmodel/user-management.store";
    import {onMount} from "svelte";
    import {logger} from "../../../../infrastructure/presentation/util/logger.service";

    let name = "";
    let email = "";
    let password = "";
    let role: BusinessRole = "viewer";

    async function createUser() {
        if (!name.trim() || !email.trim() || password.length < 6) return;
        await userManagementStore.createUser({ name: name.trim(), email: email.trim(), password, role });
        name = ""; email = ""; password = ""; role = "viewer";
    }

    function handleRoleChange(userId: string, event: Event) {
        const select = event.currentTarget as HTMLSelectElement | null;
        if (!select) return;
        userManagementStore.setRole(userId, select.value as BusinessRole);
    }

    onMount(() => {
        userManagementStore.syncAll().catch(() => {});
        userManagementStore.loadUsers().catch(() => {
            logger.error("Error cargando usuarios")
        });
    });
</script>

<section class="card">
    <h4>Gestión de usuarios</h4>
    <div class="form">
        <input placeholder="Nombre" bind:value={name} />
        <input placeholder="Correo" bind:value={email} />
        <input placeholder="Password temporal" type="password" bind:value={password} />
        <select bind:value={role}>
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="sales">sales</option>
            <option value="viewer">viewer</option>
        </select>
        <button class="btn btn-primary" on:click={createUser}>Crear usuario</button>
    </div>

    {#each $userManagementStore.items as user}
        <article>
            <img src={user.photoUrl} alt={user.name}/>
            <div >
                <h2>{user.name}</h2>
                <p>{user.email}</p>
            </div>
            <div class="actions">
                <select value={user.role} on:change={(event) => handleRoleChange(user.id, event)}>
                    <option value="owner">owner</option>
                    <option value="admin">admin</option>
                    <option value="sales">sales</option>
                    <option value="viewer">viewer</option>
                </select>
                <button class="btn btn-elevated" on:click={() => userManagementStore.toggleBlocked(user.id)}>{user.blocked ? "Desbloquear" : "Bloquear"}</button>
                <button class="btn btn-elevated" on:click={() => userManagementStore.requestPasswordReset(user.id)}>Solicitar cambio password</button>
            </div>
        </article>
    {/each}
</section>

<style>
    input {
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        padding: 0 12px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
    }

    img{
        width:64px;
        height:64px;
        object-fit:cover;
        border-radius:8px
    }

    h4 {
        margin: 0;
        font-size: clamp(2rem, 3.6vw, 2.4rem);
        line-height: 1.12;
    }

    .card{
        display:grid;
        gap:12px
    }

    .form,.actions{
        display:flex;
        gap:8px;
        flex-wrap:wrap
    }

    .btn {
        height: 35px;
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
        min-width: 90px;
        color: var(--md-sys-color-on-surface);
        background: var(--md-sys-color-surface);
        border: 1px solid var(--md-sys-color-outline-variant);
        box-shadow: 0 6px 14px color-mix(in srgb, var(--md-sys-color-outline) 24%, transparent);
    }

    .btn:hover {
        filter: brightness(1.04);
    }


    article{
        display:grid;
        align-items:center;
        grid-template-columns:64px 1fr auto auto;
        border:1px solid var(--md-sys-color-outline-variant);
        padding:10px;
        border-radius:12px
    }

    select {
        border: 1px solid var(--md-sys-color-outline-variant);
        border-radius: 12px;
        height: 35px;
        padding: 0 12px;
        font: inherit;
        color: var(--md-sys-color-on-surface);
        background: color-mix(in srgb, var(--md-sys-color-surface) 88%, var(--md-sys-color-surface-variant));
    }

    @media (min-width: 900px), (orientation: landscape) and (max-height: 650px) {
        article{
            border:1px solid var(--md-sys-color-outline-variant);
            padding:10px;
            border-radius:12px
        }
    }
    @media (max-width: 780px), (orientation: portrait) {
        article{
            border:1px solid var(--md-sys-color-outline-variant);
            padding:10px;
            border-radius:12px
        }
    }
</style>