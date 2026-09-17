<template>
  <div class="bg-background">
    <NavBar class="sticky top-0 z-10 bg-background"/>

    <h1 class="text-3xl md:text-5xl font-bold text-primary tracking-wide mb-3 text-center uppercase my-10">Portfolio</h1>

    <!-- Signature Builds -->
    <section class="max-w-6xl mx-auto px-4 pb-16">
      <h2 class="text-2xl md:text-3xl font-extrabold uppercase tracking-wide text-center mb-2 gold-glow">Signature Builds</h2>
      <p class="text-text/70 text-center max-w-2xl mx-auto mb-10">
        Detailed, competition-grade projects with a story behind every block.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <button
          v-for="build in signatureBuilds"
          :key="build.title"
          class="group relative text-left rounded-2xl overflow-hidden border-2 border-primary/40 hover:border-primary transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          @click="openBuild = build"
        >
          <img
            :src="build.image"
            :alt="build.title"
            class="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
            draggable="false"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <h3 class="text-white font-extrabold uppercase text-lg tracking-wide">{{ build.title }}</h3>
            <p class="text-white/70 text-sm mt-1 line-clamp-2">{{ build.teaser }}</p>
            <span class="text-secondary text-xs font-semibold uppercase inline-flex items-center gap-1 mt-2">
              View Project <UIcon name="i-lucide-arrow-right" class="text-xs" />
            </span>
          </div>
        </button>
      </div>
    </section>

    <!-- Signature build detail modal -->
    <div
      v-if="openBuild"
      class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      @click.self="openBuild = null"
    >
      <div class="relative bg-background-secondary border-2 border-primary rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <img :src="openBuild.image" :alt="openBuild.title" class="w-full max-h-[45vh] object-cover" />
        <div class="p-6">
          <h3 class="text-secondary font-extrabold text-2xl uppercase mb-3">{{ openBuild.title }}</h3>
          <p class="text-text leading-relaxed whitespace-pre-line">{{ openBuild.description }}</p>
        </div>
        <button
          class="absolute top-4 right-6 text-white text-3xl font-extrabold bg-black/40 hover:bg-black/70 rounded-full px-3 py-0 transition"
          @click="openBuild = null"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue'

  const signatureBuilds = [
    {
      image: "/portfolio/45.webp",
      title: "Queen Of Nature",
      teaser: "A profound celebration of the connection between humanity and the Earth, custom-built for the Kibo Organics Contest 2024.",
      description:
        "This organic Minecraft sculpture is a profound celebration of the connection between humanity and the Earth, custom-built for the prestigious Kibo Organics Contest 2024.\n\nAt the center of the composition stands a monumental female figure, captured in a moment of pure, absolute serenity. The girl sits deeply immersed in the heart of untouched nature, lifted toward the sky on a floating island rich with lush vegetation. With her eyes closed and an expression of utter peace, she surrenders herself to a deep sensory experience: she listens to the gentle sounds of the wind, senses the vivid environment around her, and breathes in the sweet scent of the pink petals drifting delicately through the air, as if merging her own body with the ecosystem.\n\nThe entire build is alive with woodland creatures, including curious squirrels and colorful butterflies rendered in meticulous detail, harmoniously interacting with her. Every single block has been placed to enhance the fluidity of her white dress, the soft flow of her brown hair, and the vibrant colors of the surrounding wildlife. This masterpiece transforms gaming voxels into visual poetry about inner peace and respect for the natural world.",
    },
    {
      image: "/portfolio/46.webp",
      title: "The Divine Taste Of God",
      teaser: "A majestic sculpture carrying a universal message of hope, custom-built for the Kibo Contest 2025.",
      description:
        "This majestic organic Minecraft sculpture carries a universal message of hope, custom-built for the Kibo Contest 2025.\n\nAt the center of the composition sits the Almighty, depicted as an imposing and wise deity surrounded by a sacred halo of light. The artwork revolves around a powerful visual metaphor: God is captured in the seemingly simple act of eating ice cream with a spoon. Looking closely, the cup and spoon hold the continents and oceans of Earth. The profound allegorical message is this: God is consuming and taking away all the war, hatred, and cruelty present in the world, replacing them with the sweetness of peace.\n\nFraming this solemn moment is a spectacular and balanced composition: the deity emerges from fluffy clouds, surrounded by heavenly creatures, while a female angel with auburn hair and wide-spread wings watches over from behind. Every single block enhances the detailed facial expressions, the folds of the red robes, and the complex harmony of colors, transforming a gaming build into an authentic piece of conceptual art.",
    },
    {
      image: "/portfolio/47.webp",
      title: "Freaky Nikki: Obsession Movie",
      teaser: "A hyper-realistic 3D portrait of the unsettling character from the thriller movie Obsession.",
      description:
        "This project represents an extraordinary leap forward in Minecraft block manipulation, pushing the game's boundaries toward hyper-realistic portraiture. The artwork is a faithful and detailed three-dimensional reproduction of the famous and unsettling character \"Freaky Nikki\" (played by Ali Larter) from the thriller movie Obsession.\n\nThe core of the build lies in the incredible execution of facial expressions. Through a meticulous study of chiaroscuro and skin tone shading, the piece perfectly captures the piercing gaze and the distorted, enigmatic smile of the character, a key element of her psychological profile in the film. The background, featuring warm tones and soft vertical lines, recreates the original cinematic atmosphere, emphasizing the complex texturing of the dark hair and the folds of the white dress. A flawless blend of advanced pixel art and digital sculpture.",
    },
    {
      image: "/portfolio/48.webp",
      title: "A Memorial To Technoblade",
      teaser: "A solemn memorial dedicated to Technoblade, one of the most beloved legends in the community's history.",
      description:
        "This organic Minecraft sculpture is a solemn memorial dedicated to Technoblade (Alex), one of the most beloved and influential legends in the history of the community, who passed away in 2022.\n\nThe build immortalizes the Pig King in a proud, timeless stance, kneeling upon a rocky outcrop that overlooks a freezing arctic landscape—a clear nod to his iconic lore and history. He wears his classic royal attire: the gem-encrusted golden crown upon his head and his signature red gown with golden trim. With one hand, he rests upon his legendary sword, intricately detailed with golden guards and a blade pulsing with blue energy. His glowing white eyes convey the fierce determination and strength he was known for. This monumental tribute stands to remind us all that his impact on the game and our lives will live on forever.\n\nTechnoblade never dies.",
    },
  ]

  const openBuild = ref<typeof signatureBuilds[number] | null>(null)
</script>
