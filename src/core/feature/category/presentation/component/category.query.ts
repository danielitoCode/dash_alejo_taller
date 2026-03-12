import {categoryStore} from "../viewmodel/category.store";
import {get} from "svelte/store";

let initialized = false;

/**
 * Garantiza que las categorías estén cargadas.
 */
async function ensureLoaded() {
    const state = get(categoryStore);

    if (!initialized && state.items.length === 0 && !state.loading) {
        initialized = true;
        await categoryStore.syncAll();
    }
}

/**
 * Devuelve el nombre si existe en memoria.
 * Si no existe aún, devuelve null (pero dispara carga en background).
 */
export function getCategoryNameById(id: string): string | null {
    const state = get(categoryStore);

    // Disparar carga en background sin bloquear
    if (state.items.length === 0 && !state.loading) {
        ensureLoaded().then(r => {});
    }

    const category = state.items.find(c => c.id === id);
    return category?.name ?? null;
}