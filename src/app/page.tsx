import { fetchProducts, fetchCategoriesWithThumbnails, Category } from "@/lib/api";
import { fetchSmartSliderSlides, SlideData } from "@/lib/woocommerce";
import { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

// Cache the homepage data to serve it fully instantly (ISR), revalidating every 30 min
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Jersey Perfume | Luxury Fragrances Up to 80% Off",
  description:
    "Discover 100% authentic designer and niche fragrances at incredible prices. Free shipping on orders over $59. Shop Armani, Lattafa, Dumont, and more.",
  openGraph: {
    title: "Jersey Perfume | Luxury Fragrances Up to 80% Off",
    description: "100% authentic perfumes at unbeatable prices. Free shipping over $59.",
    images: ["/images/hero.png"],
  },
};

async function getHomepageData() {
  try {
    const [bestSellersRes, newArrivalsRes, gourmandRes, blogRes, categoriesRes, slidesRes] =
      await Promise.allSettled([
        fetchProducts(1, 4, "", "", "", "", "popularity", "desc"),
        fetchProducts(1, 4, "", "", "", "", "date", "desc"),
        fetchProducts(1, 8, "Give Me Gourmand", "", "", "", "date", "desc"),
        fetch("https://jerseyperfume.com/wp-json/wp/v2/posts?per_page=3&_embed").then((r) =>
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
      blogPosts: [],
      categories: [],
      slides: [],
    };
  }
}

export default async function Home() {
  const { bestSellers, newArrivals, gourmandProducts, blogPosts, categories, slides } =
    await getHomepageData();

  return (
    <HomeClient
      bestSellers={bestSellers}
      newArrivals={newArrivals}
      gourmandProducts={gourmandProducts}
      blogPosts={blogPosts}
      categories={categories}
      slides={slides}
    />
  );
}
