<template>
  <div class="bg-background min-h-screen">
    <NavBar class="sticky top-0 z-10" />

    <div class="relative overflow-hidden py-14 md:py-20 px-6 md:px-10 lg:px-16">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>

      <div class="relative w-full max-w-none">
        <div class="flex flex-col items-start mb-10">
          <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight text-text">
            Browse <span class="text-primary">Skinpacks</span>
          </h1>
          <p class="text-text/60 mt-2">
            {{ skinpacks.length }} hand-crafted Minecraft skinpacks — free to browse
          </p>
        </div>

        <div class="flex flex-col md:flex-row gap-8">
          <!-- Only Category here, and in a compact wrap rather than the tall
               stacked column /browse uses: skinpacks are tagged by category
               alone, so one tight block keeps the images the main event. -->
          <aside class="w-full md:w-56 shrink-0">
            <div class="bg-background-secondary border border-white/10 rounded-2xl p-4 md:sticky md:top-24">
              <h3 class="text-text/50 text-xs uppercase tracking-widest font-bold mb-3">Category</h3>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="category in categories"
                  :key="category"
                  type="button"
                  class="px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors duration-200 cursor-pointer"
                  :class="activeCategories.includes(category)
                    ? 'bg-primary/15 text-primary border-primary/40'
                    : 'text-text/70 border-white/15 hover:text-primary hover:border-primary/40'"
                  @click="toggleCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
              <button
                v-if="activeCategories.length"
                type="button"
                class="mt-3 text-xs font-bold uppercase tracking-wide text-text/50 hover:text-primary transition-colors cursor-pointer"
                @click="activeCategories = []"
              >
                Clear
              </button>
            </div>
          </aside>

          <!-- Three across, not four: the cards are 16:9 rather than square,
               so four to a row would leave each image too small to read. -->
          <div class="flex-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                v-for="item in paginated"
                :key="item.slug"
                class="group relative bg-background-secondary border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <NuxtLink
                  :to="`/browse/${item.slug}`"
                  class="absolute inset-0 z-0"
                  :aria-label="`View ${item.title}`"
                />
                <img
                  :src="item.image_url"
                  :alt="item.title"
                  class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                  draggable="false"
                />
                <div class="p-5 flex flex-col flex-1">
                  <h3 class="text-white font-extrabold uppercase text-lg tracking-wide mb-3">{{ item.title }}</h3>

                  <div class="relative z-10 mb-3">
                    <StarRating
                      :browse-item-id="item.id"
                      :slug="item.slug"
                      :rating-avg="item.rating_avg"
                      :rating-count="item.rating_count"
                      :my-rating="item.my_rating ?? 0"
                    />
                  </div>

                  <div class="flex flex-wrap items-center gap-2 mb-4">
                    <span class="px-2.5 py-1 rounded-full border border-primary/40 text-primary text-[11px] font-semibold uppercase tracking-wide">{{ item.category }}</span>
                  </div>

                  <div class="relative z-10 flex items-center justify-between mt-auto">
                    <span class="text-primary font-black text-xl uppercase">Free</span>
                    <NuxtLink
                      :to="`/browse/${item.slug}`"
                      class="inline-flex items-center gap-1.5 bg-primary text-black font-bold uppercase text-sm rounded-full px-4 py-2 hover:bg-secondary transition-all duration-300"
                    >
                      View Pack
                      <UIcon name="i-lucide-arrow-right" class="text-sm" />
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <p v-if="paginated.length === 0" class="text-text/50 col-span-full text-center py-16">
                {{ skinpacks.length ? 'No skinpacks match the selected categories.' : 'No skinpacks here yet — check back soon.' }}
              </p>
            </div>

            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-text/70 hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 cursor-pointer"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <UIcon name="i-lucide-chevron-left" />
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold border transition-all duration-300 cursor-pointer"
                :class="currentPage === page
                  ? 'bg-primary text-black border-primary'
                  : 'bg-transparent text-text/70 border-white/20 hover:border-primary hover:text-primary'"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-text/70 hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 cursor-pointer"
                :disabled="currentPage === totalPages"
                @click="currentPage++"
              >
                <UIcon name="i-lucide-chevron-right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PageFooter />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";

interface BrowseItem {
  id: number
  slug: string
  title: string
  image_url: string
  price: number
  category: string
  section: string
  rating_avg: number
  rating_count: number
  my_rating?: number
}

// Same endpoint as /browse -- skinpacks are browse_items rows with
// section = 'skinpacks', so they already carry tags, likes and an optional
// file without a second table or a second API.
const { data: fetched } = await useFetch<BrowseItem[]>('/api/browse-items')
const skinpacks = computed(() =>
  (fetched.value ?? []).filter(p => p.section === 'skinpacks')
)

// StarRating needs to know whether the visitor is logged in: the global
// middleware only fills useAuthUser() on /app/*, and this is a public page.
// Same reason as app/pages/browse/index.vue.
const user = useAuthUser()
if (!user.value) {
  const { data: me } = await useFetch<{ userId: number, role: 'admin' | 'user' } | null>('/api/auth/me', { retry: false })
  user.value = me.value ?? null
}

const { data: taxonomies } = await useFetch<{ skinpack_categories: string[] }>('/api/taxonomies', { retry: false })

// Unlike /browse, only the categories actually used by a skinpack are
// offered: the builds shop shows its whole structure on purpose, but here an
// empty category would just be a dead button on a page with few packs.
const categories = computed(() => {
  const used = new Set(skinpacks.value.map(p => p.category).filter(Boolean))
  const configured = (taxonomies.value?.skinpack_categories ?? []).filter(name => used.has(name))
  const known = new Set(configured.map(n => n.toLowerCase()))
  const extras = [...used].filter(name => !known.has(name.toLowerCase())).sort()
  return [...configured, ...extras]
})

const activeCategories = ref<string[]>([]);

function toggleCategory(value: string) {
  const index = activeCategories.value.indexOf(value)
  if (index === -1) activeCategories.value.push(value)
  else activeCategories.value.splice(index, 1)
}

const filtered = computed(() =>
  activeCategories.value.length === 0
    ? skinpacks.value
    : skinpacks.value.filter(p => activeCategories.value.includes(p.category))
);

// A multiple of the widest grid (lg:grid-cols-3) so a full page never ends
// in a ragged row.
const pageSize = 12;
const currentPage = ref(1);

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)));

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
});

watch(activeCategories, () => { currentPage.value = 1 }, { deep: true });
</script>
