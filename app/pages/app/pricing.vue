<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-2xl md:text-3xl font-bold text-primary">Pricing</h1>
        <p class="text-text/50 text-sm mt-1">{{ items?.length ?? 0 }} total</p>
      </div>
      <UButton @click="startCreate">
        <UIcon name="i-lucide-plus" class="text-sm" />
        New plan
      </UButton>
    </div>

    <p v-if="listError" class="text-red-400 text-sm mb-4">{{ listError }}</p>

    <div class="bg-background-secondary border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-text/50 text-left border-b border-white/10 text-xs uppercase tracking-wide">
            <th class="py-3 px-4 font-semibold">Title</th>
            <th class="px-4 font-semibold">Price</th>
            <th class="px-4 font-semibold">Badge</th>
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
              <p class="font-semibold text-text truncate max-w-[220px]">{{ item.title }}</p>
              <p class="text-text/40 text-xs truncate max-w-[220px]">{{ item.subtitle }}</p>
            </td>
            <td class="px-4 text-text/70">{{ item.price }}</td>
            <td class="px-4">
              <span
                v-if="item.badge"
                class="inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary/15 text-primary"
              >
                {{ item.badge }}
              </span>
            </td>
            <td class="px-4 text-right whitespace-nowrap">
              <UButton size="xs" variant="ghost" @click="startEdit(item)">Edit</UButton>
              <UButton size="xs" variant="ghost" color="error" @click="remove(item)">Delete</UButton>
            </td>
          </tr>
          <tr v-if="!items?.length">
            <td colspan="4" class="py-10 text-center text-text/40">No plans yet.</td>
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
        <h2 class="text-lg font-bold text-primary mb-4">{{ editingId ? 'Edit plan' : 'New plan' }}</h2>
        <div class="flex flex-col gap-3">
          <UFormField label="Plan title">
            <UInput v-model="form.title" placeholder="Title" class="w-full" />
          </UFormField>
          <UFormField label="Price">
            <UInput v-model="form.price" placeholder="e.g. $49/mo" class="w-full" />
          </UFormField>
          <UFormField label="Subtitle">
            <UInput v-model="form.subtitle" placeholder="Subtitle" class="w-full" />
          </UFormField>
          <UFormField label="Badge (optional)">
            <UInput v-model="form.badge" placeholder="e.g. Most Popular" class="w-full" />
          </UFormField>
          <UFormField label="Features (one per line)">
            <UTextarea v-model="featuresText" placeholder="Features, one per line" :rows="6" class="w-full" />
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

interface PricingPlan {
  id: number
  title: string
  price: string
  subtitle: string
  features: string[]
  badge: string | null
}

const { data: items, refresh } = await useFetch<PricingPlan[]>('/api/pricing')

const editing = ref(false)
const saving = ref(false)
const formError = ref('')
const listError = ref('')
const editingId = ref<number | null>(null)
const featuresText = ref('')
const form = reactive({
  title: '',
  price: '',
  subtitle: '',
  badge: '',
})

function startCreate() {
  editingId.value = null
  form.title = ''
  form.price = ''
  form.subtitle = ''
  form.badge = ''
  featuresText.value = ''
  formError.value = ''
  editing.value = true
}

function startEdit(item: PricingPlan) {
  editingId.value = item.id
  form.title = item.title
  form.price = item.price
  form.subtitle = item.subtitle
  form.badge = item.badge ?? ''
  featuresText.value = item.features.join('\n')
  formError.value = ''
  editing.value = true
}

async function save() {
  saving.value = true
  formError.value = ''
  try {
    const features = featuresText.value.split('\n').map(f => f.trim()).filter(Boolean)
    const body = {
      title: form.title,
      price: form.price,
      subtitle: form.subtitle,
      badge: form.badge || null,
      features,
    }
    if (editingId.value) {
      await $fetch(`/api/pricing/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/pricing', { method: 'POST', body })
    }
    editing.value = false
    await refresh()
  } catch (e: unknown) {
    formError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Save failed.'
  } finally {
    saving.value = false
  }
}

async function remove(item: PricingPlan) {
  listError.value = ''
  try {
    await $fetch(`/api/pricing/${item.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: unknown) {
    listError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Delete failed.'
  }
}
</script>
