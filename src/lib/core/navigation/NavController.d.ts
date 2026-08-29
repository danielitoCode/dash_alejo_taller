import type { Writable } from "svelte/store";
import type { NavBackStackEntry } from "./NavBackStackEntry";
export declare class NavController {
    private readonly stackStore;
    private readonly startDestination;
    constructor(startDestination: string);
    _getStackStore(): Writable<NavBackStackEntry[]>;
    navigate<T = unknown>(route: string, args?: T): void;
    navigateReplace<T = unknown>(route: string, args?: T): void;
    goToSection(route: string): void;
    popBackStack(): void;
    canPop(): boolean;
    popOrNavigate(fallbackRoute: string): void;
}
