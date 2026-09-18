<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-primary">Posts</h1>
        <p class="text-text/50 text-sm mt-1">{{ posts?.length ?? 0 }} total — up to 4 featured per list</p>
      </div>
      <UButton @click="startCreate">
        <UIcon name="i-lucide-plus" class="text-sm" />
        New post
      </UButton>
    </div>

    <p v-if="listError" class="text-red-400 text-sm mb-4">{{ listError }}</p>

    <div class="bg-background-secondary border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text/50 text-left border-b border-white/10 text-xs uppercase tracking-wide">
            <th class="py-3 px-4 font-semibold">Post</th>
            <th class="px-4 font-semibold">Home</th>
            <th class="px-4 font-semibold">Portfolio</th>
            <th class="px-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in posts"
            :key="post.id"
            class="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <td class="py-3 px-4">
              <div class="flex items-center gap-3">
                <img :src="post.image_url" :alt="post.title" class="w-12 h-12 rounded-lg object-cover shrink-0 border border-white/10" />
                <div class="min-w-0">
                  <p class="font-semibold text-text truncate max-w-[220px]">{{ post.title }}</p>
                  <p class="text-text/40 text-xs truncate max-w-[220px]">{{ post.teaser }}</p>
                </div>
              </div>
            </td>
            <td class="px-4">
              <USwitch
                :model-value="!!post.featured_home"
                :disabled="!post.featured_home && homeCount >= 4"
                @update:model-value="(v: boolean) => toggleFeature(post, 'home', v)"
              />
            </td>
            <td class="px-4">
              <USwitch
                :model-value="!!post.featured_portfolio"
                :disabled="!post.featured_portfolio && portfolioCount >= 4"
                @update:model-value="(v: boolean) => toggleFeature(post, 'portfolio', v)"
              />
            </td>
            <td class="px-4 text-right whitespace-nowrap">
              <UButton size="xs" variant="ghost" @click="startEdit(post)">Edit</UButton>
              <UButton size="xs" variant="ghost" color="error" @click="remove(post)">Delete</UButton>
            </td>
          </tr>
          <tr v-if="!posts?.length">
            <td colspan="4" class="py-10 text-center text-text/40">No posts yet.</td>
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
        <h2 class="text-lg font-bold text-primary mb-4">{{ editingId ? 'Edit post' : 'New post' }}</h2>
        <div class="flex flex-col gap-3">
          <UInput v-model="form.title" placeholder="Title" />
          <UInput v-model="form.image_url" placeholder="Image URL (e.g. /portfolio/45.webp)" />
          <UInput v-model="form.teaser" placeholder="Teaser (one line)" />
          <UTextarea v-model="form.description" placeholder="Full description" :rows="6" />
          <div class="flex gap-6 mt-1">
            <label class="flex items-center gap-2 text-sm text-text/80">
              <UCheckbox v-model="form.featured_home" />
              Featured on Home
            </label>
            <label class="flex items-center gap-2 text-sm text-text/80">
              <UCheckbox v-model="form.featured_portfolio" />
              Featured on Portfolio
            </label>
          </div>
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

interface Post {
  id: number
  title: string
  image_url: string
  teaser: string
  description: string
  featured_home: number
  featured_portfolio: number
}

const { data: posts, refresh } = await useFetch<Post[]>('/api/posts')

const homeCount = computed(() => posts.value?.filter(p => p.featured_home).length ?? 0)
const portfolioCount = computed(() => posts.value?.filter(p => p.featured_portfolio).length ?? 0)

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const listError = ref('')
const editingId = ref<number | null>(null)
const form = reactive({
  title: '',
  image_url: '',
  teaser: '',
  description: '',
  featured_home: false,
  featured_portfolio: false,
})

function startCreate() {
  editingId.value = null
  form.title = ''
  form.image_url = ''
  form.teaser = ''
  form.description = ''
  form.featured_home = false
  form.featured_portfolio = false
  formError.value = ''
  editing.value = true
}

function startEdit(post: Post) {
  editingId.value = post.id
  form.title = post.title
  form.image_url = post.image_url
  form.teaser = post.teaser
  form.description = post.description
  form.featured_home = !!post.featured_home
  form.featured_portfolio = !!post.featured_portfolio
  formError.value = ''
  editing.value = true
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    if (editingId.value) {
      await $fetch(`/api/posts/${editingId.value}`, { method: 'PUT', body: form })
    } else {
      await $fetch('/api/posts', { method: 'POST', body: form })
    }
    editing.value = false
    await refresh()
  } catch (e: unknown) {
    formError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function remove(post: Post) {
  listError.value = ''
  try {
    await $fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    listError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Delete failed.'
  }
}

async function toggleFeature(post: Post, list: 'home' | 'portfolio', value: boolean) {
  listError.value = ''
  try {
    await $fetch(`/api/posts/${post.id}/feature`, { method: 'PATCH', body: { list, value } })
  } catch (e: unknown) {
    listError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Could not update featured status.'
  } finally {
    await refresh() // also snaps the switch back to its true state if the server rejected it
  }
}
</script>
