<template>
  <div>
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'leledan06 | Minecraft Builder Portfolio',
  description: 'leledan06\'s professional portfolio, a Minecraft builder specialized in organic sculptures, terraforming and epic structures. Explore services, reviews, a gallery of past work and how to commission a project.',
  ogTitle: 'leledan06 | Minecraft Builder Portfolio',
  ogDescription: 'Discover leledan06\'s talent: a portfolio of Minecraft projects, custom services, image gallery, transparent pricing and client testimonials.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'leledan06 | Minecraft Builder',
  twitterDescription: 'Professional Minecraft builder, expert in organic builds, terraforming and architecture. Browse the portfolio and discover the services offered.',
})

useHead({
  htmlAttrs: {
    lang: 'en'
  },
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'alternate icon', type: 'image/png', href: '/favicon.png' }
  ],
  meta: [
    { name: 'author', content: 'Alessandro Maria Calista' },
    { name: 'robots', content: 'index, follow' },
    { name: 'keywords', content: 'Minecraft, builder, portfolio, services, terraforming, architecture, sculptures, skins, Minecraft projects' },
    { property: 'og:url', content: 'https://leledan06.it' }
  ],
  title: 'leledan06 | Minecraft Builder Portfolio'
})
</script>
