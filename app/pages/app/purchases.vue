<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-primary">My Purchases</h1>
      <p v-if="!loadError" class="text-text/50 text-sm mt-1">{{ orders.length }} purchased</p>
    </div>

    <p v-if="loadError" class="text-red-400 text-sm mb-4">{{ loadError }}</p>
    <p v-if="downloadError" class="text-red-400 text-sm mb-4">{{ downloadError }}</p>

    <div v-if="orders.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="order in orders"
        :key="order.id"
        class="bg-background-secondary border border-white/10 rounded-2xl overflow-hidden flex flex-col"
      >
        <img :src="order.image_url" :alt="order.title" class="w-full aspect-video object-cover" />
        <div class="p-4 flex flex-col flex-1">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h2 class="font-bold text-text">{{ order.title }}</h2>
            <span class="text-primary font-black text-sm shrink-0 pt-0.5">{{ formatPrice(order) }}</span>
          </div>
          <p class="text-text/40 text-xs mb-4">
            Purchased {{ new Date(order.created_at).toLocaleDateString() }} via {{ order.provider === 'stripe' ? 'card' : 'PayPal' }}
          </p>
          <UButton class="mt-auto" block :loading="downloadingId === order.id" @click="download(order)">
            <UIcon name="i-lucide-download" class="text-sm" />
            Download
          </UButton>
        </div>
      </div>
    </div>

    <div v-else-if="!loadError" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <UIcon name="i-lucide-package-open" class="text-4xl text-text/30" />
      <p class="text-text/60">You haven't bought anything yet.</p>
      <NuxtLink to="/browse" class="inline-flex items-center gap-1.5 text-sm font-bold uppercase text-primary hover:text-secondary transition-colors">
        Browse builds
        <UIcon name="i-lucide-arrow-right" class="text-xs" />
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' })

interface Order {
  id: number
  browse_item_id: number
  title: string
  image_url: string
  amount: number
  currency: string
  provider: string
  created_at: string
}

const { data, error } = await useFetch<Order[]>('/api/my-orders')
const orders = computed(() => data.value ?? [])
const loadError = computed(() => error.value ? 'Could not load your purchases. Please refresh the page.' : '')

const downloadingId = ref<number | null>(null)
const downloadError = ref('')

// orders.amount is whole euros (not cents) and is not guaranteed to be an
// integer (an admin can enter a price like 39.95), so this prints whatever
// the API returned rather than assuming/forcing two decimal places -- same
// plain "€<price>" convention the public /browse pages already use.
function formatPrice(order: Order): string {
  return order.currency === 'EUR' ? `€${order.amount}` : `${order.amount} ${order.currency}`
}

// The download endpoint's Content-Disposition (server/utils/downloadFilename.ts)
// always carries an ASCII-safe filename="..." parameter, and additionally
// carries an RFC 5987 filename*=UTF-8''... parameter whenever the title has
// accented/non-ASCII characters. Prefer the extended one (percent-decoded)
// since it preserves the real title; fall back to the plain one, and finally
// to the order's own title if the header is missing entirely (shouldn't
// happen given the API contract, but avoids an extension-less surprise).
function parseFilename(disposition: string, fallback: string): string {
  const extended = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
  if (extended?.[1]) {
    try {
      return decodeURIComponent(extended[1])
    } catch {
      // Malformed percent-encoding -- fall through to filename= / fallback.
    }
  }
  const basic = /filename="([^"]+)"/.exec(disposition)
  return basic?.[1] ?? fallback
}

// Turns a failed download response into a readable sentence instead of a
// raw error dump. The endpoint's errors are H3 createError() payloads (JSON
// with a statusMessage), so this reads that when present and otherwise
// falls back to a message keyed off the HTTP status.
async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = await res.json() as { statusMessage?: string, message?: string }
    if (body.statusMessage) return body.statusMessage
    if (body.message) return body.message
  } catch {
    // Not a JSON error body -- fall through to a status-based message.
  }
  if (res.status === 403) return 'You have not purchased this item.'
  if (res.status === 404) return 'No file is attached to this item.'
  return 'Download failed. Please try again.'
}

async function download(order: Order) {
  downloadingId.value = order.id
  downloadError.value = ''
  try {
    const res = await fetch(`/api/downloads/${order.browse_item_id}`)
    if (!res.ok) {
      downloadError.value = await readErrorMessage(res)
      return
    }
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const filename = parseFilename(disposition, order.title)

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch {
    downloadError.value = 'Download failed. Please try again.'
  } finally {
    downloadingId.value = null
  }
}
</script>
