<template>
  <section class="relative py-20 px-4 overflow-hidden">
    <img
      src="/images/cta-bg.webp"
      alt="Floating island Minecraft build"
      class="absolute inset-0 w-full h-full object-cover"
      draggable="false"
    />
    <div class="absolute inset-0 bg-black/70"></div>

    <div class="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center gap-5">
      <h2 class="text-2xl md:text-4xl font-extrabold uppercase tracking-wide text-text drop-shadow-lg">
        Ready to shape a new world?
      </h2>
      <p class="text-primary text-lg md:text-xl font-semibold drop-shadow">
        Join a Creative Community that shares a passion!
      </p>
      <a
        href="https://discord.gg/u9FyUqa6uz"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 text-lg font-black uppercase bg-primary text-black rounded-xl px-8 py-4 shadow-lg shadow-primary/20 hover:bg-secondary transform hover:scale-105 transition-all duration-300"
      >
        <UIcon name="i-simple-icons-discord" class="text-xl" />
        <span>Join the Discord</span>
      </a>
    </div>
  </section>
</template>
