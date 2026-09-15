<template>
  <section class="bg-background py-14 md:py-20 px-4">
    <div class="max-w-6xl mx-auto flex flex-col items-center">
      <h2 class="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-center gold-glow">
        Premium Projects
      </h2>
      <p class="text-text/70 text-center max-w-xl mt-3 mb-10">
        My most detailed and ambitious builds, crafted for competitions, collaborations and large-scale visions.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
        <button
          v-for="project in projects"
          :key="project.title"
          class="group relative text-left rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="openProject = project"
        >
          <img
            :src="project.image"
            :alt="project.title"
            class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-3">
            <h3 class="text-white font-bold uppercase text-sm tracking-wide">{{ project.title }}</h3>
            <span class="text-secondary text-xs font-semibold inline-flex items-center gap-1">
              View Project <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </span>
          </div>
        </button>
      </div>

      <NuxtLink
        to="/portfolio"
        class="inline-flex items-center gap-2 mt-10 text-base font-bold uppercase bg-transparent border-2 border-primary text-primary rounded-xl px-6 py-3 hover:bg-primary hover:text-black transition-all duration-300"
      >
        View Full Portfolio
        <UIcon name="i-lucide-arrow-right" class="text-lg" />
      </NuxtLink>
    </div>

    <!-- Project detail popup -->
    <div
      v-if="openProject"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click.self="openProject = null"
    >
      <div class="bg-background-secondary border-2 border-primary rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in">
        <img :src="openProject.image" :alt="openProject.title" class="w-full max-h-[50vh] object-cover" />
        <div class="p-6">
          <h3 class="text-secondary font-extrabold text-2xl uppercase mb-2">{{ openProject.title }}</h3>
          <p class="text-text leading-relaxed whitespace-pre-line">{{ openProject.description }}</p>
        </div>
        <button
          class="absolute top-4 right-6 text-white text-3xl font-extrabold bg-black/40 hover:bg-black/70 rounded-full px-3 py-0 transition"
          @click="openProject = null"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const projects = [
  {
    image: "/portfolio/47.webp",
    title: "Freaky Nikki: Obsession Movie",
    description:
      "This project represents an extraordinary leap forward in Minecraft block manipulation, pushing the game's boundaries toward hyper-realistic portraiture. The artwork is a faithful and detailed three-dimensional reproduction of the famous and unsettling character \"Freaky Nikki\" (played by Ali Larter) from the thriller movie Obsessed.\n\nThe core of the build lies in the incredible execution of facial expressions. Through a meticulous study of chiaroscuro and skin tone shading, the piece perfectly captures the piercing gaze and the distorted, enigmatic smile of the character, a key element of her psychological profile in the film. The background, featuring warm tones and soft vertical lines, recreates the original cinematic atmosphere, emphasizing the complex texturing of the dark hair and the folds of the white dress. A flawless blend of advanced pixel art and digital sculpture.",
  },
  {
    image: "/portfolio/45.webp",
    title: "Guardian of the Grove",
    description:
      "A serene nature spirit kneeling among wildflowers, butterflies and playful squirrels. Every detail, from the flowing hair to the floating petals, was built to capture a soft, dreamlike atmosphere.",
  },
  {
    image: "/portfolio/46.webp",
    title: "The Ancient Artisan",
    description:
      "A radiant elder god crafting a glowing chalice beneath a halo of light. This build combines detailed character sculpting with dramatic lighting to create an almost divine presence.",
  },
  {
    image: "/portfolio/48.webp",
    title: "A Memorial To Technoblade",
    description:
      "This organic Minecraft sculpture is a solemn memorial dedicated to Technoblade (Alex), one of the most beloved and influential legends in the history of the community, who passed away in 2022.\n\nThe build immortalizes the Pig King in a proud, timeless stance, kneeling upon a rocky outcrop that overlooks a freezing arctic landscape—a clear nod to his iconic lore and history. He wears his classic royal attire: the gem-encrusted golden crown upon his head and his signature red gown with golden trim. With one hand, he rests upon his legendary sword, intricately detailed with golden guards and a blade pulsing with blue energy. His glowing white eyes convey the fierce determination and strength he was known for. This monumental tribute stands to remind us all that his impact on the game and our lives will live on forever.\n\nTechnoblade never dies.",
  },
];

const openProject = ref<typeof projects[number] | null>(null);
</script>

<style>
.gold-glow {
  background: linear-gradient(90deg, #fff6d6, #f4d03f, #d4af37, #f4d03f, #fff6d6);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 20px rgba(244, 208, 63, 0.55), 0 0 40px rgba(212, 175, 55, 0.35);
  animation: gold-shine 4s linear infinite;
}
@keyframes gold-shine {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.25s ease-out;
}
</style>
