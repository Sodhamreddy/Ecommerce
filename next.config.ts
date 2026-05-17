import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    staticGenerationMaxConcurrency: 1,
    staticGenerationRetryCount: 3,
  },
  async redirects() {
    return [
      {
        source: '/bridge2cart/:path*',
        destination: 'https://backend.jerseyperfume.com/bridge2cart/:path*',
        permanent: false,
      },
      {
        source: '/sitemap-0.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      {
        source: '/sitemap_index.xml',
        destination: '/sitemap.xml',
        permanent: true,
      },
      // Blog slug 301 redirects
      {
        source: '/blog/ahuja-perfumes-overview-fresh-affair-memories-kiwi-tart-honey-tobacco-amber-sage-drunk-saint-mango-mood-and-almond-saffron',
        destination: '/blog/ahuja-perfumes-review',
        permanent: true,
      },
      {
        source: '/blog/jean-lowe-summer-vibes-fantasme-chateau-ottoman-three-maison-alhambra-scents-worth-collecting',
        destination: '/blog/jean-lowe-summer-vibes-review',
        permanent: true,
      },
      {
        source: '/blog/lattafa-pride-new-releases-2026-review-new-york-city-of-dreams-love-in-paris-and-london-city-of-contrast',
        destination: '/blog/lattafa-pride-2026-review',
        permanent: true,
      },
      {
        source: '/blog/luxury-on-a-budget-panache-angel-dust-rayhaan-pacific-aura-review',
        destination: '/blog/best-budget-luxury-fragrances',
        permanent: true,
      },
      {
        source: '/blog/exploring-nitro-gold-and-kaaf-noir-a-fragrance-duo-review',
        destination: '/blog/nitro-gold-kaaf-noir-review',
        permanent: true,
      },
      {
        source: '/blog/the-scent-of-memory-why-perfume-is-the-ultimate-mothers-day-gift',
        destination: '/blog/best-mothers-day-perfume-gifts',
        permanent: true,
      },
      {
        source: '/blog/christian-siriano-perfume-gift-sets-for-women-silhouette-in-bloom-ooh-la-rose-more',
        destination: '/blog/christian-siriano-gift-sets',
        permanent: true,
      },
      {
        source: '/blog/top-khadlaj-fragrances-ranked-shiyaaka-island-vanilla-dunes-more',
        destination: '/blog/best-khadlaj-fragrances',
        permanent: true,
      },
      {
        source: '/blog/maison-alhambras-hidden-gems-why-delilah-blanc-jean-lowe-vibe-jean-lowe-azure-are-taking-over-the-fragrance-world',
        destination: '/blog/maison-alhambra-hidden-gems',
        permanent: true,
      },
      {
        source: '/blog/discover-the-best-lattafa-perfumes-vanille-mishlah-angham',
        destination: '/blog/best-lattafa-perfumes',
        permanent: true,
      },
      {
        source: '/blog/discover-the-best-lattafa-perfumes-for-men-top-picks-revealed',
        destination: '/blog/best-lattafa-perfumes-men',
        permanent: true,
      },
      {
        source: '/blog/best-ahmed-al-maghribi-spring-perfumes-2026',
        destination: '/blog/ahmed-al-maghribi-spring-perfumes',
        permanent: true,
      },
      {
        source: '/blog/top-10-long-lasting-spring-perfumes-youll-love',
        destination: '/blog/best-long-lasting-spring-perfumes',
        permanent: true,
      },
      {
        source: '/blog/tumi-extrait-de-parfums-pure-luxury',
        destination: '/blog/tumi-extrait-review',
        permanent: true,
      },
      {
        source: '/blog/can-i-carry-perfume-on-a-plane',
        destination: '/blog/perfume-on-plane-rules',
        permanent: true,
      },
      {
        source: '/blog/why-is-nitro-elixir-becoming-the-go-to-perfume-for-men-in-2025',
        destination: '/blog/nitro-elixir-review',
        permanent: true,
      },
      {
        source: '/blog/refined-strength-icy-elegance-discover-nitro-elixir-and-soprano-ice-by-dumont',
        destination: '/blog/nitro-elixir-vs-soprano-ice',
        permanent: true,
      },
      {
        source: '/blog/dumont-nitro-red-intensely-vs-nitro-red-vs-rasasi-hawas-best-affordable-beast-mode-fragrance-battle',
        destination: '/blog/nitro-red-vs-hawas',
        permanent: true,
      },
      {
        source: '/blog/nitro-red-intensely-by-dumont-full-review-of-this-bold-long-lasting-extrait-de-parfum',
        destination: '/blog/nitro-red-intensely-review',
        permanent: true,
      },
      {
        source: '/blog/%F0%9F%8E%80-candied-fantasy-by-britney-spears-review-a-sweet-perfume-youll-love',
        destination: '/blog/candied-fantasy-review',
        permanent: true,
      },
      {
        source: '/blog/%F0%9F%8C%9E-the-best-perfumes-for-summer-2025-scents-that-define-the-season',
        destination: '/blog/best-summer-perfumes-2025',
        permanent: true,
      },
      {
        source: '/blog/%F0%9F%94%A5-top-6-must-have-mens-fragrances-elevate-your-scent-game-in-2025-%F0%9F%94%A5',
        destination: '/blog/top-mens-fragrances-2025',
        permanent: true,
      },
      {
        source: '/blog/take-notes-5-best-perfume-trends-for-2024',
        destination: '/blog/perfume-trends-2024',
        permanent: true,
      },
      {
        source: '/blog/the-best-woody-perfumes-for-women-2',
        destination: '/blog/best-woody-perfumes-women-2',
        permanent: true,
      },
      {
        source: '/blog/the-best-woody-perfumes-for-women',
        destination: '/blog/best-woody-perfumes-women',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
