<template>
  <div class="bg-background">
    <NavBar class="sticky top-0 z-10" />

    <div v-if="route.query.checkout === 'success'" class="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 pt-8">
      <div class="bg-primary/10 border border-primary/30 text-primary rounded-xl px-4 py-3 text-sm font-semibold">
        Thanks for your purchase! We're confirming your payment now — it will appear in
        <NuxtLink to="/app/purchases" class="underline">your dashboard</NuxtLink> as soon as it clears.
      </div>
    </div>
    <div v-else-if="route.query.checkout === 'pending'" class="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 pt-8">
      <div class="bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl px-4 py-3 text-sm font-semibold">
        We received your approval and are confirming your payment now — this can take a moment. Your download will appear in
        <NuxtLink to="/app/purchases" class="underline">your dashboard</NuxtLink> shortly.
      </div>
    </div>
    <div v-else-if="route.query.checkout === 'cancelled'" class="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 pt-8">
      <div class="bg-white/5 border border-white/10 text-text/70 rounded-xl px-4 py-3 text-sm font-semibold">
        Checkout cancelled — no payment was made.
      </div>
    </div>

    <div class="relative overflow-hidden py-14 md:py-20 px-6 md:px-10 lg:px-16">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>

      <div class="relative w-full max-w-none">
        <div class="flex flex-col items-start mb-10">
          <h1 class="text-4xl md:text-6xl font-black uppercase tracking-tight text-text">
            Browse <span class="text-primary">Builds</span>
          </h1>
          <p class="text-text/60 mt-2">
            Explore {{ products.length }} premium Minecraft builds
          </p>
        </div>

        <div class="flex flex-col md:flex-row gap-8">
          <!-- Sidebar -->
          <aside class="w-full md:w-72 shrink-0 flex flex-col gap-6">
            <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
              <h3 class="text-text/50 text-xs uppercase tracking-widest font-bold mb-4">Build Type</h3>
              <div class="flex flex-col gap-1">
                <button
                  v-for="type in buildTypes"
                  :key="type"
                  type="button"
                  class="text-left px-2 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200"
                  :class="activeBuildTypes.includes(type)
                    ? 'bg-primary/15 text-primary'
                    : 'text-text/70 hover:text-primary hover:bg-white/5'"
                  @click="toggleFilter(activeBuildTypes, type)"
                >
                  {{ type }}
                </button>
              </div>
            </div>

            <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
              <h3 class="text-text/50 text-xs uppercase tracking-widest font-bold mb-4">Theme</h3>
              <div class="flex flex-col gap-1">
                <button
                  v-for="theme in themes"
                  :key="theme"
                  type="button"
                  class="text-left px-2 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200"
                  :class="activeThemes.includes(theme)
                    ? 'bg-primary/15 text-primary'
                    : 'text-text/70 hover:text-primary hover:bg-white/5'"
                  @click="toggleFilter(activeThemes, theme)"
                >
                  {{ theme }}
                </button>
              </div>
            </div>

            <div class="bg-background-secondary border border-white/10 rounded-2xl p-5">
              <h3 class="text-text/50 text-xs uppercase tracking-widest font-bold mb-4">Category</h3>
              <div class="flex flex-col gap-1">
                <button
                  v-for="category in categories"
                  :key="category"
                  type="button"
                  class="text-left px-2 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-200"
                  :class="activeCategories.includes(category)
                    ? 'bg-primary/15 text-primary'
                    : 'text-text/70 hover:text-primary hover:bg-white/5'"
                  @click="toggleFilter(activeCategories, category)"
                >
                  {{ category }}
                </button>
              </div>
            </div>
          </aside>

          <!-- Results -->
          <div class="flex-1">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                v-for="item in paginatedProducts"
                :key="item.slug"
                class="group relative bg-background-secondary border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
              >
                <img
                  :src="item.image_url"
                  :alt="item.title"
                  class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                  draggable="false"
                />
                <!-- Positioned outside the "View Build" NuxtLink below (and
                     @click.stop inside LikeButton itself) so liking never
                     also navigates to the product page. -->
                <LikeButton
                  :browse-item-id="item.id"
                  :slug="item.slug"
                  :like-count="item.like_count"
                  :liked-by-me="item.liked_by_me ?? false"
                  class="absolute top-3 right-3 z-10"
                />
                <div class="p-5 flex flex-col flex-1">
                  <h3 class="text-white font-extrabold uppercase text-lg tracking-wide mb-3">{{ item.title }}</h3>

                  <div class="flex flex-wrap items-center gap-2 mb-3">
                    <span class="px-2.5 py-1 rounded-full border border-primary/40 text-primary text-[11px] font-semibold uppercase tracking-wide">{{ item.build_type }}</span>
                    <span class="px-2.5 py-1 rounded-full border border-white/20 text-text/70 text-[11px] font-semibold uppercase tracking-wide">{{ item.theme }}</span>
                  </div>

                  <div class="flex items-center gap-2 mb-4">
                    <span class="text-text/50 text-xs uppercase tracking-wide font-semibold">{{ item.difficulty }}</span>
                    <span class="flex items-center gap-1">
                      <!-- Same admin-configured colours as the detail page
                           (app/pages/browse/[slug].vue): inline style when a
                           valid colour exists for this level, otherwise the
                           old bg-primary class -- never a blank dot. -->
                      <span
                        v-for="n in 4"
                        :key="n"
                        class="w-2.5 h-2.5 rounded-sm"
                        :class="n <= difficultyLevels[item.difficulty] ? (filledDotColor(item.difficulty) ? '' : 'bg-primary') : 'bg-white/15'"
                        :style="n <= difficultyLevels[item.difficulty] && filledDotColor(item.difficulty) ? { backgroundColor: filledDotColor(item.difficulty) } : undefined"
                      ></span>
                    </span>
                  </div>

                  <div class="flex items-center justify-between mt-auto">
                    <span class="text-primary font-black text-2xl">€{{ item.price }}</span>
                    <NuxtLink
                      :to="`/browse/${item.slug}`"
                      class="inline-flex items-center gap-1.5 bg-primary text-black font-bold uppercase text-sm rounded-full px-4 py-2 hover:bg-secondary transition-all duration-300"
                    >
                      View Build
                      <UIcon name="i-lucide-arrow-right" class="text-sm" />
                    </NuxtLink>
                  </div>
                </div>
              </div>

              <p v-if="paginatedProducts.length === 0" class="text-text/50 col-span-full text-center py-16">
                {{ products.length ? 'No builds match the selected filters.' : 'No builds here yet — check back soon.' }}
              </p>
            </div>

            <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-10">
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-text/70 hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-text/70"
                :disabled="currentPage === 1"
                @click="currentPage--"
              >
                <UIcon name="i-lucide-chevron-left" />
              </button>
              <button
                v-for="page in totalPages"
                :key="page"
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold border transition-all duration-300"
                :class="currentPage === page
                  ? 'bg-primary text-black border-primary'
                  : 'bg-transparent text-text/70 border-white/20 hover:border-primary hover:text-primary'"
                @click="currentPage = page"
              >
                {{ page }}
              </button>
              <button
                type="button"
                class="w-9 h-9 flex items-center justify-center rounded-full border border-white/20 text-text/70 hover:border-primary hover:text-primary transition-all duration-300 disabled:opacity-30 disabled:hover:border-white/20 disabled:hover:text-text/70"
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
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import { useRoute } from "#app";
import { isValidHexColor } from "../../../server/utils/difficultyColors";

interface BrowseItem {
  id: number
  slug: string
  title: string
  image_url: string
  price: number
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'
  build_type: string
  theme: string
  category: string
  released: string
  description: string
  like_count: number
  liked_by_me?: boolean
}

const difficultyLevels: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 }

const route = useRoute();

const { data: fetchedProducts } = await useFetch<BrowseItem[]>('/api/browse-items')
const products = computed(() => fetchedProducts.value ?? [])

// Admin-configurable difficulty dot colours, same source as the detail page
// (server/api/difficulty-colors). A failed fetch leaves this empty, which
// filledDotColor() below treats as "no configured colour" -- the dots fall
// back to bg-primary rather than rendering blank.
const { data: difficultyColors } = await useFetch<Record<string, string>>('/api/difficulty-colors', { retry: false })

// A function rather than a computed because this grid renders many items at
// once, each with its own difficulty. Re-validated with isValidHexColor for
// the same reason as app/pages/browse/[slug].vue: the API returns whatever
// is in the database verbatim, and the object :style form below is only safe
// from CSS injection because it goes through the CSSOM setter. Validating
// here makes that protection structural rather than incidental -- do NOT
// remove this as "redundant" with the write-time check in
// server/api/difficulty-colors/[level].put.ts.
function filledDotColor(difficulty: string): string | null {
  const color = difficultyColors.value?.[difficulty]
  return color && isValidHexColor(color) ? color : null
}

// The global middleware (app/middleware/auth.global.ts) only populates
// useAuthUser() for /app/* routes -- this is a public page, so a logged-in
// visitor's session must be fetched here too, or LikeButton below would
// never know they're logged in and would send them to log in even though
// they already are. Same pattern as app/pages/browse/[slug].vue.
const user = useAuthUser()
if (!user.value) {
  const { data: me } = await useFetch<{ userId: number, role: 'admin' | 'user' } | null>('/api/auth/me', { retry: false })
  user.value = me.value ?? null
}

// The term lists come from /api/taxonomies, which returns them in the order
// the owner arranged in the admin. Previously they were derived from the
// products with [...new Set(...)], which produced whatever order the rows
// happened to arrive in -- so the filter order was effectively arbitrary and
// could change as products were added.
const { data: taxonomies } = await useFetch<{
  build_types: string[]
  themes: string[]
  categories: string[]
}>('/api/taxonomies', { retry: false })

// EVERY configured term is shown, in the configured order, whether or not a
// build currently uses it -- the sidebar presents the shop's structure, not
// just whatever happens to be in stock today. A term with nothing behind it
// simply returns no results when clicked.
function orderedTerms(configured: string[] | undefined, used: Set<string>): string[] {
  const inOrder = configured ?? []
  // Anything a build uses but the list does not know about still has to be
  // filterable -- otherwise those builds become unreachable from the
  // sidebar. They go last, since they have no configured position.
  const known = new Set(inOrder.map(n => n.toLowerCase()))
  const extras = [...used].filter(name => name && !known.has(name.toLowerCase())).sort()
  return [...inOrder, ...extras]
}

const buildTypes = computed(() =>
  orderedTerms(taxonomies.value?.build_types, new Set(products.value.map(p => p.build_type)))
)
const themes = computed(() =>
  orderedTerms(taxonomies.value?.themes, new Set(products.value.map(p => p.theme)))
)
const categories = computed(() =>
  orderedTerms(taxonomies.value?.categories, new Set(products.value.map(p => p.category)))
)

const activeBuildTypes = ref<string[]>([]);
const activeThemes = ref<string[]>([]);
const activeCategories = ref<string[]>([]);

function toggleFilter(list: string[], value: string) {
  const index = list.indexOf(value);
  if (index === -1) {
    list.push(value);
  } else {
    list.splice(index, 1);
  }
}

const filteredProducts = computed(() =>
  products.value.filter(
    (p) =>
      (activeBuildTypes.value.length === 0 || activeBuildTypes.value.includes(p.build_type)) &&
      (activeThemes.value.length === 0 || activeThemes.value.includes(p.theme)) &&
      (activeCategories.value.length === 0 || activeCategories.value.includes(p.category))
  )
);

const pageSize = 6;
const currentPage = ref(1);

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredProducts.value.length / pageSize))
);

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredProducts.value.slice(start, start + pageSize);
});

watch([activeBuildTypes, activeThemes, activeCategories], () => {
  currentPage.value = 1;
}, { deep: true });
</script>
