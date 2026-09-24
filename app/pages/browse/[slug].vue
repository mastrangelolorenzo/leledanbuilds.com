<template>
  <div class="bg-background min-h-screen">
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

    <div v-if="build" class="relative overflow-hidden py-14 md:py-20 px-6 md:px-10 lg:px-16">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none"></div>

      <div class="relative max-w-6xl mx-auto">
        <NuxtLink to="/browse" class="inline-flex items-center gap-2 text-text/60 hover:text-primary transition-colors text-sm font-semibold mb-8">
          <UIcon name="i-lucide-arrow-left" />
          Back to Browse
        </NuxtLink>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <img
            :src="build.image_url"
            :alt="build.title"
            class="w-full aspect-square object-cover rounded-2xl border border-white/10"
            draggable="false"
          />

          <div class="flex flex-col">
            <h1 class="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-4">
              {{ build.title }}
            </h1>

            <div class="flex flex-wrap items-center gap-2 mb-5">
              <span class="px-3 py-1 rounded-full border border-primary/40 text-primary text-xs font-semibold uppercase tracking-wide">{{ build.build_type }}</span>
              <span class="px-3 py-1 rounded-full border border-white/20 text-text/70 text-xs font-semibold uppercase tracking-wide">{{ build.theme }}</span>
              <span class="px-3 py-1 rounded-full border border-white/20 text-text/70 text-xs font-semibold uppercase tracking-wide">{{ build.category }}</span>
            </div>

            <p class="text-text/80 leading-relaxed mb-6">{{ build.description }}</p>

            <dl class="grid grid-cols-2 gap-4 mb-8 border-t border-white/10 pt-6">
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Difficulty</dt>
                <dd class="flex items-center gap-2">
                  <span class="text-text font-semibold text-sm">{{ build.difficulty }}</span>
                  <span class="flex items-center gap-1">
                    <span
                      v-for="n in 4"
                      :key="n"
                      class="w-2.5 h-2.5 rounded-sm"
                      :class="n <= difficultyLevels[build.difficulty] ? 'bg-primary' : 'bg-white/15'"
                    ></span>
                  </span>
                </dd>
              </div>
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Released</dt>
                <dd class="text-text font-semibold text-sm">
                  {{ new Date(build.released).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }}
                </dd>
              </div>
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Category</dt>
                <dd class="text-text font-semibold text-sm">{{ build.category }}</dd>
              </div>
              <div>
                <dt class="text-text/40 text-xs uppercase tracking-widest font-bold mb-1">Theme</dt>
                <dd class="text-text font-semibold text-sm">{{ build.theme }}</dd>
              </div>
            </dl>

            <div class="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
              <span class="text-primary font-black text-4xl">€{{ build.price }}</span>
              <NuxtLink
                v-if="!user"
                :to="`/app/login?redirect=/browse/${build.slug}`"
                class="inline-flex items-center gap-2 bg-primary text-black font-bold uppercase text-sm rounded-full px-6 py-3 hover:bg-secondary transition-all duration-300"
              >
                Log in to buy
                <UIcon name="i-lucide-arrow-right" class="text-base" />
              </NuxtLink>
              <div v-else-if="owned" class="flex flex-col items-end gap-2">
                <span class="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary font-bold uppercase text-sm rounded-full px-6 py-3">
                  You already own this build
                </span>
                <div class="flex items-center gap-4 text-xs font-bold uppercase tracking-wide">
                  <a
                    :href="`/api/downloads/${build.id}`"
                    class="inline-flex items-center gap-1.5 text-primary hover:text-secondary transition-colors"
                  >
                    <UIcon name="i-lucide-download" class="text-sm" />
                    Download
                  </a>
                  <NuxtLink to="/app/purchases" class="text-text/60 hover:text-primary transition-colors">
                    My Purchases
                  </NuxtLink>
                </div>
              </div>
              <span
                v-else-if="!build.has_download"
                class="inline-flex items-center gap-2 bg-white/10 text-text/50 font-bold uppercase text-sm rounded-full px-6 py-3 cursor-not-allowed"
              >
                Coming soon
              </span>
              <div v-else class="flex flex-col items-end gap-2">
                <div class="flex items-center gap-3">
                  <UButton :loading="checkoutLoading === 'stripe'" :disabled="!!checkoutLoading" @click="startCheckout('stripe')">
                    Buy with card
                  </UButton>
                  <UButton :loading="checkoutLoading === 'paypal'" :disabled="!!checkoutLoading" color="neutral" variant="outline" @click="startCheckout('paypal')">
                    Buy with PayPal
                  </UButton>
                </div>
                <p v-if="checkoutError" class="text-red-400 text-xs">{{ checkoutError }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- You might also like -->
        <div v-if="relatedBuilds.length" class="mt-20">
          <h2 class="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-white mb-8">
            You might also like
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <NuxtLink
              v-for="item in relatedBuilds"
              :key="item.slug"
              :to="`/browse/${item.slug}`"
              class="group relative bg-background-secondary border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-transform duration-300 hover:-translate-y-1"
            >
              <img
                :src="item.image_url"
                :alt="item.title"
                class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                draggable="false"
              />
              <div class="p-4 flex flex-col flex-1">
                <h3 class="text-white font-extrabold uppercase text-sm tracking-wide mb-2">{{ item.title }}</h3>
                <span class="text-primary font-black text-lg mt-auto">€{{ item.price }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-32 gap-4">
      <p class="text-text/60">This build doesn't exist.</p>
      <NuxtLink to="/browse" class="text-primary font-semibold hover:text-secondary transition-colors">Back to Browse</NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { useRoute } from "#app";

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
  has_download: boolean
}

const difficultyLevels: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3, Expert: 4 }

const { data: fetchedProducts } = await useFetch<BrowseItem[]>('/api/browse-items')

// The global middleware (app/middleware/auth.global.ts) only populates
// useAuthUser() for /app/* routes -- this is a public page, so a logged-in
// visitor's session must be fetched here too, or the buy buttons below would
// never know they're logged in.
const user = useAuthUser()
if (!user.value) {
  const { data: me } = await useFetch<{ userId: number, role: 'admin' | 'user' } | null>('/api/auth/me', { retry: false })
  user.value = me.value ?? null
}

// Ownership drives a 4th Buy-row state (already-owned) below. Reuses
// GET /api/my-orders (already scoped to the caller's own completed
// purchases) instead of a new endpoint -- it's fetched only when a user is
// present, and any failure here (network hiccup, etc.) just leaves this
// empty, which degrades to the normal Buy state rather than hiding the
// buttons or blocking the page.
const myOrders = ref<{ browse_item_id: number }[]>([])
if (user.value) {
  const { data: orders } = await useFetch<{ browse_item_id: number }[]>('/api/my-orders', { retry: false })
  myOrders.value = orders.value ?? []
}

const products = computed(() => fetchedProducts.value ?? [])

const route = useRoute();

const build = computed(() =>
  products.value.find((p) => p.slug === route.params.slug)
);

const owned = computed(() =>
  !!build.value && myOrders.value.some((o) => o.browse_item_id === build.value!.id)
);

const relatedBuilds = computed(() => {
  if (!build.value) return [];
  return products.value
    .filter(
      (p) =>
        p.slug !== build.value!.slug &&
        (p.category === build.value!.category ||
          p.theme === build.value!.theme ||
          p.build_type === build.value!.build_type)
    )
    .slice(0, 4);
});

const checkoutLoading = ref<'stripe' | 'paypal' | null>(null)
const checkoutError = ref('')

async function startCheckout(provider: 'stripe' | 'paypal') {
  if (!build.value) return
  // Double-submit protection currently also holds because Nuxt UI's button
  // re-checks `disabled` at click time, but that invariant belongs to this
  // function, not to a third-party component's internals.
  if (checkoutLoading.value) return
  checkoutLoading.value = provider
  checkoutError.value = ''
  try {
    const res = await $fetch<{ url: string }>(`/api/checkout/${provider}`, {
      method: 'POST',
      body: { browse_item_id: build.value.id },
    })
    // A 200 whose body lacks a usable url must not silently coerce to the
    // string "undefined" and navigate there -- require an absolute https
    // URL (both providers always return one), which also means a tampered
    // or malformed response can never hand this a javascript:/data: URL.
    if (typeof res?.url !== 'string' || !res.url.startsWith('https://')) {
      checkoutError.value = 'Checkout failed. Please try again.'
      checkoutLoading.value = null
      return
    }
    window.location.href = res.url
  } catch (e: unknown) {
    checkoutError.value = (e as { data?: { statusMessage?: string } }).data?.statusMessage ?? 'Checkout failed. Please try again.'
    checkoutLoading.value = null
  }
}
</script>
