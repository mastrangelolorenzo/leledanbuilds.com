<template>
  <div class="min-h-screen p-8 max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-primary">Posts</h1>
      <UButton @click="startCreate">New post</UButton>
    </div>

    <div v-if="editing" class="mb-8 bg-background-secondary p-6 rounded-2xl border border-white/10 flex flex-col gap-3">
      <UInput v-model="form.title" placeholder="Title" />
      <UInput v-model="form.image_url" placeholder="Image URL (e.g. /portfolio/45.webp)" />
      <UInput v-model="form.teaser" placeholder="Teaser (one line)" />
      <UTextarea v-model="form.description" placeholder="Full description" :rows="6" />
      <div class="flex gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.featured_home" type="checkbox" />
          Featured on Home
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="form.featured_portfolio" type="checkbox" />
          Featured on Portfolio
        </label>
      </div>
      <p v-if="formError" class="text-red-400 text-sm">{{ formError }}</p>
      <div class="flex gap-2">
        <UButton :loading="saving" @click="save">Save</UButton>
        <UButton color="neutral" variant="outline" @click="editing = false">Cancel</UButton>
      </div>
    </div>

    <table class="w-full text-sm">
      <thead>
        <tr class="text-text/50 text-left border-b border-white/10">
          <th class="py-2">Title</th>
          <th>Home</th>
          <th>Portfolio</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="post in posts" :key="post.id" class="border-b border-white/5">
          <td class="py-2">{{ post.title }}</td>
          <td>
            <input
              type="checkbox"
              :checked="!!post.featured_home"
              @change="toggleFeature(post, 'home', ($event.target as HTMLInputElement).checked)"
            />
          </td>
          <td>
            <input
              type="checkbox"
              :checked="!!post.featured_portfolio"
              @change="toggleFeature(post, 'portfolio', ($event.target as HTMLInputElement).checked)"
            />
          </td>
          <td class="text-right">
            <UButton size="xs" variant="ghost" @click="startEdit(post)">Edit</UButton>
            <UButton size="xs" variant="ghost" color="error" @click="remove(post)">Delete</UButton>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script lang="ts" setup>
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

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
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
  await $fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
  await refresh()
}

async function toggleFeature(post: Post, list: 'home' | 'portfolio', value: boolean) {
  try {
    await $fetch(`/api/posts/${post.id}/feature`, { method: 'PATCH', body: { list, value } })
    await refresh()
  } catch {
    await refresh() // snap the checkbox back if the server rejected it (e.g. limit of 4 reached)
  }
}
</script>
