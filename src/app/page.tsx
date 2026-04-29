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
  openGraph: {
    title: "Jersey Perfume | Luxury Fragrances Up to 80% Off",
    description: "100% authentic perfumes at unbeatable prices. Free shipping over $59.",
    images: ["/images/hero.png"],
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

export default async function Home() {
  const { bestSellers, newArrivals, gourmandProducts, onSaleProducts, blogPosts, categories, slides } =
    await getHomepageData();

  return (
    <HomeClient
      bestSellers={bestSellers}
      newArrivals={newArrivals}
      gourmandProducts={gourmandProducts}
      onSaleProducts={onSaleProducts}
      blogPosts={blogPosts}
      categories={categories}
      slides={slides}
    />
  );
}
