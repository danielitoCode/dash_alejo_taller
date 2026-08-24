<script lang="ts">
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { availableStock, type Product } from "../../domain/entity/Product";
    import { Scale, X } from "lucide-svelte";

    export let open = false;
    export let product: Product | null = null;
    export let onClose: () => void = () => {};
    export let onConfirm: (delta: number, reason: string) => Promise<void> = async () => {};

    let delta: number | string = "";
    let reason = "";
    let submitting = false;

    $: if (open) {
        delta = "";
        reason = "";
        submitting = false;
    }

    $: deltaNum = Math.trunc(Number(delta));
    $: reasonOk = String(reason || "").trim().length > 0;
    $: canSubmit =
        Number.isFinite(deltaNum) &&
        deltaNum !== 0 &&
        String(delta).trim() !== "" &&
        deltaNum === Number(delta) &&
        reasonOk &&
        !submitting;

    async function confirm(): Promise<void> {
        if (!product || !canSubmit) return;
        submitting = true;
        try {
            await onConfirm(deltaNum, String(reason).trim());
            onClose();
        } finally {
            submitting = false;
        }
    }
</script>

{#if open && product}
    <div class="entry-overlay" role="presentation" on:click|self={() => !submitting && onClose()}>
        <div class="entry-dialog" role="dialog" aria-modal="true" aria-labelledby="adjust-title">
            <header class="entry-head">
                <div>
                    <h2 id="adjust-title">Ajuste auditado</h2>
                    <p class="entry-name">{product.name}</p>
                </div>
                <button class="mgmt-btn ghost" type="button" on:click={() => onClose()} disabled={submitting} aria-label="Cerrar">
                    <Icon icon={X} size={18} ariaLabel="Cerrar" />
                </button>
            </header>
            <div class="entry-body">
                <p class="entry-stock-line">
                    Stock actual: <strong>{product.existence}</strong> existencia ·
                    <strong>{product.reserved ?? 0}</strong> reservado ·
                    <strong>{availableStock(product)}</strong> disponible
                </p>
                <label class="mgmt-field">
                    <span>Delta (entero ≠ 0: positivo suma, negativo resta)</span>
                    <input class="mgmt-input" type="number" step="1" inputmode="numeric" placeholder="Ej. 3 o -2" bind:value={delta} disabled={submitting} />
                </label>
                <label class="mgmt-field">
                    <span>Motivo (obligatorio)</span>
                    <input class="mgmt-input" type="text" placeholder="Ej. conteo físico, merma, corrección" bind:value={reason} disabled={submitting} />
                </label>
                {#if canSubmit}
                    <p class="entry-preview">
                        Resultado: existence {product.existence} → {product.existence + deltaNum}
                        (disponible → {Math.max(0, product.existence + deltaNum - (product.reserved ?? 0))})
                    </p>
                {/if}
            </div>
            <footer class="entry-actions">
                <button class="mgmt-btn ghost" type="button" on:click={() => onClose()} disabled={submitting}>Cancelar</button>
                <button class="mgmt-btn primary" type="button" on:click={confirm} disabled={!canSubmit}>
                    <Icon icon={Scale} size={18} ariaLabel="Ajustar" />
                    {submitting ? "Registrando…" : "Registrar ajuste"}
                </button>
            </footer>
        </div>
    </div>
{/if}
