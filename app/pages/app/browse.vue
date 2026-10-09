<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-primary">Browse Items</h1>
        <p class="text-text/50 text-sm mt-1">{{ items?.length ?? 0 }} total</p>
      </div>
      <UButton @click="startCreate">
        <UIcon name="i-lucide-plus" class="text-sm" />
        New item
      </UButton>
    </div>

    <!-- Difficulty colours: configurable per level (server/database/migrations/
         0014_create_difficulty_colors.sql). Level names stay fixed -- only
         the colour is editable here. -->
    <div class="bg-background-secondary border border-white/10 rounded-2xl p-5 mb-8">
      <h2 class="text-sm font-bold uppercase tracking-wide text-text/70 mb-1">Difficulty colours</h2>
      <p class="text-text/40 text-xs mb-4">Controls the dot colour shown for each difficulty level on the product page.</p>
      <p v-if="difficultyColorsLoadError" class="text-red-400 text-sm mb-4">{{ difficultyColorsLoadError }}</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="level in DIFFICULTIES" :key="level" class="flex flex-col gap-2">
          <UFormField :label="level">
            <div class="flex items-center gap-2">
              <input
                v-model="difficultyColorForm[level]"
                type="color"
                :aria-label="`${level} colour picker`"
                class="w-9 h-9 rounded-lg border border-white/15 bg-transparent cursor-pointer shrink-0 p-0"
              />
              <UInput v-model="difficultyColorForm[level]" placeholder="#22c55e" class="flex-1" />
            </div>
          </UFormField>
          <div class="flex items-center gap-2 min-h-[1.25rem]">
            <UButton size="xs" :loading="savingColorLevel === level" @click="saveDifficultyColor(level)">Save</UButton>
            <span v-if="colorSaveSuccess[level]" class="text-primary text-xs font-semibold">Saved</span>
            <span v-if="colorSaveError[level]" class="text-red-400 text-xs">{{ colorSaveError[level] }}</span>
          </div>
        </div>
      </div>
    </div>

    <p v-if="listError" class="text-red-400 text-sm mb-4">{{ listError }}</p>

    <div class="bg-background-secondary border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text/50 text-left border-b border-white/10 text-xs uppercase tracking-wide">
            <th class="py-3 px-4 font-semibold">Item</th>
            <th class="px-4 font-semibold">Price</th>
            <th class="px-4 font-semibold">Difficulty</th>
            <th class="px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <img :src="item.image_url" :alt="item.title" class="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                <div class="min-w-0">
                  <p class="font-semibold text-text truncate max-w-[220px]">{{ item.title }}</p>
                  <div class="flex flex-wrap items-center gap-1.5 mt-1">
                    <span class="px-2 py-0.5 rounded-full border border-primary/40 text-primary text-[10px] font-semibold uppercase tracking-wide">{{ item.build_type }}</span>
                    <span class="px-2 py-0.5 rounded-full border border-white/20 text-text/70 text-[10px] font-semibold uppercase tracking-wide">{{ item.theme }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-4 text-text/70">€{{ item.price }}</td>
            <td class="px-4 text-text/70">{{ item.difficulty }}</td>
            <td class="px-4 text-right whitespace-nowrap">
              <UButton size="xs" variant="ghost" @click="startEdit(item)">Edit</UButton>
              <UButton size="xs" variant="ghost" color="error" @click="remove(item)">Delete</UButton>
            </td>
          </tr>
          <tr v-if="!items?.length">
            <td colspan="4" class="py-10 text-center text-text/40">No browse items yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit modal -->
    <div
      v-if="editing"
      class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      @click.self="editing = false"
    >
      <div class="bg-background-secondary border border-primary/30 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold text-primary mb-4">{{ editingId ? 'Edit browse item' : 'New browse item' }}</h2>
        <div class="flex flex-col gap-3">
          <UFormField label="Title">
            <UInput v-model="form.title" placeholder="e.g. Modern Glass Villa" class="w-full" />
          </UFormField>
          <UFormField label="Image">
            <div class="flex items-center gap-4">
              <img
                v-if="form.image_url"
                :src="form.image_url"
                alt="Current image"
                class="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
              />
              <UFileUpload
                v-model="selectedImageFile"
                accept="image/webp,image/png,image/jpeg,image/gif"
                :disabled="uploadingImage"
                icon="i-lucide-image-up"
                label="Click or drop an image to upload"
                class="flex-1"
                @update:model-value="onImageFileSelected"
              />
            </div>
            <p v-if="uploadingImage" class="text-text/50 text-xs mt-1">Uploading…</p>
            <p v-if="uploadError" class="text-red-400 text-xs mt-1">{{ uploadError }}</p>
          </UFormField>
          <UFormField label="Price (€)">
            <UInput v-model="form.price" type="number" placeholder="Price" class="w-full" />
          </UFormField>
          <UFormField label="Difficulty">
            <USelect v-model="form.difficulty" :items="DIFFICULTIES" placeholder="Difficulty" class="w-full" />
          </UFormField>
          <!-- Select only: no create-item. Terms are managed on /app/taxonomies,
               and the server now rejects one it does not know. Letting the
               form invent a term here is what filled the lists with typos. -->
          <UFormField label="Build type">
            <USelectMenu
              v-model="form.build_type"
              :items="buildTypeChoices"
              placeholder="Select a build type"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Theme">
            <USelectMenu
              v-model="form.theme"
              :items="themeChoices"
              placeholder="Select a theme"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Category">
            <USelectMenu
              v-model="form.category"
              :items="categoryChoices"
              placeholder="Select a category"
              class="w-full"
            />
          </UFormField>
          <p class="text-text/40 text-xs -mt-1">
            Missing one?
            <NuxtLink to="/app/taxonomies" class="text-primary hover:text-secondary transition-colors">Manage taxonomies</NuxtLink>
          </p>
          <UFormField label="Release date">
            <UInput v-model="form.released" type="date" placeholder="Released" class="w-full" />
          </UFormField>
          <UFormField label="Description">
            <UTextarea v-model="form.description" placeholder="Description" :rows="6" class="w-full" />
          </UFormField>
          <UFormField label="Downloadable file (paid deliverable)">
            <div class="flex flex-col gap-2">
              <p v-if="form.download_key && !deliverableFilename" class="text-text/50 text-xs">A file is currently attached. Upload a new one to replace it.</p>
              <p v-if="deliverableFilename" class="text-text/50 text-xs">Attached: {{ deliverableFilename }}</p>
              <UFileUpload
                v-model="selectedDeliverableFile"
                accept=".zip,.rar,.7z,.schem,.schematic,.litematic,.mcworld,.pdf"
                :disabled="uploadingDeliverable"
                icon="i-lucide-file-up"
                label="Click or drop a file to upload (zip, rar, 7z, schem, schematic, litematic, mcworld, pdf)"
                @update:model-value="onDeliverableFileSelected"
              />
              <p v-if="uploadingDeliverable" class="text-text/50 text-xs">
                Uploading… {{ deliverableUploadProgress }}%
              </p>
              <p v-if="deliverableUploadDone" class="text-green-400 text-xs">
                Uploaded. Press Save to attach it to this build.
              </p>
              <p v-if="deliverableUploadError" class="text-red-400 text-xs">{{ deliverableUploadError }}</p>
            </div>
          </UFormField>
          <p v-if="formError" class="text-red-400 text-sm">{{ formError }}</p>
          <div class="flex gap-2 mt-2">
            <UButton :loading="saving" @click="save">Save</UButton>
            <UButton color="neutral" variant="outline" @click="editing = false">Cancel</UButton>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' })

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'] as const

interface BrowseItem {
  id: number
  slug: string
  title: string
  image_url: string
  price: number
  difficulty: typeof DIFFICULTIES[number]
  build_type: string
  theme: string
  category: string
  released: string
  description: string
  download_key: string | null
  has_download: boolean
}

const { data: items, refresh } = await useFetch<BrowseItem[]>('/api/browse-items')
const { data: buildTypeOptions } = await useFetch<string[]>('/api/admin/build-types')
const { data: themeOptions } = await useFetch<string[]>('/api/admin/themes')
const { data: categoryOptions } = await useFetch<string[]>('/api/admin/categories')

const { data: difficultyColorsData, error: difficultyColorsError } = await useFetch<Record<string, string>>('/api/difficulty-colors')
const difficultyColorsLoadError = computed(() => difficultyColorsError.value ? 'Could not load difficulty colours. Please refresh the page.' : '')

const difficultyColorForm = reactive<Record<typeof DIFFICULTIES[number], string>>({
  Easy: '',
  Medium: '',
  Hard: '',
  Expert: '',
})
watch(difficultyColorsData, (data) => {
  if (!data) return
  for (const level of DIFFICULTIES) {
    if (data[level]) difficultyColorForm[level] = data[level]
  }
}, { immediate: true })

const savingColorLevel = ref<typeof DIFFICULTIES[number] | null>(null)
const colorSaveError = reactive<Record<string, string>>({})
const colorSaveSuccess = reactive<Record<string, boolean>>({})
const colorSuccessTimers: Partial<Record<string, ReturnType<typeof setTimeout>>> = {}

async function saveDifficultyColor(level: typeof DIFFICULTIES[number]) {
  savingColorLevel.value = level
  colorSaveError[level] = ''
  colorSaveSuccess[level] = false
  try {
    await $fetch(`/api/difficulty-colors/${level}`, { method: 'PUT', body: { color: difficultyColorForm[level] } })
    colorSaveSuccess[level] = true
    if (colorSuccessTimers[level]) clearTimeout(colorSuccessTimers[level])
    colorSuccessTimers[level] = setTimeout(() => { colorSaveSuccess[level] = false }, 2000)
  } catch (e: unknown) {
    colorSaveError[level] = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Save failed.'
  } finally {
    savingColorLevel.value = null
  }
}

// An item saved before taxonomies were managed can hold a term that is no
// longer in the list. Including the current value keeps it selected and
// visible instead of the field appearing blank -- which would look like the
// product had no category, and would silently change it on the next save.
function withCurrent(options: string[] | null, current: string): string[] {
  const list = options ?? []
  if (current && !list.some(o => o.toLowerCase() === current.toLowerCase())) {
    return [current, ...list]
  }
  return list
}

const buildTypeChoices = computed(() => withCurrent(buildTypeOptions.value, form.build_type))
const themeChoices = computed(() => withCurrent(themeOptions.value, form.theme))
const categoryChoices = computed(() => withCurrent(categoryOptions.value, form.category))

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const listError = ref('')
const editingId = ref<number | null>(null)
const formGeneration = ref(0)
const form = reactive({
  title: '',
  image_url: '',
  price: '',
  difficulty: 'Easy' as typeof DIFFICULTIES[number],
  build_type: '',
  theme: '',
  category: '',
  released: '',
  description: '',
  download_key: null as string | null,
})

const selectedImageFile = ref<File | null>(null)
const uploadingImage = ref(false)
const uploadError = ref('')

const selectedDeliverableFile = ref<File | null>(null)
const uploadingDeliverable = ref(false)
const deliverableUploadProgress = ref(0)
// Drives the explicit "uploaded, now save" confirmation: an attached file is
// only held in the form until Save is pressed, which is not obvious.
const deliverableUploadDone = ref(false)
const deliverableUploadError = ref('')
const deliverableFilename = ref('')

async function onImageFileSelected(file: File | null) {
  if (!file) return
  const generation = formGeneration.value
  uploadingImage.value = true
  uploadError.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body })
    if (generation === formGeneration.value) {
      form.image_url = res.url
    }
  } catch (e: unknown) {
    if (generation === formGeneration.value) {
      uploadError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Upload failed.'
    }
  } finally {
    uploadingImage.value = false
    selectedImageFile.value = null
  }
}

// Chunked upload, because the single-request endpoint buffers the whole body
// in a 128 MiB isolate and so could not take a file over ~25 MB -- far too
// small for a real world export. The browser slices the file and each request
// carries one part, so peak server memory is one part no matter how big the
// file is.
//
// The formGeneration guard is re-checked after every part, not just at the
// end: an upload of a multi-gigabyte file runs for minutes, and without this
// a part landing after the admin switched to editing a different product
// would attach this file to that product. (Same hazard the single-shot
// version guarded, just with many more await points to cover.)
async function onDeliverableFileSelected(file: File | null) {
  if (!file) return
  const generation = formGeneration.value
  uploadingDeliverable.value = true
  deliverableUploadError.value = ''
  deliverableUploadProgress.value = 0
  deliverableUploadDone.value = false

  let key = ''
  let uploadId = ''

  try {
    const started = await $fetch<{ key: string, uploadId: string, partSize: number }>(
      '/api/admin/upload-file/start',
      { method: 'POST', body: { filename: file.name } }
    )
    key = started.key
    uploadId = started.uploadId

    const partSize = started.partSize
    // Math.max(1, ...) so a zero-byte file still sends one (empty) part and
    // gets rejected by the server's own empty-body check, rather than
    // completing with no parts at all.
    const totalParts = Math.max(1, Math.ceil(file.size / partSize))
    const parts: { partNumber: number, etag: string }[] = []

    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      if (generation !== formGeneration.value) {
        await abortDeliverableUpload(key, uploadId)
        deliverableUploadError.value = 'Upload cancelled because the form was changed.'
        return
      }

      const slice = file.slice((partNumber - 1) * partSize, partNumber * partSize)
      const uploaded = await $fetch<{ partNumber: number, etag: string }>(
        `/api/admin/upload-file/part?key=${encodeURIComponent(key)}&uploadId=${encodeURIComponent(uploadId)}&partNumber=${partNumber}`,
        { method: 'PUT', body: slice }
      )
      parts.push(uploaded)
      deliverableUploadProgress.value = Math.round((partNumber / totalParts) * 100)
    }

    if (generation !== formGeneration.value) {
      await abortDeliverableUpload(key, uploadId)
      deliverableUploadError.value = 'Upload cancelled because the form was changed.'
      return
    }

    const done = await $fetch<{ key: string, filename: string }>(
      '/api/admin/upload-file/complete',
      { method: 'POST', body: { key, uploadId, parts } }
    )

    if (generation === formGeneration.value) {
      form.download_key = done.key
      // file.name, not done.filename. The server reads the name back from
      // the object's customMetadata, and R2's complete() does not reliably
      // echo metadata that was set when the multipart upload was created --
      // in production it came back empty, which left `v-if="deliverableFilename"`
      // false and made a SUCCESSFUL upload look like it had silently done
      // nothing. The browser has known the name all along; ask it, not R2.
      deliverableFilename.value = done.filename || file.name
      deliverableUploadDone.value = true
    } else {
      // The file is in R2 and paid for in bandwidth, but the form it belonged
      // to is gone. Say so rather than discarding the outcome in silence.
      deliverableUploadError.value = 'Upload finished, but the form had already changed — re-attach the file.'
    }
  } catch (e: unknown) {
    // Leave no orphaned parts behind on any failure.
    if (key && uploadId) await abortDeliverableUpload(key, uploadId)
    // Report unconditionally, NOT only when the generation still matches.
    // Suppressing the message on a stale generation meant a failed upload
    // could finish in complete silence -- the operator saw the progress line
    // vanish and nothing else, with no way to tell a failure from a success.
    deliverableUploadError.value = describeUploadError(e)
    console.error('[deliverable-upload] failed', e)
  } finally {
    uploadingDeliverable.value = false
    deliverableUploadProgress.value = 0
    selectedDeliverableFile.value = null
  }
}

// Turns whatever $fetch threw into something an operator can act on. The
// previous version read only data.statusMessage and fell back to a bare
// "Upload failed.", which hid the two things that actually identify the
// cause: the HTTP status (401 means the session expired, 413 too large, 5xx
// server-side) and a network-level failure, which carries no status at all.
function describeUploadError(e: unknown): string {
  const err = e as { statusCode?: number, status?: number, data?: { statusMessage?: string }, message?: string }
  const status = err.statusCode ?? err.status
  const detail = err.data?.statusMessage ?? err.message
  if (status === 401 || status === 403) {
    return 'Your admin session expired. Reload the page and log in again.'
  }
  if (status) {
    return `Upload failed (HTTP ${status})${detail ? `: ${detail}` : ''}`
  }
  // No status at all: the request never got a response -- offline, blocked,
  // or the connection dropped mid-part.
  return `Upload failed: ${detail ?? 'the request did not reach the server.'}`
}

// Best-effort cleanup: if this fails there is nothing more the UI can do, and
// surfacing it would replace the real error with a cleanup error.
async function abortDeliverableUpload(key: string, uploadId: string) {
  try {
    await $fetch('/api/admin/upload-file/abort', { method: 'POST', body: { key, uploadId } })
  } catch {
    // Intentionally ignored -- see above.
  }
}

function startCreate() {
  formGeneration.value++
  editingId.value = null
  form.title = ''
  form.image_url = ''
  form.price = ''
  form.difficulty = 'Easy'
  form.build_type = ''
  form.theme = ''
  form.category = ''
  form.released = ''
  form.description = ''
  form.download_key = null
  formError.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  deliverableFilename.value = ''
  deliverableUploadError.value = ''
  editing.value = true
}

function startEdit(item: BrowseItem) {
  formGeneration.value++
  editingId.value = item.id
  form.title = item.title
  form.image_url = item.image_url
  form.price = String(item.price)
  form.difficulty = item.difficulty
  form.build_type = item.build_type
  form.theme = item.theme
  form.category = item.category
  form.released = item.released
  form.description = item.description
  form.download_key = item.download_key
  formError.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  deliverableFilename.value = ''
  deliverableUploadError.value = ''
  editing.value = true
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    const body = {
      title: form.title,
      image_url: form.image_url,
      price: Number(form.price),
      difficulty: form.difficulty,
      build_type: form.build_type,
      theme: form.theme,
      category: form.category,
      released: form.released,
      description: form.description,
      download_key: form.download_key,
    }
    if (editingId.value) {
      await $fetch(`/api/browse-items/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/browse-items', { method: 'POST', body })
    }
    editing.value = false
    await refresh()
  } catch (e: unknown) {
    formError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function remove(item: BrowseItem) {
  listError.value = ''
  try {
    await $fetch(`/api/browse-items/${item.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    listError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Delete failed.'
  }
}
</script>
