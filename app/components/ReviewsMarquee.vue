<template>
  <section id="reviews" class="relative bg-background py-10 md:py-14 overflow-hidden">

    <div class="relative max-w-3xl mx-auto flex flex-col items-center text-center px-4 mb-8">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-text">
        What Creators <span class="text-secondary">Say</span>
      </h2>
      <p class="text-text/60 mt-3">Trusted by Minecraft content creators worldwide</p>
    </div>

    <UMarquee :overlay="false" :pauseOnHover="true" class="relative w-full py-2 [--gap:0.75rem]" :ui="{ content: 'justify-start w-max' }">
      <a
        v-for="review in reviews"
        :key="review.name"
        :href="review.link"
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col gap-4 p-5 w-72 h-56 shrink-0 rounded-2xl bg-background-secondary/70 backdrop-blur-sm hover:bg-background-secondary/90 transition-all duration-300 hover:-translate-y-0.5"
      >
        <div class="flex items-center gap-3">
          <img :src="review.image" :alt="review.name" class="w-11 h-11 rounded-full object-cover border-2 border-secondary shrink-0" />
          <div class="flex flex-col leading-tight">
            <span class="text-text font-bold text-sm">{{ review.name }}</span>
            <span class="text-text/50 text-xs">{{ review.detail }}<template v-if="review.counter"> &middot; {{ review.counter }}</template></span>
          </div>
        </div>
        <p class="text-text/80 text-sm leading-relaxed line-clamp-4">{{ review.review }}</p>
        <div class="flex gap-1 mt-auto">
          <UIcon name="i-heroicons-star-solid" class="w-4 h-4 text-secondary" v-for="n in 5" :key="n" />
        </div>
      </a>
    </UMarquee>
  </section>
</template>

<script lang="ts" setup>
const reviews = [
  {
    image: "/customers/sharkliz.webp",
    name: "Sharkliz",
    detail: "YouTuber",
    counter: "399k+ Subscribers",
    link: "https://www.youtube.com/@Sharkilz",
    review:
      "Super efficient, great communication, and excellent final product. Met a very demanding deadline with ease. Looking forward to working with in the future!",
  },
  {
    image: "/customers/yeslucid.webp",
    name: "yeslucid",
    detail: "YouTuber",
    counter: "168k+ Subscribers",
    link: "https://www.youtube.com/@yeslucid",
    review:
      "Great building skills! needed lots of builds done for a video and he delivered them all in a very timely fashion",
  },
  {
    image: "/customers/zenith.webp",
    name: "Zenith",
    detail: "YouTuber",
    counter: "334k+ Subscribers",
    link: "https://www.youtube.com/@zenithminecraft",
    review:
      "This Minecraft build is a stunning example of creativity and craftsmanship, showcasing remarkable attention to detail and design. The seamless integration of structure and environment creates an immersive experience and highlighting the builder's skill.",
  },
  {
    image: "/customers/cypro.webp",
    name: "Cypro",
    detail: "YouTuber",
    counter: "96.7k+ Subscribers",
    link: "https://www.youtube.com/@cyproh",
    review:
      "Made a small dungeon for me, and completely revamped an old structure of mine. Very quick and with updates, was everything that I asked for!",
  },
  {
    image: "/customers/divvy.webp",
    name: "Divvy",
    detail: "YouTuber",
    counter: "276k+ Subscribers",
    link: "https://www.youtube.com/@divvyminecraft",
    review:
      "Good builder and made what i wanted in a timely manner.",
  },
  {
    image: "/customers/gabby16bit.webp",
    name: "Gabby16Bit",
    detail: "YouTuber",
    counter: "3.52M+ Subscribers",
    link: "https://www.youtube.com/gabby16bit",
    review:
      "Very Good builder, he made me some build for my Youtube Channel. Professional, Fast and Talented.",
  },
  {
    image: "/customers/wanmine.jpg",
    name: "WanMine",
    detail: "Server",
    counter: "",
    link: "#",
    review:
      "Excellent editor! He adapted quickly to a new environment (Bedrock Edition) and was always reliable with deliveries, deadlines, and overall consistency. Great work!",
  },
  {
    image: "/customers/coralmc.webp",
    name: "CoralMC",
    detail: "Server",
    counter: "",
    link: "https://coralmc.it/it",
    review:
      "This guy fully complied with our requirements, was helpful, professional, and punctual. He is also really good at building. I recommend him to everyone.",
  },
  {
    image: "/customers/pokehub.webp",
    name: "PokeHub",
    detail: "Server",
    counter: "",
    link: "https://store.pokehub.org/",
    review:
      "lele was an amazing builder gave us exaclty what we needed, the maps were well thought out of and arranged, choice of blocks were excellent and we will 100% work with them again!",
  },
];
</script>
