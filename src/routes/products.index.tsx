import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { collections as localCollections, products as localProducts } from "@/lib/products";
import { cn } from "@/lib/utils";
import { Category, Product } from "@/types/catalogue";
import { getCategories } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import { Skeleton } from "@/components/ui/skeleton";

type Collection = string;

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): { collection?: string } => {
    const c = search.collection;
    return {
      collection: typeof c === "string" ? c : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Products — Panels, Surfaces & Tiles | Vensai Prime Interiors" },
      {
        name: "description",
        content:
          "Browse the full Vensai catalogue: WPC panels, PolyGranites, acrylic laminates, timber baffles, charcoal panels, PVC 3D panels, mosaic tiles and soffits.",
      },
      { property: "og:title", content: "Products — Panels, Surfaces & Tiles | Vensai Prime Interiors" },
      {
        property: "og:description",
        content: "The full Vensai catalogue of architectural wall panels, cladding and stone-look surfaces.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = Route.useSearch();
  const collectionFilter = search.collection ?? "All";
  const navigate = useNavigate({ from: Route.fullPath });

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cats, result] = await Promise.all([
          getCategories(false), // only active
          getProducts({ status: "published", pageSize: 100 })
        ]);
        setDbCategories(cats);
        setDbProducts(result.products);
      } catch (error) {
        console.warn("Failed to load catalog from Firestore, using static fallbacks:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute collections lists
  const displayCollections = dbCategories.length > 0
    ? ["All", ...dbCategories.map(c => c.name)]
    : localCollections;

  // Decide source
  const usingDb = dbProducts.length > 0;
  
  // Prepare products list
  const list = usingDb
    ? dbProducts
        .filter(p => collectionFilter === "All" || p.categoryName === collectionFilter)
        .map(p => ({
          slug: p.slug,
          name: p.name,
          collection: p.categoryName,
          price: 0,
          unit: "",
          image: p.primaryImage?.thumbnailUrl || p.primaryImage?.url || "",
          blurb: p.shortDescription || "",
          description: p.description || "",
          specs: p.specifications?.map(s => ({ label: s.label, value: `${s.value} ${s.unit}`.trim() })) || [],
          finishes: p.finishes?.map(f => f.name) || [],
          badge: p.featured ? "Featured" : undefined,
        }))
    : (collectionFilter === "All" ? localProducts : localProducts.filter((p) => p.collection === collectionFilter));

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">Products</h1>
        <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
          Ten surface families, engineered for Indian interiors. Order swatches, then specify with confidence.
        </p>
      </Reveal>

      <div className="mt-12 flex flex-wrap gap-2 border-b pb-5">
        {displayCollections.map((c) => (
          <button
            key={c}
            onClick={() => navigate({ search: (prev) => ({ ...prev, collection: c }) })}
            className={cn(
              "rounded-full border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors",
              c === collectionFilter
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded bg-neutral-100" />
              <Skeleton className="h-4 w-2/3 bg-neutral-100" />
              <Skeleton className="h-3 w-1/2 bg-neutral-100" />
            </div>
          ))
        ) : list.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-muted-foreground font-mono">
            No products found in this category.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} ctaType="explore" />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
