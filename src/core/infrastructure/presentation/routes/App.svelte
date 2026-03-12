<script lang="ts">
    import {initGlobalLogger} from "../util/console.interceptor";
    import MainNavigationWrapper from "../navigation/MainNavigationWrapper.svelte";
    import ToastHost from "../components/ToastHost.svelte";
    import DevTerminal from "../components/DevTerminal.svelte";

    if (import.meta.env.DEV) {
        initGlobalLogger();
    }
</script>

<main>
    <MainNavigationWrapper/>
</main>

<ToastHost/>

<!-- Terminal solo en desarrollo -->
{#if import.meta.env.DEV}
    <DevTerminal/>
{/if}