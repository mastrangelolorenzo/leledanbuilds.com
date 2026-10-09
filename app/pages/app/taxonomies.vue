<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-primary">Taxonomies</h1>
      <p class="text-text/50 text-sm mt-1">
        Categories, themes and build types. Builds can only use terms from these lists.
      </p>
    </div>

    <p v-if="actionError" class="text-red-400 text-sm mb-4">{{ actionError }}</p>
    <p v-if="actionMessage" class="text-primary text-sm mb-4">{{ actionMessage }}</p>

    <div class="flex flex-col gap-6">
      <section
        v-for="group in groups"
        :key="group.kind"
        class="bg-background-secondary border border-white/10 rounded-2xl p-5"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold uppercase tracking-wide text-text/70">{{ group.label }}</h2>
          <span class="text-text/40 text-xs">{{ group.terms.length }} terms</span>
        </div>

        <!-- Terms used by a build but absent from the list. They exist
             because the product form used to invent terms from free text. -->
        <div
          v-if="group.orphans.length"
          class="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3 mb-4"
        >
          <p class="text-amber-400 font-bold text-xs mb-1">
            {{ group.orphans.length }} term(s) used by builds but missing from this list
          </p>
          <p class="text-text/50 text-xs mb-2">
            Left over from when builds could invent their own. Add them here, or change those builds.
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="o in group.orphans"
              :key="o.name"
              type="button"
              class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 transition-colors disabled:opacity-50"
              :disabled="busy"
              @click="addTerm(group, o.name)"
            >
              + {{ o.name }} ({{ o.usage_count }})
            </button>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-4">
          <div
            v-for="term in group.terms"
            :key="term.id"
            class="inline-flex items-center gap-2 bg-black/30 border border-white/15 rounded-full pl-3 pr-1.5 py-1"
          >
            <span class="text-text text-sm">{{ term.name }}</span>
            <span class="text-text/35 text-[11px]">{{ term.usage_count }}</span>
            <button
              type="button"
              class="text-text/40 hover:text-primary transition-colors disabled:opacity-40"
              :disabled="busy"
              :aria-label="`Rename ${term.name}`"
              @click="renameTerm(group, term)"
            >
              <UIcon name="i-lucide-pencil" class="text-xs" />
            </button>
            <button
              type="button"
              class="text-text/40 hover:text-red-400 transition-colors disabled:opacity-40"
              :disabled="busy"
              :aria-label="`Delete ${term.name}`"
              @click="deleteTerm(group, term)"
            >
              <UIcon name="i-lucide-x" class="text-xs" />
            </button>
          </div>
          <p v-if="!group.terms.length" class="text-text/40 text-sm py-1">No terms yet.</p>
        </div>

        <form class="flex items-center gap-2" @submit.prevent="addTerm(group, newTerm[group.kind] ?? '')">
          <UInput
            v-model="newTerm[group.kind]"
            :placeholder="`Add a ${group.label.toLowerCase()}`"
            :ui="{ base: 'rounded-full' }"
            class="flex-1 max-w-xs"
          />
          <UButton type="submit" class="rounded-full" :disabled="busy || !newTerm[group.kind]?.trim()">
            Add
          </UButton>
        </form>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' })

interface Term { id: number, name: string, usage_count: number }
interface Orphan { name: string, usage_count: number }
interface Group { kind: string, label: string, terms: Term[], orphans: Orphan[] }

const KINDS = ['categories', 'themes', 'build-types'] as const

const groups = ref<Group[]>([])
const newTerm = reactive<Record<string, string>>({})
const busy = ref(false)
const actionError = ref('')
const actionMessage = ref('')

async function load() {
  // Promise.all rather than sequential awaits: three independent reads on a
  // cold Worker are noticeably slower in series.
  const loaded = await Promise.all(
    KINDS.map(kind => $fetch<Group>(`/api/admin/taxonomies/${kind}`).catch(() => null))
  )
  groups.value = loaded
    .map((g, i) => g ?? { kind: KINDS[i]!, label: KINDS[i]!, terms: [], orphans: [] })
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

async function addTerm(group: Group, rawName: string) {
  const name = rawName.trim()
  if (!name) return
  await run(async () => {
    await $fetch(`/api/admin/taxonomies/${group.kind}`, { method: 'POST', body: { name } })
    newTerm[group.kind] = ''
    return `Added "${name}".`
  })
}

async function renameTerm(group: Group, term: Term) {
  const next = prompt(`Rename "${term.name}" to:`, term.name)
  // null is cancel, which is different from clearing the field.
  if (next === null || next.trim() === term.name) return
  await run(async () => {
    const res = await $fetch<{ products_updated: number }>(
      `/api/admin/taxonomies/${group.kind}/${term.id}`,
      { method: 'PATCH', body: { name: next } }
    )
    // The count matters: renaming also rewrites the term on every build that
    // used it, and the operator should see that it happened.
    return res.products_updated > 0
      ? `Renamed, and updated ${res.products_updated} build(s).`
      : 'Renamed.'
  })
}

async function deleteTerm(group: Group, term: Term) {
  if (term.usage_count > 0) {
    // The server refuses this too; checking here saves a round trip and
    // gives the reason before the click rather than after.
    actionError.value = `"${term.name}" is used by ${term.usage_count} build(s). Change those first.`
    return
  }
  if (!confirm(`Delete "${term.name}"?`)) return
  await run(async () => {
    await $fetch(`/api/admin/taxonomies/${group.kind}/${term.id}`, { method: 'DELETE' })
    return `Deleted "${term.name}".`
  })
}
</script>
