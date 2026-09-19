<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-primary">Work Seen On</h1>
        <p class="text-text/50 text-sm mt-1">{{ items?.length ?? 0 }} total</p>
      </div>
      <UButton @click="startCreate">
        <UIcon name="i-lucide-plus" class="text-sm" />
        New entry
      </UButton>
    </div>

    <p v-if="listError" class="text-red-400 text-sm mb-4">{{ listError }}</p>

    <div class="bg-background-secondary border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text/50 text-left border-b border-white/10 text-xs uppercase tracking-wide">
            <th class="py-3 px-4 font-semibold">Name</th>
            <th class="px-4 font-semibold">Counter</th>
            <th class="px-4 font-semibold">Link</th>
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
                <img :src="item.image_url" :alt="item.name" class="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                <p class="font-semibold text-text truncate max-w-[220px]">{{ item.name }}</p>
              </div>
            </td>
            <td class="px-4 text-text/70">{{ item.counter }}</td>
            <td class="px-4">
              <a v-if="item.link" :href="item.link" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline inline-flex items-center gap-1">
                <UIcon name="i-lucide-external-link" class="text-sm" />
                Visit
              </a>
            </td>
            <td class="px-4 text-right whitespace-nowrap">
              <UButton size="xs" variant="ghost" @click="startEdit(item)">Edit</UButton>
              <UButton size="xs" variant="ghost" color="error" @click="remove(item)">Delete</UButton>
            </td>
          </tr>
          <tr v-if="!items?.length">
            <td colspan="4" class="py-10 text-center text-text/40">No entries yet.</td>
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
        <h2 class="text-lg font-bold text-primary mb-4">{{ editingId ? 'Edit entry' : 'New entry' }}</h2>
        <div class="flex flex-col gap-3">
          <UFormField label="Name">
            <UInput v-model="form.name" placeholder="Name" class="w-full" />
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
          <UFormField label="Subscriber count">
            <UInput v-model="form.counter" placeholder="e.g. 1.2k" class="w-full" />
          </UFormField>
          <UFormField label="Link">
            <UInput v-model="form.link" placeholder="e.g. https://..." class="w-full" />
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

interface WorkSeenOn {
  id: number
  name: string
  image_url: string
  counter: string
  link: string
}

const { data: items, refresh } = await useFetch<WorkSeenOn[]>('/api/work-seen-on')

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const listError = ref('')
const editingId = ref<number | null>(null)
const form = reactive({
  name: '',
  image_url: '',
  counter: '',
  link: '',
})

const selectedImageFile = ref<File | null>(null)
const uploadingImage = ref(false)
const uploadError = ref('')

async function onImageFileSelected(file: File | null) {
  if (!file) return
  uploadingImage.value = true
  uploadError.value = ''
  try {
    const body = new FormData()
    body.append('file', file)
    const res = await $fetch<{ url: string }>('/api/admin/upload', { method: 'POST', body })
    form.image_url = res.url
  } catch (e: unknown) {
    uploadError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Upload failed.'
  } finally {
    uploadingImage.value = false
    selectedImageFile.value = null
  }
}

function startCreate() {
  editingId.value = null
  form.name = ''
  form.image_url = ''
  form.counter = ''
  form.link = ''
  formError.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  editing.value = true
}

function startEdit(item: WorkSeenOn) {
  editingId.value = item.id
  form.name = item.name
  form.image_url = item.image_url
  form.counter = item.counter
  form.link = item.link
  formError.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  editing.value = true
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await $fetch(`/api/work-seen-on/${editingId.value}`, { method: 'PUT', body: form })
    } else {
      await $fetch('/api/work-seen-on', { method: 'POST', body: form })
    }
    editing.value = false
    await refresh()
  } catch (e: unknown) {
    formError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function remove(item: WorkSeenOn) {
  listError.value = ''
  try {
    await $fetch(`/api/work-seen-on/${item.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    listError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Delete failed.'
  }
}
</script>
