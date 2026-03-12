<script lang="ts">
    import { logStore} from "../viewmodel/log.store";
    import type { LogEntry} from "../viewmodel/log.store";

    let container: HTMLDivElement;
    let expanded = true;

    $: logs = $logStore as LogEntry[];
    $: errorCount = logs.filter(l => l.type === "error").length;

    $: if (container) {
        container.scrollTop = container.scrollHeight;
    }

    function toggle() {
        expanded = !expanded;
    }

    function clear() {
        logStore.clear();
    }
</script>

<div class="logs-wrapper {expanded ? 'open' : 'closed'}">

    <div class="header" on:click={toggle}>
        <div class="left">
            🖥 Logs
            {#if errorCount > 0}
                <span class="badge">{errorCount}</span>
            {/if}
        </div>
        <div class="right">
            <button on:click|stopPropagation={clear}>Clear</button>
            <span>{expanded ? "▼" : "▲"}</span>
        </div>
    </div>

    {#if expanded}
        <div class="body" bind:this={container}>
            {#each logs as log (log.id)}
                <div class="log {log.type}">
                    <div class="meta">
          <span class="time">
            {log.timestamp.toLocaleTimeString()}
          </span>
                        <span class="type">{log.type.toUpperCase()}</span>
                    </div>

                    <div class="message">{log.message}</div>

                    {#if log.stack}
                        <details>
                            <summary>Stack trace</summary>
                            <pre>{log.stack}</pre>
                        </details>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .logs-wrapper {
        position: fixed;
        bottom: 0;
        right: 0;
        width: 480px;
        font-family: monospace;
        background: #0f172a;
        color: #e2e8f0;
        border-radius: 12px 12px 0 0;
        box-shadow: 0 -5px 30px rgba(0,0,0,0.5);
        overflow: hidden;
        transition: height 0.3s ease;
        z-index: 9999;
    }

    .logs-wrapper.closed {
        height: 40px;
    }

    .logs-wrapper.open {
        height: 320px;
    }

    .header {
        background: #1e293b;
        padding: 8px 12px;
        display: flex;
        justify-content: space-between;
        cursor: pointer;
        font-weight: bold;
    }

    .body {
        overflow-y: auto;
        height: calc(100% - 40px);
        padding: 8px;
    }

    .log {
        margin-bottom: 8px;
        padding: 6px;
        border-radius: 6px;
        background: rgba(255,255,255,0.03);
    }

    .log.error { border-left: 4px solid #ef4444; }
    .log.warn { border-left: 4px solid #f59e0b; }
    .log.info { border-left: 4px solid #38bdf8; }
    .log.log { border-left: 4px solid #94a3b8; }

    .meta {
        font-size: 11px;
        opacity: 0.6;
        display: flex;
        justify-content: space-between;
    }

    .message {
        margin-top: 4px;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .badge {
        background: #ef4444;
        color: white;
        padding: 2px 6px;
        border-radius: 999px;
        font-size: 11px;
        margin-left: 6px;
    }

    button {
        background: transparent;
        border: 1px solid #334155;
        color: #cbd5e1;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        cursor: pointer;
    }
</style>