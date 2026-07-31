import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Check, Minus, Plus, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { getProduct, products } from "@/lib/products";
import { useLead } from "@/lib/lead";
import { cn } from "@/lib/utils";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { slug: product.slug, name: product.name, blurb: product.blurb };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Vensai" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.name} — Vensai Prime Interiors`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.blurb },
      ],
    };
  },
  component: ProductDetail,
  errorComponent: ({ error }) => <div className="p-20 text-center">{error.message}</div>,
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-5 py-32 text-center">
      <h1 className="font-display text-4xl">Product not found</h1>
      <Button asChild variant="outline" className="mt-6 rounded-sm">
        <Link to="/products">Back to catalogue</Link>
      </Button>
    </div>
  ),
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const product = getProduct(slug)!;
  const { openQuery, openVisit } = useLead();
  const [finish, setFinish] = useState(product.finishes[0]);
  const [qty, setQty] = useState(20);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Catalogue
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-[4/5] md:aspect-square w-full overflow-hidden rounded-2xl bg-secondary group">
            <motion.img
              key={`${finish}-${activeImage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: zoomLevel }}
              transition={{ duration: 0.3 }}
              src={[product.image, hero2, hero3][activeImage]}
              alt={`${product.name} detail view`}
              className="h-full w-full object-cover origin-center cursor-move"
              drag={zoomLevel > 1}
              dragConstraints={{ left: -100 * zoomLevel, right: 100 * zoomLevel, top: -100 * zoomLevel, bottom: 100 * zoomLevel }}
            />
            
            <div className="absolute bottom-4 right-4 flex gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(prev - 0.5, 1))} 
                disabled={zoomLevel <= 1}
                className="p-2 hover:bg-white rounded-full transition-colors disabled:opacity-50 text-[#121212]"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
                disabled={zoomLevel >= 3}
                className="p-2 hover:bg-white rounded-full transition-colors disabled:opacity-50 text-[#121212]"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[product.image, hero2, hero3].map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveImage(idx);
                  setZoomLevel(1);
                }}
                className={cn(
                  "relative aspect-square w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                  activeImage === idx ? "border-[#121212] opacity-100" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 lg:sticky lg:top-28">
          <p className="eyebrow">{product.collection}</p>
          <h1 className="mt-3 font-display text-5xl leading-none md:text-6xl">{product.name}</h1>
          <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>



          <Separator className="my-8" />

          <p className="eyebrow">Finish · {finish}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.finishes.map((f) => (
              <button
                key={f}
                onClick={() => setFinish(f)}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors",
                  f === finish
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
                )}
              >
                {f === finish && <Check className="h-3 w-3" />}
                {f}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-sm border">
              <button
                className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => setQty((q) => Math.max(1, q - 5))}
                aria-label="Decrease area"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-16 text-center text-sm tabular-nums">{qty} {product.unit}</span>
              <button
                className="grid h-11 w-11 place-items-center text-muted-foreground hover:text-foreground"
                onClick={() => setQty((q) => q + 5)}
                aria-label="Increase area"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              className="rounded-sm"
              onClick={() => openQuery(`${product.name} — ${finish}, ~${qty} ${product.unit}`)}
            >
              Enquire about this {product.collection.endsWith('s') ? product.collection.slice(0, -1).toLowerCase() : product.collection.toLowerCase()}
            </Button>
            <Button size="lg" variant="outline" className="rounded-sm" onClick={() => openVisit(product.name)}>
              Book a site visit
            </Button>
          </div>

          <dl className="mt-12 divide-y border-t">
            {product.specs.map((s) => (
              <div key={s.label} className="grid grid-cols-2 gap-4 py-4 text-sm">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-right">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="mt-24 border-t pt-16">
        <Reveal>
          <h2 className="font-display text-3xl">Pairs well with</h2>
        </Reveal>
        <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
