import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NavController } from "../../../../../../lib/navigation/NavController";
import type { SupportMessage } from "../../../../../../core/feature/support/domain/entity/SupportMessage";

type InboxState = {
    items: SupportMessage[];
    loading: boolean;
    error: string | null;
};

const {
    initialItems,
    syncAll,
    setStatus,
    startRealtime,
    stopRealtime,
    subscribeState,
    setMockState,
    subscribeCounts
} = vi.hoisted(() => {
    const initialItems = [
        {
            id: "msg-1",
            createdAtIso: "2026-03-20T10:00:00.000Z",
            fromName: "Ana",
            fromEmail: "ana@example.com",
            reason: "soporte",
            status: "nuevo",
            subject: "Problema con pedido",
            body: "Necesito ayuda con la orden"
        },
        {
            id: "msg-2",
            createdAtIso: "2026-03-19T09:00:00.000Z",
            fromName: "Luis",
            fromEmail: "luis@example.com",
            reason: "facturacion",
            status: "resuelto",
            subject: "Factura pendiente",
            body: "Quiero mi factura"
        }
    ];

    let currentState = {
        items: [...initialItems],
        loading: false,
        error: null
    };

    const stateListeners = new Set<(value: typeof currentState) => void>();
    const countListeners = new Set<(value: { total: number; nuevo: number; enProceso: number; resuelto: number }) => void>();

    function computeCounts(state: typeof currentState) {
        const total = state.items.length;
        const nuevo = state.items.filter((item) => item.status === "nuevo").length;
        const enProceso = state.items.filter((item) => item.status === "en_proceso").length;
        const resuelto = state.items.filter((item) => item.status === "resuelto").length;
        return { total, nuevo, enProceso, resuelto };
    }

    function notify() {
        for (const listener of stateListeners) listener(currentState);
        const counts = computeCounts(currentState);
        for (const listener of countListeners) listener(counts);
    }

    return {
        initialItems,
        syncAll: vi.fn(async () => {}),
        setStatus: vi.fn(async () => {}),
        startRealtime: vi.fn(),
        stopRealtime: vi.fn(),
        subscribeState(run: (value: typeof currentState) => void) {
            run(currentState);
            stateListeners.add(run);
            return () => stateListeners.delete(run);
        },
        subscribeCounts(run: (value: { total: number; nuevo: number; enProceso: number; resuelto: number }) => void) {
            run(computeCounts(currentState));
            countListeners.add(run);
            return () => countListeners.delete(run);
        },
        setMockState(next: typeof currentState) {
            currentState = next;
            notify();
        }
    };
});

vi.mock("../../../../../../core/feature/support/presentation/viewmodel/support-inbox.store", () => ({
    supportInboxStore: {
        subscribe: subscribeState,
        syncAll,
        setStatus,
        startRealtime,
        stopRealtime,
        counts: {
            subscribe: subscribeCounts
        }
    }
}));

import SupportInbox from "../../../../../../core/feature/support/presentation/routes/SupportInbox.svelte";

describe("SupportInbox route", () => {
    beforeEach(() => {
        setMockState({
            items: [...(initialItems as SupportMessage[])],
            loading: false,
            error: null
        } satisfies InboxState);
        syncAll.mockClear();
        setStatus.mockClear();
    });

    it("sincroniza al montar y muestra contadores y mensajes", async () => {
        const navController = new NavController("support");
        render(SupportInbox, { navController });

        await waitFor(() => {
            expect(syncAll).toHaveBeenCalledTimes(1);
        });

        expect(screen.getByText("2 total")).toBeInTheDocument();
        expect(screen.getByText("1 nuevos")).toBeInTheDocument();
        expect(screen.getByText("Problema con pedido")).toBeInTheDocument();
        expect(screen.getByText("Factura pendiente")).toBeInTheDocument();
    });

    it("filtra por búsqueda y navega al detalle al pulsar un mensaje", async () => {
        const navController = new NavController("support");
        navController.navigate = vi.fn();
        render(SupportInbox, { navController });

        await fireEvent.input(screen.getByPlaceholderText("Nombre, correo, asunto..."), {
            target: { value: "factura" }
        });

        expect(screen.queryByText("Problema con pedido")).not.toBeInTheDocument();

        await fireEvent.click(screen.getByRole("button", { name: "Factura pendiente" }));

        expect(navController.navigate).toHaveBeenCalledWith("support-detail", { id: "msg-2" });
    });
});
