import { writable, type Writable } from "svelte/store"
import type { NavBackStackEntry } from "./NavBackStackEntry"

export class NavController {
    private readonly stackStore: Writable<NavBackStackEntry[]>
    private readonly startDestination: string

    constructor(startDestination: string) {
        this.startDestination = startDestination
        this.stackStore = writable([{ route: startDestination }])
    }

    _getStackStore() {
        return this.stackStore
    }

    navigate<T = unknown>(route: string, args?: T) {
        this.stackStore.update((s) => [...s, { route, args }])
    }

    /** Reemplaza la entrada actual (útil para tabs del mismo nivel). */
    navigateReplace<T = unknown>(route: string, args?: T) {
        this.stackStore.update((s) => {
            if (s.length === 0) return [{ route, args }]
            return [...s.slice(0, -1), { route, args }]
        })
    }

    /**
     * Navega a una sección de listado como raíz bajo startDestination.
     * Evita apilar ventas/ventas/ventas al pulsar el menú lateral.
     */
    goToSection(route: string) {
        this.stackStore.update((s) => {
            const start = s[0] ?? { route: this.startDestination }
            if (route === start.route) return [start]
            return [start, { route }]
        })
    }

    popBackStack() {
        this.stackStore.update((s) => (s.length > 1 ? s.slice(0, -1) : s))
    }

    /**
     * Atrás interno: si hay historial, hace pop; si no, va al listado fallback.
     * Cubre detalle abierto desde RealtimeDock sin listado debajo.
     */
    popOrNavigate(fallbackRoute: string) {
        this.stackStore.update((s) => {
            if (s.length > 1) return s.slice(0, -1)
            const start = s[0] ?? { route: this.startDestination }
            if (fallbackRoute === start.route) return [start]
            return [start, { route: fallbackRoute }]
        })
    }

    canPop(): boolean {
        let len = 0
        const unsub = this.stackStore.subscribe((s) => {
            len = s.length
        })
        unsub()
        return len > 1
    }
}
