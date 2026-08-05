import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { SlidersHorizontal, ChevronDown, X, Filter, Check, Search } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { collections as localCollections, products as localProducts } from "@/lib/products";
import { cn } from "@/lib/utils";
import { Category, Product, Series } from "@/types/catalogue";
import { getCategories, subscribeToCategories } from "@/services/categoryService";
import { getProducts, subscribeToProducts } from "@/services/productService";
import { subscribeToSeries } from "@/services/seriesService";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Collection = string;

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): { collection?: string; series?: string } => {
    const c = search.collection;
    const s = search.series;
    return {
      collection: typeof c === "string" ? c : undefined,
      series: typeof s === "string" ? s : undefined,
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
  const seriesFilter = search.series ?? "All";
  const navigate = useNavigate({ from: Route.fullPath });

  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbSeries, setDbSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let unsubCats: () => void = () => {};
    let unsubProds: () => void = () => {};
    let unsubSeries: () => void = () => {};

    unsubCats = subscribeToCategories((cats) => {
      setDbCategories(cats);
    }, false);

    unsubProds = subscribeToProducts((prods) => {
      setDbProducts(prods);
    }, null);

    unsubSeries = subscribeToSeries((seriesList) => {
      setDbSeries(seriesList);
    }, false);

    return () => {
      unsubCats();
      unsubProds();
      unsubSeries();
    };
  }, []);

  // Compute collections lists
  const displayCollections = dbCategories.length > 0
    ? ["All", ...dbCategories.map(c => c.name)]
    : localCollections;

  // Selected category doc
  const selectedCategoryObj = dbCategories.find(
    (c) =>
      c.name.toLowerCase() === collectionFilter.toLowerCase() ||
      c.slug.toLowerCase() === collectionFilter.toLowerCase() ||
      c.id === collectionFilter
  );

  // Series belonging to selected category
  const categorySeries = collectionFilter !== "All"
    ? dbSeries.filter((s) => {
        if (selectedCategoryObj && s.categoryId === selectedCategoryObj.id) return true;
        if (s.categoryName && s.categoryName.toLowerCase() === collectionFilter.toLowerCase()) return true;
        return false;
      })
    : [];

  // Decide source
  const usingDb = dbProducts.length > 0;
  
  // Prepare products list with Search & Category & Series filtering
  const list = usingDb
    ? dbProducts
        .filter((p) => {
          // Search query match
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = p.name?.toLowerCase().includes(q);
            const catMatch = p.categoryName?.toLowerCase().includes(q);
            const seriesMatch = p.seriesName?.toLowerCase().includes(q);
            const descMatch = p.description?.toLowerCase().includes(q);
            const shortMatch = p.shortDescription?.toLowerCase().includes(q);
            if (!nameMatch && !catMatch && !seriesMatch && !descMatch && !shortMatch) return false;
          }

          // Category match
          if (collectionFilter !== "All") {
            const matchesName = p.categoryName?.toLowerCase() === collectionFilter.toLowerCase();
            const matchesId = selectedCategoryObj && p.categoryId === selectedCategoryObj.id;
            if (!matchesName && !matchesId) return false;
          }

          // Series match
          if (seriesFilter !== "All") {
            const matchesSeriesName = p.seriesName?.toLowerCase() === seriesFilter.toLowerCase();
            const matchesSeriesId = p.seriesId === seriesFilter;
            if (!matchesSeriesName && !matchesSeriesId) return false;
          }

          return true;
        })
        .map((p) => ({
          slug: p.slug,
          name: p.name,
          collection: p.categoryName,
          series: p.seriesName,
          price: 0,
          unit: "",
          image: p.primaryImage?.thumbnailUrl || p.primaryImage?.url || "",
          blurb: p.shortDescription || "",
          description: p.description || "",
          specs: p.specifications?.map((s) => ({ label: s.label, value: `${s.value} ${s.unit}`.trim() })) || [],
          finishes: p.finishes?.map((f) => f.name) || [],
          badge: p.featured ? "Featured" : undefined,
        }))
    : (localProducts
        .filter((p) => {
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = p.name?.toLowerCase().includes(q);
            const colMatch = p.collection?.toLowerCase().includes(q);
            const blurbMatch = p.blurb?.toLowerCase().includes(q);
            if (!nameMatch && !colMatch && !blurbMatch) return false;
          }
          if (collectionFilter !== "All") {
            if (p.collection !== collectionFilter) return false;
          }
          return true;
        }));

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24 min-h-[85vh]">
      <Reveal>
        <p className="eyebrow">Catalogue</p>
        <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">Products</h1>
        <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
          Architectural surface families, engineered for Indian interiors. Select a category and series to specify with confidence.
        </p>
      </Reveal>

      {/* Product Search Bar */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products by name, collection or finish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#E5E2DC] bg-[#FAF8F5] py-2.5 pl-9 pr-8 text-xs placeholder:text-muted-foreground focus:border-[#181512] focus:outline-hidden transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {/* Mobile Filter Button (Visible on Mobile) */}
      <div className="mt-8 flex items-center justify-between gap-3 md:hidden">
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#f0e8de]" />
          <span>Filter Products</span>
          {(collectionFilter !== "All" || seriesFilter !== "All") && (
            <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
              {(collectionFilter !== "All" ? 1 : 0) + (seriesFilter !== "All" ? 1 : 0)}
            </span>
          )}
        </button>

        {collectionFilter !== "All" && (
          <span className="truncate text-[0.7rem] font-semibold uppercase tracking-wider text-[#5b4937] bg-[#f0e8de]/60 px-3 py-1.5 rounded-full border border-[#5b4937]/10">
            {collectionFilter} {seriesFilter !== "All" ? `· ${seriesFilter}` : ""}
          </span>
        )}
      </div>

      {/* Filter Modal Popup for Mobile */}
      <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
        <DialogContent className="max-w-lg w-[92vw] rounded-2xl p-6 bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader className="border-b border-neutral-100 pb-3">
            <DialogTitle className="text-xl font-display font-semibold text-neutral-900 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#755c3b]" />
              Filter Catalogue
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-500">
              Select category and series to refine products.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Categories */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-600 mb-3">Categories</p>
              <div className="flex flex-wrap gap-2">
                {displayCollections.map((c) => {
                  const isActive = c === collectionFilter;
                  return (
                    <button
                      key={c}
                      onClick={() => navigate({ search: () => ({ collection: c === "All" ? undefined : c, series: undefined }) })}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs tracking-[0.12em] uppercase transition-all font-semibold border cursor-pointer",
                        isActive
                          ? "bg-black text-white border-black ring-2 ring-black ring-offset-1 shadow-md"
                          : "bg-black text-white/80 border-black/80 hover:bg-black hover:text-white"
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Series */}
            {collectionFilter !== "All" && (
              <div className="border-t border-neutral-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-600 mb-3">
                  {collectionFilter} Series ({categorySeries.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate({ search: (prev) => ({ ...prev, series: undefined }) })}
                    className={cn(
                      "rounded-lg px-3.5 py-1.5 text-xs tracking-wider uppercase transition-all font-semibold border cursor-pointer",
                      seriesFilter === "All"
                        ? "bg-black text-white border-black ring-2 ring-black ring-offset-1 shadow-xs"
                        : "bg-neutral-900 text-white/80 border-neutral-900 hover:bg-black hover:text-white"
                    )}
                  >
                    All Series
                  </button>

                  {categorySeries.map((s) => {
                    const isSeriesActive = s.name === seriesFilter || s.id === seriesFilter;
                    return (
                      <button
                        key={s.id}
                        onClick={() => navigate({ search: (prev) => ({ ...prev, series: s.name }) })}
                        className={cn(
                          "rounded-lg px-3.5 py-1.5 text-xs tracking-wider uppercase transition-all font-semibold flex items-center gap-1.5 border cursor-pointer",
                          isSeriesActive
                            ? "bg-black text-white border-black ring-2 ring-black ring-offset-1 shadow-xs"
                            : "bg-neutral-900 text-white/80 border-neutral-900 hover:bg-black hover:text-white"
                        )}
                      >
                        <span>{s.name}</span>
                        {s.productCount !== undefined && s.productCount > 0 && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.2 rounded font-mono",
                            isSeriesActive
                              ? "bg-neutral-800 text-neutral-200"
                              : "bg-neutral-800/80 text-neutral-300"
                          )}>
                            {s.productCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-neutral-100 pt-4 gap-3">
            <button
              onClick={() => {
                navigate({ search: () => ({ collection: undefined, series: undefined }) });
              }}
              className="text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
            >
              Reset All
            </button>
            <Button
              onClick={() => setIsFilterModalOpen(false)}
              className="bg-black text-white hover:bg-neutral-800 text-xs uppercase tracking-wider font-semibold px-6 rounded-full cursor-pointer"
            >
              Show ({list.length}) Products
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Filter Tabs (Desktop Pills matching exact user design) */}
      <div className="hidden md:flex mt-10 items-center gap-2.5 flex-wrap">
        {displayCollections.map((c) => {
          const isActive = c === collectionFilter;
          return (
            <button
              key={c}
              onClick={() => navigate({ search: () => ({ collection: c === "All" ? undefined : c, series: undefined }) })}
              className={cn(
                "shrink-0 rounded-full px-5 py-2 text-xs tracking-[0.14em] uppercase transition-all font-medium whitespace-nowrap border cursor-pointer",
                isActive
                  ? "bg-[#181512] text-white border-[#181512] shadow-xs"
                  : "bg-[#FAF8F5] text-[#6b6255] border-[#E5E2DC] hover:border-[#181512] hover:text-[#181512]"
              )}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Series Filter Tabs (Shown on Desktop when a specific category is selected) */}
      {collectionFilter !== "All" && (
        <div className="hidden md:flex mt-4 flex-col gap-3 rounded-2xl bg-[#FAF8F5]/50 p-4 sm:p-5 border border-[#E5E2DC]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#755c3b]" />
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#5b4937]">
                {collectionFilter} Series ({categorySeries.length})
              </span>
            </div>
            {seriesFilter !== "All" && (
              <button
                onClick={() => navigate({ search: (prev) => ({ ...prev, series: undefined }) })}
                className="text-xs font-semibold text-neutral-500 hover:text-black transition-colors cursor-pointer"
              >
                Clear Series Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate({ search: (prev) => ({ ...prev, series: undefined }) })}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs tracking-wider uppercase transition-all font-medium whitespace-nowrap border cursor-pointer",
                seriesFilter === "All"
                  ? "bg-[#181512] text-white border-[#181512] shadow-xs"
                  : "bg-white text-[#6b6255] border-[#E5E2DC] hover:border-[#181512] hover:text-[#181512]"
              )}
            >
              All Series
            </button>

            {categorySeries.map((s) => {
              const isSeriesActive = s.name === seriesFilter || s.id === seriesFilter;
              return (
                <button
                  key={s.id}
                  onClick={() => navigate({ search: (prev) => ({ ...prev, series: s.name }) })}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-1.5 text-xs tracking-wider uppercase transition-all font-medium flex items-center gap-1.5 whitespace-nowrap border cursor-pointer",
                    isSeriesActive
                      ? "bg-[#181512] text-white border-[#181512] shadow-xs"
                      : "bg-white text-[#6b6255] border-[#E5E2DC] hover:border-[#181512] hover:text-[#181512]"
                  )}
                >
                  <span>{s.name}</span>
                  {s.productCount !== undefined && s.productCount > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                      isSeriesActive
                        ? "bg-white/20 text-white"
                        : "bg-[#E5E2DC] text-[#6b6255]"
                    )}>
                      {s.productCount}
                    </span>
                  )}
                </button>
              );
            })}

            {categorySeries.length === 0 && (
              <span className="text-xs text-neutral-500 font-mono py-1">
                No series registered under {collectionFilter}. Displaying all products in category.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Products Grid */}
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
            No products found matching your filter selection.
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
