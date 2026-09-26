<template>
  <div class="relative max-w-6xl mx-auto mt-20">
    <h2 class="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-white text-center mb-8">
      Frequently Asked Questions
    </h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="(faq, index) in faqs"
        :key="faq.question"
        class="bg-background-secondary border border-white/10 rounded-2xl overflow-hidden"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between gap-4 px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
          :aria-expanded="openIndex === index"
          :aria-controls="`faq-answer-${index}`"
          @click="openIndex = openIndex === index ? null : index"
        >
          <span class="font-bold text-text text-sm md:text-base">{{ faq.question }}</span>
          <UIcon
            name="i-lucide-chevron-down"
            class="text-text/50 text-lg shrink-0 transition-transform duration-300"
            :class="openIndex === index ? 'rotate-180' : ''"
          />
        </button>
        <div :id="`faq-answer-${index}`" v-show="openIndex === index" class="px-5 pb-4 text-text/70 text-sm leading-relaxed">
          {{ faq.answer }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

// Shared by app/pages/contact.vue and app/pages/services.vue -- markup,
// open/close behaviour and the four questions all live here so both pages
// stay in sync by construction rather than by copy-paste discipline.
const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept PayPal and all major credit cards including Visa, Mastercard, and American Express.',
  },
  {
    question: 'Can I request a custom build?',
    answer: 'Yes. You can request a custom project from the contact page or by emailing leledanbusiness@gmail.com.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'No, we do not offer refunds in most cases as the builds are provided upon each billing cycle.',
  },
  {
    question: "Can I resell the product I buy from the store?",
    answer: "No, you can't. Reselling, redistributing, or copying these digital files is strictly prohibited.",
  },
]

const openIndex = ref<number | null>(null)
</script>
