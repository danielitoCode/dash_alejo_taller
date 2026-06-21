<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import FrameModal from "../../../auth/presentation/components/FrameModal.svelte";
    import { toastStore } from "../../../../infrastructure/presentation/viewmodel/toast.store";
    import Icon from "../../../../infrastructure/presentation/components/Icon.svelte";
    import { compressImageFile } from "../../../../infrastructure/presentation/storage/image-compress";
    import { uploadImageToStorage } from "../../../../infrastructure/presentation/storage/image-upload";
    import { ChevronDown, CloudUpload, Globe, Image as ImageIcon, Plus, Trash2, Upload, X } from "lucide-svelte";

    type LocalImage = {
        id: string;
        file: File;
        preview: string;
    };

    export let label = "Imágenes";
    export let values: string[] = [];
    export let disabled = false;
    export let required = false;
    export let pending = false;

    const dispatch = createEventDispatcher<{ change: { urls: string[] } }>();

    let open = false;
    let rootEl: HTMLElement | null = null;
    let fileInput: HTMLInputElement | null = null;
    let urlFrameOpen = false;
    let urlFrameSrc = "";
    let localImages: LocalImage[] = [];
    let uploading = false;

    $: pending = uploading || localImages.length > 0;
    $: isDisabled = disabled || uploading;
    $: validUrls = values.filter(v => typeof v === 'string' && v.trim() !== '');
    $: totalCount = validUrls.length + localImages.length;

    function closeMenu() {
        open = false;
    }

    function commitValues(next: string[]) {
        values = next;
        dispatch("change", { urls: values });
    }

    function addUrl(url: string) {
        const next = url.trim();
        if (!next) return;
        if (values.includes(next)) {
            toastStore.info("La imagen ya está agregada.");
            return;
        }
        commitValues([...values, next]);
        toastStore.success("URL de imagen agregada.");
    }

    function removeUrl(index: number) {
        commitValues(values.filter((_, currentIndex) => currentIndex !== index));
    }

    function getUrlFrameSrc(): string {
        const params = new URLSearchParams({
            parent_origin: window.location.origin,
            value: ""
        });
        return `/image-url.html#${params.toString()}`;
    }

    function openUrlFrame() {
        closeMenu();
        urlFrameSrc = getUrlFrameSrc();
        urlFrameOpen = true;
    }

    function pickLocal() {
        closeMenu();
        fileInput?.click();
    }

    function revokeLocalImage(image: LocalImage) {
        URL.revokeObjectURL(image.preview);
    }

    function removeLocal(id: string) {
        const image = localImages.find((item) => item.id === id);
        if (image) revokeLocalImage(image);
        localImages = localImages.filter((item) => item.id !== id);
    }

    function clearLocalImages() {
        localImages.forEach(revokeLocalImage);
        localImages = [];
    }

    async function uploadLocalImages() {
        if (localImages.length === 0 || uploading) return;
        uploading = true;

        try {
            toastStore.info(localImages.length === 1 ? "Comprimiendo imagen…" : "Comprimiendo imágenes…");
            const uploadedUrls: string[] = [];

            for (const localImage of localImages) {
                const compressed = await compressImageFile(localImage.file, {
                    maxSide: 1600,
                    quality: 0.86,
                    mimeType: "image/webp"
                });

                toastStore.info(`Subiendo ${localImage.file.name}…`);
                uploadedUrls.push(await uploadImageToStorage(compressed));
            }

            commitValues([...values, ...uploadedUrls]);
            toastStore.success(localImages.length === 1 ? "Imagen subida correctamente." : "Imágenes subidas correctamente.");
            clearLocalImages();
        } catch (e) {
            toastStore.error(e instanceof Error ? e.message : "No se pudieron subir las imágenes.");
        } finally {
            uploading = false;
        }
    }

    function handleFileChange(event: Event) {
        const input = event.currentTarget as HTMLInputElement;
        const files = Array.from(input.files ?? []);
        input.value = "";
        if (files.length === 0) return;

        localImages = [
            ...localImages,
            ...files.map((file) => ({
                id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
                file,
                preview: URL.createObjectURL(file)
            }))
        ];
        toastStore.info(files.length === 1 ? "Imagen seleccionada. Sube para guardarla." : "Imágenes seleccionadas. Sube para guardarlas.");
    }

    function handleOutsideClick(event: MouseEvent) {
        if (!open) return;
        const target = event.target as Node | null;
        if (!target) return;
        if (rootEl && !rootEl.contains(target)) open = false;
    }

    onMount(() => {
        document.addEventListener("click", handleOutsideClick, true);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleOutsideClick, true);
        clearLocalImages();
    });

    function onFrameMessage(event: Event) {
        const data = (event as CustomEvent<{ data: any }>).detail.data;

        if (data?.type === "image-url-cancel") {
            urlFrameOpen = false;
        }

        if (data?.type === "image-url-selected" && typeof data.url === "string") {
            urlFrameOpen = false;
            addUrl(data.url);
        }
    }
</script>

<div class="picker" bind:this={rootEl} aria-label={label}>
    <div class="picker-head">
        <span class="picker-label">
            {label}{required ? " *" : ""}
        </span>

        {#if totalCount === 0}
            <button class="add-tile-large" type="button" on:click={() => (open = !open)} disabled={isDisabled} aria-label="Agregar imagen">
                <Icon icon={Plus} size={28} />
            </button>
        {:else}
            <button class="picker-btn" type="button" on:click={() => (open = !open)} disabled={isDisabled}>
                <div class="picker-btn-main">
                    {#if validUrls[0] || localImages[0]?.preview}
                        <img class="thumb" src={validUrls[0] || localImages[0].preview} alt="" aria-hidden="true" />
                    {:else}
                        <div class="thumb placeholder" aria-hidden="true">
                            <Icon icon={ImageIcon} size={18} />
                        </div>
                    {/if}
                    <span class="picker-btn-text">{totalCount > 0 ? `${totalCount} imagen${totalCount === 1 ? "" : "es"}` : "Agregar imágenes"}</span>
                </div>
                <Icon icon={ChevronDown} size={18} ariaLabel="Opciones" />
            </button>
        {/if}
    </div>

    {#if open}
        <div class="menu" role="menu" aria-label="Opciones de imagen" style={totalCount === 0 ? "top: 106px;" : "top: 76px;"}>
            <button class="menu-item" type="button" role="menuitem" on:click={openUrlFrame} disabled={isDisabled}>
                <Icon icon={Globe} size={18} ariaLabel="Desde la web" />
                Desde la web
            </button>
            <button class="menu-item" type="button" role="menuitem" on:click={pickLocal} disabled={isDisabled}>
                <Icon icon={CloudUpload} size={18} ariaLabel="Desde tu dispositivo" />
                Desde tu dispositivo
            </button>
        </div>
    {/if}

    {#if totalCount > 0}
        <div class="gallery" aria-label="Galería de imágenes">
            {#each validUrls as url, index (url)}
                <div class="gallery-item">
                    <img src={url} alt="Imagen seleccionada" />
                    <button class="remove" type="button" on:click={() => removeUrl(index)} disabled={isDisabled} aria-label="Quitar imagen">
                        <Icon icon={Trash2} size={16} ariaLabel="Quitar" />
                    </button>
                </div>
            {/each}

            {#each localImages as image (image.id)}
                <div class="gallery-item local">
                    <img src={image.preview} alt="Preview local" />
                    <button class="remove" type="button" on:click={() => removeLocal(image.id)} disabled={uploading} aria-label="Quitar imagen local">
                        <Icon icon={X} size={16} ariaLabel="Quitar" />
                    </button>
                </div>
            {/each}

            <button class="add-tile" type="button" on:click={() => (open = !open)} disabled={isDisabled} aria-label="Agregar otra imagen">
                <Icon icon={Plus} size={20} ariaLabel="Agregar" />
            </button>
        </div>
    {/if}

    {#if localImages.length > 0}
        <div class="local-card" aria-label="Imágenes locales pendientes">
            <div>
                <div class="local-name">{localImages.length} imagen{localImages.length === 1 ? "" : "es"} pendiente{localImages.length === 1 ? "" : "s"}</div>
                <div class="local-sub mgmt-muted">Selecciona más archivos o sube las imágenes para guardarlas.</div>
            </div>
            <div class="local-actions">
                <button class="mgmt-btn ghost" type="button" on:click={clearLocalImages} disabled={uploading}>
                    <Icon icon={X} size={18} ariaLabel="Quitar" />
                    Quitar
                </button>
                <button class="mgmt-btn primary" type="button" on:click={uploadLocalImages} disabled={uploading}>
                    <Icon icon={Upload} size={18} ariaLabel="Subir" />
                    {uploading ? "Subiendo…" : "Subir"}
                </button>
            </div>
        </div>
    {/if}

    <input class="file" bind:this={fileInput} type="file" accept="image/*" multiple on:change={handleFileChange} disabled={isDisabled} />
</div>

<FrameModal
        open={urlFrameOpen}
        title="Imagen desde la web"
        ariaLabel="Imagen desde la web"
        src={urlFrameOpen ? urlFrameSrc : ""}
        on:close={() => (urlFrameOpen = false)}
        on:frameMessage={onFrameMessage}
/>

<style>
    .picker { display: grid; gap: 10px; position: relative; width: 100%; }
    .picker-head { display: grid; gap: 6px; }
    .picker-label { font-size: 0.9rem; color: var(--md-sys-color-on-surface-variant); font-weight: 600; }
    .picker-btn { width: 100%; height: 54px; border-radius: 14px; border: 1px solid var(--md-sys-color-outline-variant); background: color-mix(in srgb, var(--md-sys-color-surface) 92%, var(--md-sys-color-surface-variant)); cursor: pointer; display: inline-flex; align-items: center; justify-content: space-between; gap: 10px; padding: 0 12px; transition: transform 120ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease; }
    .picker-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .picker-btn:hover { filter: brightness(1.02); box-shadow: 0 10px 18px color-mix(in srgb, var(--md-sys-color-outline) 12%, transparent); }
    .add-tile-large { width: 74px; height: 74px; border-radius: 16px; border: 2px dashed var(--md-sys-color-outline-variant); background: color-mix(in srgb, var(--md-sys-color-surface) 90%, var(--md-sys-color-surface-variant)); display: grid; place-items: center; cursor: pointer; color: var(--md-sys-color-on-surface-variant); transition: border-color 160ms ease, background-color 160ms ease, transform 120ms ease; }
    .add-tile-large:disabled { opacity: 0.6; cursor: not-allowed; }
    .add-tile-large:hover:not(:disabled) { border-color: var(--md-sys-color-primary); background: color-mix(in srgb, var(--md-sys-color-primary) 8%, var(--md-sys-color-surface)); color: var(--md-sys-color-primary); }
    .add-tile-large:active:not(:disabled) { transform: scale(0.96); }
    .picker-btn-main { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
    .picker-btn-text { font-weight: 750; color: var(--md-sys-color-on-surface); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .thumb { width: 36px; height: 36px; border-radius: 12px; object-fit: cover; border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent); background: var(--md-sys-color-surface-variant); flex: 0 0 auto; }
    .thumb.placeholder { display: grid; place-items: center; color: var(--md-sys-color-on-surface-variant); }
    .menu { position: absolute; top: 76px; left: 0; width: min(320px, 100%); background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline-variant); border-radius: 16px; box-shadow: 0 18px 42px color-mix(in srgb, black 22%, transparent); padding: 6px; display: grid; gap: 6px; z-index: 20; }
    .menu-item { height: 44px; border-radius: 14px; border: 1px solid transparent; background: transparent; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; padding: 0 12px; font: inherit; font-weight: 700; color: var(--md-sys-color-on-surface); }
    .menu-item:hover { background: color-mix(in srgb, var(--md-sys-color-surface-variant) 40%, transparent); }
    .file { display: none; }
    .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr)); gap: 10px; }
    .gallery-item, .add-tile { position: relative; aspect-ratio: 1; min-height: 74px; border-radius: 16px; overflow: hidden; border: 1px solid var(--md-sys-color-outline-variant); background: var(--md-sys-color-surface-variant); }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .gallery-item.local { outline: 2px dashed color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent); outline-offset: -4px; }
    .remove { position: absolute; top: 6px; right: 6px; width: 30px; height: 30px; border-radius: 999px; border: 1px solid color-mix(in srgb, white 65%, transparent); background: color-mix(in srgb, black 58%, transparent); color: white; display: grid; place-items: center; cursor: pointer; }
    .add-tile { display: grid; place-items: center; cursor: pointer; color: var(--md-sys-color-on-surface-variant); }
    .local-card { display: flex; justify-content: space-between; gap: 12px; align-items: center; padding: 10px; border-radius: 16px; border: 1px solid var(--md-sys-color-outline-variant); background: color-mix(in srgb, var(--md-sys-color-surface) 86%, transparent); flex-wrap: wrap; }
    .local-name { font-weight: 800; }
    .local-actions { display: inline-flex; gap: 10px; flex-wrap: wrap; }
</style>