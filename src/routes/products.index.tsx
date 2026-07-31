import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { Reveal } from "@/components/reveal";
import { ProductCard } from "@/components/product-card";
import { collections, products } from "@/lib/products";
import { cn } from "@/lib/utils";

type Collection = (typeof collections)[number];

export const Route = createFileRoute("/products/")({
  validateSearch: (search: Record<string, unknown>): { collection?: Collection } => {
    const c = search.collection;
    return {
      collection: collections.includes(c as Collection) ? (c as Collection) : undefined,
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
  const collection = search.collection ?? "All";
  const navigate = useNavigate({ from: Route.fullPath });
  const list = collection === "All" ? products : products.filter((p) => p.collection === collection);

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
        {collections.map((c) => (
          <button
            key={c}
            onClick={() => navigate({ search: (prev) => ({ ...prev, collection: c }) })}
            className={cn(
              "rounded-full border px-4 py-2 text-xs tracking-[0.14em] uppercase transition-colors",
              c === collection
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} ctaType="explore" />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
