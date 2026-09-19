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
          <UFormField label="Build type">
            <UInput v-model="form.build_type" placeholder="e.g. House, Map, Vehicle, Statue" class="w-full" />
          </UFormField>
          <UFormField label="Theme">
            <UInput v-model="form.theme" placeholder="e.g. Modern, Fantasy, Ancient" class="w-full" />
          </UFormField>
          <UFormField label="Category">
            <UInput v-model="form.category" placeholder="e.g. Structures, Terraforming, Organic" class="w-full" />
          </UFormField>
          <UFormField label="Release date">
            <UInput v-model="form.released" type="date" placeholder="Released" class="w-full" />
          </UFormField>
          <UFormField label="Description">
            <UTextarea v-model="form.description" placeholder="Description" :rows="6" class="w-full" />
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
}

const { data: items, refresh } = await useFetch<BrowseItem[]>('/api/browse-items')

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const listError = ref('')
const editingId = ref<number | null>(null)
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
  form.title = ''
  form.image_url = ''
  form.price = ''
  form.difficulty = 'Easy'
  form.build_type = ''
  form.theme = ''
  form.category = ''
  form.released = ''
  form.description = ''
  formError.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
  editing.value = true
}

function startEdit(item: BrowseItem) {
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
  formError.value = ''
  selectedImageFile.value = null
  uploadError.value = ''
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
