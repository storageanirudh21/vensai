import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ArrowLeft, Check, Minus, Plus, ZoomIn, ZoomOut, FileText, Loader2, RotateCcw, Maximize2, X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/product-card";
import { Reveal } from "@/components/reveal";
import { getProduct as getLocalProduct, products as localProducts } from "@/lib/products";
import { getProductBySlug } from "@/services/productService";
import { useLead } from "@/lib/lead";
import { cn } from "@/lib/utils";
import { Product } from "@/types/catalogue";
import { Skeleton } from "@/components/ui/skeleton";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }) => {
    // Keep TanStack route metadata happy by returning slug
    return { slug: params.slug };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Vensai" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} — Vensai Prime Interiors`;
    return {
      meta: [
        { title },
        { name: "description", content: "Tactile architectural surfaces and considered design details." },
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
  const { openQuery, openVisit } = useLead();

  const localInitial = getLocalProduct(slug);
  const initialMapped = localInitial
    ? {
        slug: localInitial.slug,
        name: localInitial.name,
        sku: `VNS-${localInitial.slug.slice(0, 4).toUpperCase()}`,
        collection: localInitial.collection,
        seriesName: "",
        description: localInitial.description,
        specs: localInitial.specs,
        finishes: localInitial.finishes,
        image: localInitial.image,
        images: [localInitial.image, hero2, hero3],
        unit: localInitial.unit,
        brochure: null,
        badge: localInitial.badge,
      }
    : null;

  const [loading, setLoading] = useState(!initialMapped);
  const [product, setProduct] = useState<any>(initialMapped);
  const [finish, setFinish] = useState(initialMapped?.finishes?.[0] || "");
  const [qty, setQty] = useState(20);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        // Check Firestore
        const dbProd = await getProductBySlug(slug);
        if (dbProd) {
          const mapped = {
            slug: dbProd.slug,
            name: dbProd.name,
            sku: dbProd.sku,
            collection: dbProd.categoryName,
            seriesName: dbProd.seriesName,
            description: dbProd.description,
            specs: dbProd.specifications?.map(s => ({ label: s.label, value: `${s.value} ${s.unit}`.trim() })) || [],
            finishes: dbProd.finishes?.map(f => f.name) || [],
            image: dbProd.primaryImage?.url || "",
            images: dbProd.images && dbProd.images.length > 0
              ? dbProd.images.map(img => img.url)
              : [dbProd.primaryImage?.url || ""],
            unit: "sq.ft",
            brochure: dbProd.brochure,
            badge: dbProd.featured ? "Bestseller" : undefined,
          };
          setProduct(mapped);
          if (mapped.finishes.length > 0) {
            setFinish(mapped.finishes[0]);
          }
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn("Failed to retrieve product from Firestore, trying fallback:", error);
      }

      // 2. Fallback to local static data
      const local = getLocalProduct(slug);
      if (local) {
        const mapped = {
          slug: local.slug,
          name: local.name,
          sku: `VNS-${local.slug.slice(0, 4).toUpperCase()}`,
          collection: local.collection,
          seriesName: "",
          description: local.description,
          specs: local.specs,
          finishes: local.finishes,
          image: local.image,
          images: [local.image, hero2, hero3],
          unit: local.unit,
          brochure: null,
          badge: local.badge,
        };
        setProduct(mapped);
        if (mapped.finishes.length > 0) {
          setFinish(mapped.finishes[0]);
        }
      }
      setLoading(false);
    };

    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-24 md:px-8 min-h-[85vh]">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="aspect-square w-full rounded-2xl bg-neutral-100" />
            <div className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-xl bg-neutral-100" />
              <Skeleton className="h-20 w-20 rounded-xl bg-neutral-100" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton className="h-6 w-24 bg-neutral-100" />
            <Skeleton className="h-12 w-4/5 bg-neutral-100" />
            <Skeleton className="h-24 w-full bg-neutral-100" />
            <Separator />
            <Skeleton className="h-10 w-full bg-neutral-100" />
            <Skeleton className="h-14 w-full bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-md px-5 py-32 text-center min-h-[85vh]">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Button asChild variant="outline" className="mt-6 rounded-sm">
          <Link to="/products">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  const related = localProducts.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-16 min-h-[85vh]">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Catalogue
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-[4/5] md:aspect-square w-full overflow-hidden rounded-2xl bg-secondary group touch-none">
            <motion.img
              key={`${finish}-${activeImage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, scale: zoomLevel }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              src={product.images[activeImage] || product.image}
              alt={`${product.name} detail view`}
              className={cn(
                "h-full w-full object-cover origin-center transition-transform",
                zoomLevel > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
              )}
              drag={zoomLevel > 1}
              dragConstraints={{
                left: -180 * (zoomLevel - 1),
                right: 180 * (zoomLevel - 1),
                top: -180 * (zoomLevel - 1),
                bottom: 180 * (zoomLevel - 1),
              }}
              dragElastic={0.05}
              onClick={() => {
                if (zoomLevel === 1) {
                  setZoomLevel(2);
                }
              }}
            />
            
            {/* Zoom & Lightbox Controls Bar */}
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-md border border-neutral-200/80">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(prev => Math.max(prev - 0.5, 1));
                }} 
                disabled={zoomLevel <= 1}
                title="Zoom out"
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-30 text-[#121212]"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="px-1.5 font-mono text-[10px] font-bold text-neutral-700 min-w-[3rem] text-center select-none">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomLevel(prev => Math.min(prev + 0.5, 3));
                }}
                disabled={zoomLevel >= 3}
                title="Zoom in"
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-30 text-[#121212]"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {zoomLevel > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomLevel(1);
                  }}
                  title="Reset zoom"
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 border-l border-neutral-200 pl-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                title="Full screen view"
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 border-l border-neutral-200 pl-2"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img: string, idx: number) => (
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="eyebrow">{product.collection}</span>
          </div>
          <h1 className="mt-3 font-display text-4xl leading-none sm:text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>

          <Separator className="my-8" />

          {product.seriesName && (
            <div className="mb-6">
              <div className="inline-flex items-center rounded-md bg-[#f0e8de]/50 px-3 py-1.5 border border-[#5b4937]/10">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#5b4937]/70 mr-2">Series - </span>
                <span className="text-[0.65rem] text-[#5b4937]/30 mr-2">·</span>
                <span className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-[#5b4937]">{product.seriesName}</span>
              </div>
            </div>
          )}

          {product.finishes.length > 0 && (
            <>
              <p className="eyebrow">Finish · {finish}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.finishes.map((f: string) => (
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
            </>
          )}

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

          <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
            <Button
              size="lg"
              className="flex-1 w-full sm:w-auto h-auto min-h-[2.75rem] py-3 px-4 text-xs font-semibold uppercase tracking-[0.1em] text-center whitespace-normal rounded-sm bg-[#5b4937] text-white hover:bg-[#3d3124] transition-colors shadow-xs"
              onClick={() => openQuery(`${product.name} — ${finish}, ~${qty} ${product.unit}`)}
            >
              Enquire about this product
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 w-full sm:w-auto h-auto min-h-[2.75rem] py-3 px-4 text-xs font-semibold uppercase tracking-[0.1em] text-center whitespace-normal rounded-sm border-[#d5cdc1] hover:border-black transition-colors"
              onClick={() => openVisit(product.name)}
            >
              Book a site visit
            </Button>
          </div>

          {/* Brochure Display Section */}
          {product.brochure && (
            <div className="mt-8 rounded-xl border border-[#E5E2DC] bg-[#FAF8F5]/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#f0ece5] text-[#5b4937] shrink-0">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold block text-neutral-800 truncate">{product.brochure.title}</span>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Official Product Specification PDF</span>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button size="sm" variant="outline" asChild className="rounded-full text-[0.68rem] font-semibold uppercase border-[#d5cdc1] bg-white text-[#5b4937] hover:bg-[#5b4937] hover:text-white transition-all cursor-pointer">
                  <a href={product.brochure.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                    <ExternalLink className="h-3 w-3" />
                    <span>View</span>
                  </a>
                </Button>
                <Button size="sm" asChild className="rounded-full text-[0.68rem] font-semibold uppercase bg-[#181512] text-white hover:bg-[#5b4937] transition-all shadow-xs cursor-pointer">
                  <a href={product.brochure.fileUrl} download target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </a>
                </Button>
              </div>
            </div>
          )}

          {product.specs && product.specs.length > 0 && (
            <dl className="mt-12 divide-y border-t">
              {product.specs.map((s: any) => (
                <div key={s.label} className="grid grid-cols-2 gap-4 py-4 text-sm">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
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

      {/* Lightbox Fullscreen Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 rounded-full bg-white/20 p-3 text-white hover:bg-white/30 transition-colors"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={product.images[activeImage] || product.image}
            alt={product.name}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
