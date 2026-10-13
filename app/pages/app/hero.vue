<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-primary">Home hero</h1>
      <p class="text-text/50 text-sm mt-1">
        The background images that fade and breathe behind the home page headline.
      </p>
    </div>

    <p v-if="actionError" class="text-red-400 text-sm mb-4">{{ actionError }}</p>
    <p v-if="actionMessage" class="text-primary text-sm mb-4">{{ actionMessage }}</p>

    <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
      <p v-if="images.length > 1" class="text-text/35 text-xs mb-3">
        Drag to reorder — they rotate in this order.
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-5">
        <div
          v-for="(img, index) in images"
          :key="img.id"
          draggable="true"
          class="group relative rounded-xl overflow-hidden border-2 transition-colors"
          :class="[
            dragOverIndex === index ? 'border-primary' : 'border-white/10',
            draggingIndex === index ? 'opacity-40' : '',
          ]"
          @dragstart="onDragStart(index, $event)"
          @dragover.prevent="dragOverIndex = index"
          @dragleave="dragOverIndex === index && (dragOverIndex = null)"
          @drop.prevent="onDrop(index)"
          @dragend="onDragEnd"
        >
          <img :src="img.image_url" :alt="`Background ${index + 1}`" class="w-full aspect-video object-cover" draggable="false" />
          <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-text/70 text-[10px] font-bold">
            {{ index + 1 }}
          </span>
          <button
            type="button"
            class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-text/60 hover:text-red-400 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
            :disabled="busy"
            :aria-label="`Remove background ${index + 1}`"
            @click="remove(img)"
          >
            <UIcon name="i-lucide-x" class="text-xs" />
          </button>
        </div>

        <p v-if="!images.length" class="text-text/40 text-sm col-span-full py-4">
          No backgrounds yet.
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <UFileUpload
          v-model="selectedFile"
          accept="image/*"
          :disabled="busy"
          label="Add a background"
          @update:model-value="onFileSelected"
        />
        <p v-if="uploading" class="text-text/50 text-xs">Uploading…</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' })

interface HeroImage { id: number, image_url: string, sort_order: number }

const images = ref<HeroImage[]>([])
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const busy = ref(false)
const actionError = ref('')
const actionMessage = ref('')

async function load() {
  images.value = await $fetch<HeroImage[]>('/api/admin/hero-backgrounds').catch(() => [])
}

await load()

function errorFrom(e: unknown): string {
  return (e as { data?: { statusMessage?: string } }).data?.statusMessage
    ?? (e as { statusMessage?: string }).statusMessage
    ?? 'Something went wrong.'
}

async function run(fn: () => Promise<string>) {
  busy.value = true
  actionError.value = ''
  actionMessage.value = ''
  try {
    actionMessage.value = await fn()
    await load()
  } catch (e) {
    actionError.value = errorFrom(e)
  } finally {
    busy.value = false
  }
}

async function onFileSelected(file: File | null) {
  if (!file) return
  uploading.value = true
  actionError.value = ''
  actionMessage.value = ''
  try {
    // Two steps: the shared uploader stores the file and returns its path,
    // then that path is added to the rotation. Reusing /api/admin/upload
    // keeps one place deciding what an acceptable image is.
    const body = new FormData()
    body.append('file', file)
    const uploaded = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body })
    await $fetch('/api/admin/hero-backgrounds', { method: 'POST', body: { image_url: uploaded.url } })
    await load()
    actionMessage.value = 'Background added.'
  } catch (e) {
    actionError.value = errorFrom(e)
  } finally {
    uploading.value = false
    selectedFile.value = null
  }
}

async function remove(img: HeroImage) {
  if (!confirm('Remove this background from the home page?')) return
  await run(async () => {
    await $fetch(`/api/admin/hero-backgrounds/${img.id}`, { method: 'DELETE' })
    return 'Background removed.'
  })
}

// Native HTML5 drag, same approach as the taxonomy list.
const draggingIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number, e: DragEvent) {
  draggingIndex.value = index
  // Firefox will not start a drag unless some data is set.
  e.dataTransfer?.setData('text/plain', String(index))
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  draggingIndex.value = null
  dragOverIndex.value = null
}

async function onDrop(targetIndex: number) {
  const from = draggingIndex.value
  onDragEnd()
  if (from === null || from === targetIndex) return

  const reordered = [...images.value]
  const [moved] = reordered.splice(from, 1)
  if (!moved) return
  reordered.splice(targetIndex, 0, moved)

  // Shown immediately; the reload in run() restores the server's truth if
  // the request is rejected, so the screen cannot keep claiming an order
  // that was not saved.
  images.value = reordered

  await run(async () => {
    await $fetch('/api/admin/hero-backgrounds/order', {
      method: 'PUT',
      body: { ids: reordered.map(i => i.id) },
    })
    return 'Order saved.'
  })
}
</script>
