<script lang="ts">
    export let icon: any;
    export let size: number | string = 18;
    export let strokeWidth: number | string = 2;
    export let className = "";
    export let ariaLabel: string | undefined = undefined;
    /** Hereda color del contenedor (tema claro/oscuro) */
    export let color: string = "currentColor";
</script>

<span class="icon-wrap {className}" style="color: {color};" aria-hidden={ariaLabel ? undefined : "true"}>
    <svelte:component
        this={icon}
        {size}
        {strokeWidth}
        {color}
        aria-label={ariaLabel}
    />
</span>

<style>
    .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
        color: inherit;
    }

    .icon-wrap :global(svg) {
        color: inherit;
        stroke: currentColor;
    }
</style>
