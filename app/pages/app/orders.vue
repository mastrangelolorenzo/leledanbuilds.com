<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl md:text-3xl font-bold text-primary">Orders</h1>
      <p v-if="!loadError" class="text-text/50 text-sm mt-1">
        {{ summary?.total ?? 0 }} orders · €{{ summary?.revenue_completed ?? 0 }} collected
      </p>
    </div>

    <p v-if="loadError" class="text-red-400 text-sm mb-4">{{ loadError }}</p>
    <p v-if="actionError" class="text-red-400 text-sm mb-4">{{ actionError }}</p>
    <p v-if="actionMessage" class="text-primary text-sm mb-4">{{ actionMessage }}</p>

    <!-- Things that need a human. Shown first and only when non-zero, so an
         all-clear dashboard stays quiet rather than displaying four zeroes. -->
    <div v-if="hasAttention" class="flex flex-wrap gap-3 mb-6">
      <div
        v-if="summary && summary.stuck_pending > 0"
        class="bg-amber-500/10 border border-amber-500/40 rounded-xl px-4 py-3"
      >
        <p class="text-amber-400 font-bold text-sm">{{ summary.stuck_pending }} stuck pending</p>
        <p class="text-text/50 text-xs">No webhook arrived after {{ data?.stuck_pending_minutes }} min</p>
      </div>
      <div
        v-if="summary && summary.needs_refund > 0"
        class="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3"
      >
        <p class="text-red-400 font-bold text-sm">{{ summary.needs_refund }} need a refund</p>
        <p class="text-text/50 text-xs">Duplicate purchase — buyer paid twice</p>
      </div>
      <div
        v-if="summary && summary.disputed > 0"
        class="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-3"
      >
        <p class="text-red-400 font-bold text-sm">{{ summary.disputed }} open dispute(s)</p>
        <p class="text-text/50 text-xs">Chargeback filed with the card issuer</p>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-5">
      <button
        v-for="f in filters"
        :key="f.key"
        type="button"
        class="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border transition-colors"
        :class="activeFilter === f.key
          ? 'bg-primary/15 text-primary border-primary/40'
          : 'bg-black/20 text-text/60 border-white/10 hover:text-text'"
        @click="activeFilter = f.key"
      >
        {{ f.label }} ({{ countFor(f.key) }})
      </button>
    </div>

    <div v-if="visibleOrders.length" class="flex flex-col gap-3">
      <div
        v-for="order in visibleOrders"
        :key="order.id"
        class="bg-background-secondary border rounded-2xl p-4"
        :class="rowBorderClass(order)"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-text/40 text-xs font-mono">#{{ order.id }}</span>
              <span
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                :class="statusClass(order)"
              >{{ order.status }}</span>
              <span
                v-if="order.needs_refund && !order.refunded_at"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400"
              >refund owed</span>
              <span
                v-if="order.refunded_at"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-white/10 text-text/60"
              >refunded</span>
              <span
                v-if="order.dispute_status"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/15 text-red-400"
              >dispute: {{ order.dispute_status }}</span>
              <span
                v-if="order.is_stuck_pending"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400"
              >stuck</span>
            </div>
            <p class="font-semibold text-text text-sm truncate">
              {{ order.item_title ?? `(deleted item #${order.browse_item_id})` }}
            </p>
            <p class="text-text/50 text-xs truncate">
              {{ order.user_email ?? `(deleted user #${order.user_id})` }}
              · {{ order.provider }}
              · {{ formatDate(order.created_at) }}
            </p>
            <p v-if="order.provider_reference" class="text-text/30 text-[11px] font-mono truncate mt-0.5">
              {{ order.provider_reference }}
            </p>
            <p v-if="order.admin_note" class="text-text/60 text-xs mt-2 italic">“{{ order.admin_note }}”</p>
          </div>

          <div class="flex flex-col items-end gap-2 shrink-0">
            <span class="text-primary font-black">€{{ order.amount }}</span>
            <div class="flex items-center gap-2">
              <button
                v-if="order.status === 'pending' && order.provider === 'stripe'"
                type="button"
                class="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition-colors disabled:opacity-50"
                :disabled="busyId === order.id"
                @click="reconcile(order)"
              >
                Check with Stripe
              </button>
              <button
                v-if="order.needs_refund && !order.refunded_at"
                type="button"
                class="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-white/10 text-text/70 border border-white/15 hover:text-text transition-colors disabled:opacity-50"
                :disabled="busyId === order.id"
                @click="markRefunded(order)"
              >
                Mark refunded
              </button>
              <button
                type="button"
                class="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-white/10 text-text/70 border border-white/15 hover:text-text transition-colors disabled:opacity-50"
                :disabled="busyId === order.id"
                @click="editNote(order)"
              >
                Note
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!loadError" class="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <UIcon name="i-lucide-receipt-euro" class="text-4xl text-text/30" />
      <p class="text-text/60">No orders in this view.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'dashboard' })

interface AdminOrder {
  id: number
  status: string
  provider: string
  provider_reference: string | null
  provider_session_id: string
  amount: number
  currency: string
  needs_refund: boolean
  refunded_at: string | null
  dispute_status: string | null
  admin_note: string | null
  created_at: string
  updated_at: string
  user_id: number
  user_email: string | null
  browse_item_id: number
  item_title: string | null
  item_slug: string | null
  is_stuck_pending: boolean
}

interface Summary {
  total: number
  completed: number
  pending: number
  failed: number
  stuck_pending: number
  needs_refund: number
  disputed: number
  revenue_completed: number
}

type FilterKey = 'attention' | 'all' | 'completed' | 'pending' | 'failed'

const { data, error, refresh } = await useFetch<{
  orders: AdminOrder[]
  summary: Summary
  stuck_pending_minutes: number
}>('/api/admin/orders')

const orders = computed(() => data.value?.orders ?? [])
const summary = computed(() => data.value?.summary)
const loadError = computed(() => error.value ? 'Could not load orders. Please refresh the page.' : '')

const hasAttention = computed(() => {
  const s = summary.value
  return Boolean(s && (s.stuck_pending > 0 || s.needs_refund > 0 || s.disputed > 0))
})

// "Needs attention" is the default view: the reason this page exists is to
// surface the orders that are wrong, so landing on the full list would bury
// them. Falls back to everything when nothing is wrong.
//
// Set once from the initial load, NOT in a watcher: a watcher on
// hasAttention would re-run after every refresh() and yank the operator back
// to this tab while they were deliberately looking at another one.
const activeFilter = ref<FilterKey>(hasAttention.value ? 'attention' : 'all')

const filters: { key: FilterKey, label: string }[] = [
  { key: 'attention', label: 'Needs attention' },
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
]

function needsAttention(o: AdminOrder): boolean {
  return o.is_stuck_pending
    || (o.needs_refund && !o.refunded_at)
    || Boolean(o.dispute_status && !['won', 'warning_closed'].includes(o.dispute_status))
}

function matches(o: AdminOrder, f: FilterKey): boolean {
  if (f === 'all') return true
  if (f === 'attention') return needsAttention(o)
  return o.status === f
}

function countFor(f: FilterKey): number {
  return orders.value.filter(o => matches(o, f)).length
}

const visibleOrders = computed(() => orders.value.filter(o => matches(o, activeFilter.value)))

function statusClass(o: AdminOrder): string {
  if (o.status === 'completed') return 'bg-green-500/15 text-green-400'
  if (o.status === 'failed') return 'bg-white/10 text-text/50'
  return 'bg-amber-500/15 text-amber-400'
}

function rowBorderClass(o: AdminOrder): string {
  return needsAttention(o) ? 'border-red-500/30' : 'border-white/10'
}

function formatDate(iso: string): string {
  const ms = Date.parse(iso)
  // Show the raw value rather than "Invalid Date" if it will not parse --
  // an operator can still act on a timestamp they can read.
  return Number.isFinite(ms) ? new Date(ms).toLocaleString() : iso
}

const busyId = ref<number | null>(null)
const actionError = ref('')
const actionMessage = ref('')

function errorMessageFrom(e: unknown): string {
  return (e as { data?: { statusMessage?: string } }).data?.statusMessage
    ?? (e as { statusMessage?: string }).statusMessage
    ?? 'Something went wrong. Please try again.'
}

async function reconcile(order: AdminOrder) {
  busyId.value = order.id
  actionError.value = ''
  actionMessage.value = ''
  try {
    const res = await $fetch<{ changed: boolean, reason: string }>(
      `/api/admin/orders/${order.id}/reconcile`,
      { method: 'POST' }
    )
    actionMessage.value = `Order #${order.id}: ${res.reason}`
    if (res.changed) await refresh()
  } catch (e) {
    actionError.value = `Order #${order.id}: ${errorMessageFrom(e)}`
  } finally {
    busyId.value = null
  }
}

async function markRefunded(order: AdminOrder) {
  if (!confirm(`Record that order #${order.id} (€${order.amount}) has been refunded in Stripe?\n\nThis only updates this dashboard — issue the actual refund in Stripe first.`)) {
    return
  }
  busyId.value = order.id
  actionError.value = ''
  actionMessage.value = ''
  try {
    await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { refunded: true } })
    actionMessage.value = `Order #${order.id} marked as refunded.`
    await refresh()
  } catch (e) {
    actionError.value = `Order #${order.id}: ${errorMessageFrom(e)}`
  } finally {
    busyId.value = null
  }
}

async function editNote(order: AdminOrder) {
  const next = prompt(`Note for order #${order.id}:`, order.admin_note ?? '')
  // null means the operator cancelled -- distinct from '' which clears it.
  if (next === null) return
  busyId.value = order.id
  actionError.value = ''
  actionMessage.value = ''
  try {
    await $fetch(`/api/admin/orders/${order.id}`, { method: 'PATCH', body: { admin_note: next } })
    await refresh()
  } catch (e) {
    actionError.value = `Order #${order.id}: ${errorMessageFrom(e)}`
  } finally {
    busyId.value = null
  }
}
</script>
