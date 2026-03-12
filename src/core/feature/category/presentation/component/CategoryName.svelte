<script lang="ts">
    import { derived } from "svelte/store";
    import { categoryStore } from "../viewmodel/category.store";

    export let categoryId: string | null;
    export let fallback: string = "No tiene categoría";

    const categoryName = derived(categoryStore, ($state) => {
        if (!categoryId) return null;

        const category = $state.items.find(c => c.id === categoryId);
        return category?.name ?? null;
    });

    $: if (categoryId && !$categoryStore.items.length && !$categoryStore.loading) {
        categoryStore.syncAll();
    }
</script>

<small>
    {$categoryName ?? fallback}
</small>