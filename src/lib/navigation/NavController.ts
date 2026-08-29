import { writable, type Writable, get } from "svelte/store";
import type { NavBackStackEntry } from "./NavBackStackEntry";

export class NavController {
    // 🔥 store creado UNA sola vez
    private readonly stackStore: Writable<NavBackStackEntry[]>;
    private readonly startDestination: string;

    constructor(startDestination: string) {
        this.startDestination = startDestination;
        this.stackStore = writable([
            { route: startDestination }
        ]);
    }

    // ✅ siempre devuelve EL MISMO store
    _getStackStore() {
        return this.stackStore;
    }

    /** Push de una ruta (detalle, subvista). */
    navigate<T = unknown>(route: string, args?: T) {
        this.stackStore.update(s => [...s, { route, args }]);
    }

    /** Reemplaza la entrada actual (misma profundidad). */
    navigateReplace<T = unknown>(route: string, args?: T) {
        this.stackStore.update(s => {
            if (s.length === 0) return [{ route, args }];
            return [...s.slice(0, -1), { route, args }];
        });
    }

    /**
     * Cambia de sección del menú: deja el stack en [start, route] o solo [route]
     * si route es el start. Evita apilar secciones y huérfanos de detalle.
     */
    goToSection(route: string) {
        this.stackStore.update(() => {
            if (route === this.startDestination) {
                return [{ route: this.startDestination }];
            }
            return [{ route: this.startDestination }, { route }];
        });
    }

    popBackStack() {
        this.stackStore.update(s =>
            s.length > 1 ? s.slice(0, -1) : s
        );
    }

    canPop(): boolean {
        return get(this.stackStore).length > 1;
    }

    /**
     * Vuelve atrás si hay stack; si no (detalle abierto sin listado debajo),
     * navega al fallback (p. ej. listado de ventas).
     */
    popOrNavigate(fallbackRoute: string) {
        const s = get(this.stackStore);
        if (s.length > 1) {
            this.popBackStack();
            return;
        }
        this.goToSection(fallbackRoute);
    }
}
