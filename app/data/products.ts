export interface Product {
  slug: string;
  image: string;
  title: string;
  price: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  buildType: string;
  theme: string;
  category: string;
  released: string;
  description: string;
}

export const difficultyLevels: Record<string, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Expert: 4,
};

export const products: Product[] = [
  {
    slug: "modern-glass-villa",
    image: "/portfolio/10.webp",
    title: "Modern Glass Villa",
    price: 120,
    difficulty: "Medium",
    buildType: "House",
    theme: "Modern",
    category: "Structures",
    released: "2026-01-10",
    description:
      "A sleek two-story villa built with glass walls, dark stone accents and warm interior lighting, surrounded by lush greenery. Comes fully furnished and ready to drop into any modern-themed world.",
  },
  {
    slug: "santas-floating-island",
    image: "/portfolio/43.webp",
    title: "Santa's Floating Island",
    price: 150,
    difficulty: "Expert",
    buildType: "Map",
    theme: "Fantasy",
    category: "Terraforming",
    released: "2025-12-01",
    description:
      "A festive sky island wrapped in snow-capped peaks and glowing pine forests, centered on a towering Santa statue surrounded by gifts, a cozy cabin and a glowing golden portal.",
  },
  {
    slug: "sweet-dream-express",
    image: "/portfolio/30.webp",
    title: "Sweet Dream Express",
    price: 75,
    difficulty: "Hard",
    buildType: "Vehicle",
    theme: "Fantasy",
    category: "Organic",
    released: "2026-02-14",
    description:
      "A whimsical creature riding atop a candy-colored rolling pin, wrapped in surreal, dreamlike detailing. A playful centerpiece for any fantasy build.",
  },
  {
    slug: "whimsy-the-moth",
    image: "/portfolio/20.webp",
    title: "Whimsy the Moth",
    price: 60,
    difficulty: "Easy",
    buildType: "Statue",
    theme: "Fantasy",
    category: "Organic",
    released: "2026-03-02",
    description:
      "A charming close-up bust of a moth-like creature with expressive eyes and soft fuzzy texturing. A great entry point for organic character builds.",
  },
  {
    slug: "neon-reverie",
    image: "/portfolio/25.webp",
    title: "Neon Reverie",
    price: 110,
    difficulty: "Hard",
    buildType: "Statue",
    theme: "Modern",
    category: "Organic",
    released: "2026-01-22",
    description:
      "A surreal glitch-art portrait bathed in neon purples and reds, blending organic sculpting with a bold, cyberpunk-inspired color palette.",
  },
  {
    slug: "the-forsaken",
    image: "/portfolio/15.webp",
    title: "The Forsaken",
    price: 90,
    difficulty: "Medium",
    buildType: "Statue",
    theme: "Ancient",
    category: "Organic",
    released: "2025-11-18",
    description:
      "A haunting, decayed bust with a cracked stone texture and an unsettling gaze, set against a dark camouflaged backdrop. Perfect for horror or ancient ruin themed builds.",
  },
];
