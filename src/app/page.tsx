import { fetchProducts, fetchCategoriesWithThumbnails, Category } from "@/lib/api";
import { fetchSmartSliderSlides, SlideData } from "@/lib/woocommerce";
import { API_BASE_URL } from "@/lib/config";
import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

// Revalidate homepage data every hour (blog posts, sliders, products)
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Jersey Perfume | Luxury Fragrances Up to 80% Off",
  description:
    "Discover 100% authentic designer and niche fragrances at incredible prices. Free shipping on orders over $59. Shop Armani, Lattafa, Dumont, and more.",
  alternates: { canonical: "https://jerseyperfume.com/" },
  openGraph: {
    title: "Jersey Perfume | Luxury Fragrances Up to 80% Off",
    description: "100% authentic perfumes at unbeatable prices. Free shipping over $59.",
    url: "https://jerseyperfume.com/",
    type: "website",
    images: [{ url: "https://jerseyperfume.com/images/hero.png", width: 1200, height: 630, alt: "Jersey Perfume" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jersey Perfume | Luxury Fragrances Up to 80% Off",
    description: "100% authentic perfumes at unbeatable prices. Free shipping over $59.",
    images: ["https://jerseyperfume.com/images/hero.png"],
  },
};

async function getHomepageData() {
  try {
    const [bestSellersRes, newArrivalsRes, gourmandRes, onSaleRes, blogRes, categoriesRes, slidesRes] =
      await Promise.allSettled([
        fetchProducts(1, 8, "", "", "", "", "popularity", "desc"),
        fetchProducts(1, 8, "", "", "", "", "date", "desc"),
        fetchProducts(1, 8, "Give Me Gourmand", "", "", "", "date", "desc"),
        fetchProducts(1, 8, "", "", "", "", "date", "desc", true),
        fetch(`${API_BASE_URL}/wp/v2/posts?per_page=3&_embed`, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        }).then((r) =>
          r.ok ? r.json() : []
        ),
        fetchCategoriesWithThumbnails(),
        fetchSmartSliderSlides(2),
      ]);

    return {
      bestSellers:
        bestSellersRes.status === "fulfilled" ? bestSellersRes.value.products : [],
      newArrivals:
        newArrivalsRes.status === "fulfilled" ? newArrivalsRes.value.products : [],
      gourmandProducts:
        gourmandRes.status === "fulfilled" ? gourmandRes.value.products : [],
      onSaleProducts:
        onSaleRes.status === "fulfilled" ? onSaleRes.value.products : [],
      blogPosts:
        blogRes.status === "fulfilled" && Array.isArray(blogRes.value)
          ? blogRes.value
          : [],
      categories:
        categoriesRes.status === "fulfilled" ? (categoriesRes.value as Category[]) : [],
      slides:
        slidesRes.status === "fulfilled" ? (slidesRes.value as SlideData[]) : [],
    };
  } catch {
    return {
      bestSellers: [],
      newArrivals: [],
      gourmandProducts: [],
      onSaleProducts: [],
      blogPosts: [],
      categories: [],
      slides: [],
    };
  }
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://jerseyperfume.com/#organization",
      name: "Jersey Perfume",
      url: "https://jerseyperfume.com/",
      logo: { "@type": "ImageObject", url: "https://jerseyperfume.com/jersey-logo.png" },
      sameAs: [
        "https://www.facebook.com/profile.php?id=61576907750503",
        "https://www.instagram.com/jerseyperfumeusa/",
        "https://www.youtube.com/@jerseyperfume",
        "https://x.com/JerseyPerfume",
        "https://www.pinterest.com/jerseyperfumeofficial/",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+1-732-361-4489",
        contactType: "customer service",
        areaServed: "US",
        availableLanguage: "English",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://jerseyperfume.com/#website",
      url: "https://jerseyperfume.com/",
      name: "Jersey Perfume",
      publisher: { "@id": "https://jerseyperfume.com/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://jerseyperfume.com/shop/?search={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function Home() {
  const { bestSellers, newArrivals, gourmandProducts, onSaleProducts, blogPosts, categories, slides } =
    await getHomepageData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeClient
        bestSellers={bestSellers}
        newArrivals={newArrivals}
        gourmandProducts={gourmandProducts}
        onSaleProducts={onSaleProducts}
        blogPosts={blogPosts}
        categories={categories}
        slides={slides}
      />
    </>
  );
}
