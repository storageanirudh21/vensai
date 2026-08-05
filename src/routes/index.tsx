import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Quote,
  Expand,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import hero from "@/assets/hero-interior.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import clientVilla from "@/assets/client-villa-hyderabad.png";
import clientHotel from "@/assets/client-hotel-bengaluru.png";
import clientOffice from "@/assets/client-office-chennai.png";
import clientPenthouse from "@/assets/client-penthouse-mumbai.png";
import luxuryWallCladding from "@/assets/luxury-wall-cladding.png";
import importedMarble from "@/assets/imported-marble.png";
import decorativeArtifacts from "@/assets/decorative-artifacts.png";
import { collections, products } from "@/lib/products";
import { useLead } from "@/lib/lead";
import { subscribeToCategories } from "@/services/categoryService";
import { subscribeToProducts } from "@/services/productService";
import { Category, Product } from "@/types/catalogue";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vensai Prime Interiors — Architectural Surfaces" },
      {
        name: "description",
        content: "Architectural surfaces and considered interior finishes for modern spaces.",
      },
    ],
  }),
  component: Home,
});

const featured = products.slice(0, 3);
const heroSlides = [
  {
    image: hero2,
    label: "Fluted panels & stone surfaces",
    title: "Materials with a quieter kind of presence.",
    body: "Carefully selected panels, marble sheets and surface systems made for homes and hospitality spaces with lasting character.",
  },
  {
    image: hero3,
    label: "PolyGranite & mosaics",
    title: "Depth, texture and light in every finish.",
    body: "Discover surfaces selected for their tactile quality, practical performance and ability to settle naturally into a room.",
  },
  {
    image: hero,
    label: "Architectural cladding",
    title: "Considered surfaces for spaces that last.",
    body: "From reception walls to private homes, every collection is made to bring a feeling of balance to the finished space.",
  },
];

function SectionLabel({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.13em] ${dark ? "text-white/65" : "text-[#5b554c]"}`}
    >
      <span className={`h-1 w-1 rounded-full ${dark ? "bg-white" : "bg-[#3d382f]"}`} />
      {children}
    </p>
  );
}

function Hero() {
  const { openQuery } = useLead();
  const [active, setActive] = useState(0);
  const slide = heroSlides[active];

  const move = (direction: number) =>
    setActive((current) => (current + direction + heroSlides.length) % heroSlides.length);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <section className="relative min-h-[710px] overflow-hidden bg-[#1c1712] text-white">
      {heroSlides.map((item, index) => (
        <div
          key={item.image}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            active === index ? "opacity-100 z-0" : "opacity-0 -z-10 pointer-events-none"
          }`}
        >
          <img
            src={item.image}
            alt="Vensai interior surface application"
            className="h-full w-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-[#160f0a]/55 z-0" />
      <div className="relative z-10 mx-auto flex min-h-[710px] max-w-[1440px] flex-col px-6 pb-8 pt-32 sm:px-8 md:px-14 md:pb-14 md:pt-36">
        <div className="flex flex-1 flex-col justify-center">
          <div key={`label-${active}`} className="transition-all duration-500 ease-out">
            <SectionLabel dark>{slide.label}</SectionLabel>
            <h1 className="mt-8 max-w-3xl font-sans text-[2.6rem] font-normal leading-[0.96] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
              {slide.title}
            </h1>
          </div>
        </div>
        <div className="flex flex-col gap-6 border-t border-white/30 pt-6 md:flex-row md:items-end md:justify-between">
          <div key={`body-${active}`} className="max-w-sm transition-all duration-500 ease-out">
            <p className="text-xs leading-relaxed text-white/75">{slide.body}</p>
          </div>
            <div className="flex items-center gap-3">
              <div className="mr-2 flex items-center gap-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      active === i ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
                <span className="ml-1 text-[0.7rem] font-mono text-white/70">
                  0{active + 1} / 0{heroSlides.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openQuery()}
                className="rounded-full bg-white px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#201914] transition-colors hover:bg-[#eee4d8]"
              >
                Start a project
              </button>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous hero"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/40 transition-colors hover:bg-white hover:text-black"
              >
                <ArrowLeft size={15} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next hero"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/40 transition-colors hover:bg-white hover:text-black"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
    </section>
  );
}

interface DisplayProduct {
  slug: string;
  name: string;
  collection: string;
  image: string;
  badge?: string;
}

function ProductCard({ product, index }: { product: DisplayProduct; index: number }) {
  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd1c0]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 border border-white/60 bg-[#261b14]/70 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white">
            {product.badge}
          </span>
        ) : index === 0 ? (
          <span className="absolute left-3 top-3 border border-white/60 bg-[#261b14]/70 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white">
            Selected
          </span>
        ) : null}
      </div>
      <div className="border-b border-[#cdc4b7] py-3">
        <p className="text-[0.56rem] font-medium uppercase tracking-[0.15em] text-[#776f63]">
          {product.collection}
        </p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium tracking-[-0.025em] text-[#27221c] group-hover:text-[#5b4937] transition-colors">
            {product.name}
          </h3>
          <ArrowUpRight size={14} className="text-[#776f63] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}

interface DisplayCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

function CategoryCard({ category, index }: { category: DisplayCategory; index: number }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link
      to="/products"
      search={{ collection: category.name }}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd1c0]">
        {!imageLoaded && (
          <Skeleton className="absolute inset-0 h-full w-full rounded-none bg-[#eae3d7] animate-pulse" />
        )}
        <img
          src={category.image}
          alt={category.name}
          loading={index < 5 ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          className={cn(
            "h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.035]",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
        />
        {index === 0 && imageLoaded && (
          <span className="absolute left-3 top-3 z-10 border border-white/60 bg-[#261b14]/70 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white">
            Selected
          </span>
        )}
      </div>
      <div className="border-b border-[#cdc4b7] py-3">
        {!imageLoaded ? (
          <div className="space-y-2 py-1">
            <Skeleton className="h-2.5 w-1/3 bg-[#eae3d7] animate-pulse" />
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-3/4 bg-[#eae3d7] animate-pulse" />
              <Skeleton className="h-3.5 w-3.5 rounded-full bg-[#eae3d7] animate-pulse shrink-0" />
            </div>
          </div>
        ) : (
          <>
            <p className="text-[0.56rem] font-medium uppercase tracking-[0.15em] text-[#776f63]">
              {category.productCount !== undefined && category.productCount > 0
                ? `${category.productCount} ${category.productCount === 1 ? "Product" : "Products"}`
                : "Category"}
            </p>
            <div className="mt-1 flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium tracking-[-0.025em] text-[#27221c] group-hover:text-[#5b4937] transition-colors truncate">
                {category.name}
              </h3>
              <ArrowUpRight
                size={14}
                className="text-[#776f63] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0"
              />
            </div>
          </>
        )}
      </div>
    </Link>
  );
}

function Products() {
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase categories in real-time
    const unsubscribe = subscribeToCategories((cats) => {
      setDbCategories(cats);
    }, false);

    return () => unsubscribe();
  }, []);

  const fallbackImages = [
    hero2,
    hero3,
    luxuryWallCladding,
    importedMarble,
    decorativeArtifacts,
    hero,
    clientVilla,
    clientHotel,
    clientOffice,
    clientPenthouse,
  ];

  const hasDbCategories = dbCategories.length > 0;

  const categoryList: DisplayCategory[] = hasDbCategories
    ? dbCategories.map((c, idx) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        productCount: c.productCount,
        image: c.coverImage?.url || c.coverImage?.thumbnailUrl || fallbackImages[idx % fallbackImages.length],
      }))
    : collections
        .filter((c) => c !== "All")
        .map((c, idx) => ({
          id: c,
          name: c,
          slug: c.toLowerCase(),
          image: fallbackImages[idx % fallbackImages.length],
        }));

  return (
    <section className="bg-[#f8f6f1] px-6 py-20 md:px-14 md:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-6 border-b border-[#d5cdc1] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Our collections</SectionLabel>
            <h2 className="mt-5 text-3xl font-normal leading-[1.05] tracking-[-0.055em] text-[#29241e] md:text-5xl">
              Surfaces designed to become part of the room.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[#6c6458]">
              A practical collection of high-performance finishes selected for their depth, durability and calm material character.
            </p>
          </div>
          <Link
            to="/products"
            className="rounded-full bg-[#211c17] px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white hover:bg-[#5b4937] transition-colors w-fit shrink-0"
          >
            View all categories ({categoryList.length})
          </Link>
        </div>

        {loading ? (
          <div className="-mr-6 pt-8 flex gap-4 overflow-x-auto pb-3 pr-6 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5 sm:overflow-visible sm:pr-0 scrollbar-none">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="w-[72vw] shrink-0 sm:w-auto space-y-3">
                <Skeleton className="aspect-[4/5] w-full rounded bg-[#eae3d7]" />
                <Skeleton className="h-3 w-1/3 bg-[#eae3d7]" />
                <Skeleton className="h-4 w-2/3 bg-[#eae3d7]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="-mr-6 pt-8 flex gap-4 overflow-x-auto pb-3 pr-6 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 sm:gap-5 sm:overflow-visible sm:pr-0 scrollbar-none">
            {categoryList.map((category, index) => (
              <div key={category.id || category.slug} className="w-[72vw] shrink-0 sm:w-auto">
                <CategoryCard category={category} index={index} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Bestsellers() {
  const [dbBestsellers, setDbBestsellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProducts((prods) => {
      // Filter for products marked as bestSeller === true
      const bestSellers = prods.filter((p) => p.bestSeller === true);
      setDbBestsellers(bestSellers);
    }, null);

    return () => unsubscribe();
  }, []);

  const formattedDbBestsellers = dbBestsellers.map((p) => ({
    slug: p.slug,
    name: p.name,
    collection: p.categoryName,
    image: p.primaryImage?.thumbnailUrl || p.primaryImage?.url || (p.images && p.images[0]?.url) || "",
    badge: "Bestseller",
  }));

  const localBestsellers = products.slice(3, 7).map((p) => ({
    slug: p.slug,
    name: p.name,
    collection: p.collection,
    image: p.image,
    badge: p.badge,
  }));

  const displayBestsellers = formattedDbBestsellers.length > 0 ? formattedDbBestsellers : localBestsellers;

  return (
    <section className="bg-[#eee8de] px-6 py-20 md:px-14 md:py-28">
      <div className="mx-auto max-w-[1260px]">
        <div className="flex flex-col gap-6 border-b border-[#cbc1b2] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel>Most loved finishes</SectionLabel>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.055em] text-[#29231d] md:text-5xl">
              Bestsellers
            </h2>
          </div>
          <Link
            to="/products"
            className="inline-flex w-fit items-center gap-2 text-xs text-[#5f5548] hover:text-black"
          >
            Explore the full collection <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full rounded bg-[#dfd6c8]" />
                <Skeleton className="h-3 w-1/3 bg-[#dfd6c8]" />
                <Skeleton className="h-4 w-2/3 bg-[#dfd6c8]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="-mr-6 mt-7 flex gap-4 overflow-x-auto pb-3 pr-6 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pr-0 lg:grid-cols-4">
            {displayBestsellers.map((product, index) => (
              <div key={product.slug} className="w-[72vw] shrink-0 sm:w-auto">
                <ProductCard product={product} index={index + 1} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Story() {
  return (
    <section className="grid bg-[#211d18] text-white lg:grid-cols-2">
      <div className="relative min-h-[450px] overflow-hidden">
        <img
          src={hero3}
          alt="Vensai material detail"
          className="absolute inset-0 h-full w-full object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-[#211d18]/45" />
        <p className="absolute bottom-8 left-8 max-w-xs text-xs leading-relaxed text-white/85 md:bottom-12 md:left-14">
          Every project begins with material samples, scale drawings and a clear understanding of
          how the finish will live in the space.
        </p>
      </div>
      <div className="flex min-h-[450px] flex-col justify-between p-8 md:p-14">
        <SectionLabel dark>Designed around you</SectionLabel>
        <div>
          <h2 className="max-w-md text-3xl font-normal leading-[1.03] tracking-[-0.055em] md:text-5xl">
            Create a warm, balanced space with materials that feel considered.
          </h2>
          <Link
            to="/about"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#221c17] hover:bg-[#eadfce]"
          >
            About Vensai <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    quote:
      "The final spaces feel calm and complete. Every surface was chosen with care, and the Vensai team made the process exceptionally clear from sample to installation.",
    author: "Aditi Ramachandran",
    role: "Lead Architect, Chennai",
  },
  {
    quote:
      "Vensai's fluted panels and PolyGranites transformed our boutique hotel lobby. Their material quality and attention to detail are unrivaled in the market.",
    author: "Vikramaditya Mehta",
    role: "Principal Interior Designer, Bengaluru",
  },
  {
    quote:
      "From selecting soffits to installing acrylic laminates in our residence, the craftsmanship and tactile warmth of Vensai materials elevated our entire home.",
    author: "Priya & Rajesh Sharma",
    role: "Homeowners, Hyderabad",
  },
  {
    quote:
      "Working with Vensai Prime Interiors simplified our large-scale corporate project. Their team delivered custom acoustic baffles and stone surfaces right on schedule.",
    author: "Karan Johar",
    role: "Project Director, Apex Developers, Mumbai",
  },
];

function Testimonial() {
  const { openQuery } = useLead();
  const [active, setActive] = useState(0);

  const move = (direction: number) => {
    setActive((current) => (current + direction + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % testimonials.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [active]);

  const current = testimonials[active];

  return (
    <section className="bg-white px-6 py-20 md:px-14 md:py-28">
      <div className="mx-auto grid max-w-[1260px] gap-12 md:grid-cols-[0.72fr_1.6fr]">
        <div className="flex flex-col justify-between gap-10">
          <SectionLabel>What our clients say</SectionLabel>
          <button
            type="button"
            onClick={() => openQuery()}
            className="w-fit rounded-full bg-[#211c17] px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#5b4937]"
          >
            Start a project
          </button>
        </div>
        <div className="flex min-h-[280px] flex-col justify-between">
          <div>
            <Quote className="h-6 w-6 text-[#30271e]" strokeWidth={1.5} />
            <div key={active} className="transition-opacity duration-500 ease-out">
              <blockquote className="mt-5 max-w-3xl text-2xl font-normal leading-[1.15] tracking-[-0.045em] text-[#211d18] md:text-4xl">
                "{current.quote}"
              </blockquote>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#ddd6cb] pt-5">
            <div key={`author-${active}`} className="transition-opacity duration-500 ease-out">
              <p className="text-sm font-medium text-[#29231d]">{current.author}</p>
              <p className="mt-1 text-xs text-[#776e63]">{current.role}</p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-[#776e63]">
                0{active + 1} / 0{testimonials.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="Previous testimonial"
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#cdc4b7] text-[#211d18] transition-colors hover:bg-[#211d18] hover:text-white"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="Next testimonial"
                  className="grid h-9 w-9 place-items-center rounded-full border border-[#cdc4b7] text-[#211d18] transition-colors hover:bg-[#211d18] hover:text-white"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  "What types of wall panels do you offer?",
  "Are your surfaces suitable for commercial applications?",
  "Do you provide installation services?",
  "How do I maintain PolyGranite sheets?",
];
function FAQs() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-[#f8f6f1] px-6 py-20 md:px-14 md:py-28">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <SectionLabel>Useful details</SectionLabel>
          <h2 className="mt-5 text-3xl font-normal tracking-[-0.055em] text-[#29231d] md:text-5xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-10 border-t border-[#d5cdc1]">
          {faqs.map((faq, index) => (
            <div key={faq} className="border-b border-[#d5cdc1]">
              <button
                onClick={() => setOpen(open === index ? null : index)}
                className="flex w-full items-center justify-between py-5 text-left text-sm font-medium text-[#29231d]"
              >
                <span>{faq}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${open === index ? "rotate-180" : ""}`}
                />
              </button>
              {open === index && (
                <p className="max-w-xl pb-5 text-sm leading-relaxed text-[#71695e]">
                  Our team will help you select the right material, finish and installation method
                  for your project. Share your brief and we will guide you through the available
                  options.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const galleryItems = [
  {
    id: "villa-hyderabad",
    title: "Private Villa Living Lounge",
    category: "Residential" as const,
    location: "Jubilee Hills",
    city: "Hyderabad",
    image: clientVilla,
    productsUsed: [
      { name: "PolyGranites", slug: "polygranites" },
      { name: "Imported Marble", slug: "imported-marble" },
    ],
    description:
      "Book-matched PolyGranite sheets paired with warm recessed perimeter cove lighting created a seamless, high-gloss marble feature wall in a 5,000 sq.ft private residence.",
    year: "2025",
  },
  {
    id: "hotel-bengaluru",
    title: "Boutique Hotel Grand Reception",
    category: "Hospitality" as const,
    location: "Indiranagar",
    city: "Bengaluru",
    image: clientHotel,
    productsUsed: [
      { name: "WPC Louvers", slug: "wpc-panels" },
      { name: "PVC Fluted Panels", slug: "pvc-fluted-panels" },
    ],
    description:
      "Full-height vertical WPC timber louvers and custom champagne fluted panels installed behind the reception counter to give guests a tactile, welcoming aesthetic.",
    year: "2025",
  },
  {
    id: "office-chennai",
    title: "Corporate Executive Boardroom",
    category: "Corporate" as const,
    location: "OMR IT Corridor",
    city: "Chennai",
    image: clientOffice,
    productsUsed: [
      { name: "Timber Baffles", slug: "baffles" },
      { name: "Charcoal Panels", slug: "charcoal-panels" },
    ],
    description:
      "Suspended acoustic timber baffle system combined with deep matte chevron Charcoal accent wall panels for superior acoustic damping and sleek corporate styling.",
    year: "2024",
  },
  {
    id: "penthouse-mumbai",
    title: "Master Suite Headboard Wall",
    category: "Residential" as const,
    location: "Worli",
    city: "Mumbai",
    image: clientPenthouse,
    productsUsed: [
      { name: "PVC Fluted Panels", slug: "pvc-fluted-panels" },
      { name: "Acrylic Laminates", slug: "acrylic" },
    ],
    description:
      "Fine pitch vertical PVC fluted panels with brass metallic strip accents forming a dramatic full-wall bed headboard for a luxury penthouse suite.",
    year: "2025",
  },
  {
    id: "dining-hyderabad",
    title: "Luxury Residence & Courtyard",
    category: "Commercial" as const,
    location: "Banjara Hills",
    city: "Hyderabad",
    image: hero,
    productsUsed: [
      { name: "Luxury Wall Cladding", slug: "luxury-wall-cladding" },
      { name: "Exterior Soffits", slug: "soffits" },
    ],
    description:
      "Weather-resistant exterior soffit louvers and interior brass-inlaid luxury wall cladding creating a seamless indoor-outdoor architectural transition.",
    year: "2024",
  },
  {
    id: "lobby-gachibowli",
    title: "Luxury Executive Entrance Lobby",
    category: "Corporate" as const,
    location: "Financial District",
    city: "Hyderabad",
    image: luxuryWallCladding,
    productsUsed: [
      { name: "Luxury Wall Cladding", slug: "luxury-wall-cladding" },
      { name: "Imported Sculptures", slug: "imported-sculptures" },
    ],
    description:
      "Multi-textured acoustic louvers with precision brushed brass inlays installed across a double-height commercial tower entrance lobby.",
    year: "2025",
  },
  {
    id: "foyer-kavuri",
    title: "Bespoke Residence Foyer",
    category: "Residential" as const,
    location: "Kavuri Hills",
    city: "Hyderabad",
    image: importedMarble,
    productsUsed: [
      { name: "Imported Marble", slug: "imported-marble" },
      { name: "Decorative Artifacts", slug: "decorative-artifacts" },
    ],
    description:
      "Calacatta Italian natural marble slab flooring complemented by handcrafted bronze and ceramic sculptural centerpieces.",
    year: "2025",
  },
  {
    id: "studio-sadashivnagar",
    title: "Architecture Studio Niche",
    category: "Commercial" as const,
    location: "Sadashivnagar",
    city: "Bengaluru",
    image: decorativeArtifacts,
    productsUsed: [
      { name: "Decorative Artifacts", slug: "decorative-artifacts" },
      { name: "Mosaic Tiles", slug: "mosaic-tiles" },
    ],
    description:
      "Custom geometric mosaic wall backing with hand-sculpted artisan bronze centerpieces in an exclusive interior architecture studio.",
    year: "2024",
  },
];

type GalleryCategory = "All" | "Residential" | "Hospitality" | "Corporate" | "Commercial";

function ClientGallery() {
  const { openQuery } = useLead();
  const [selectedCategory, setSelectedCategory] = useState<GalleryCategory>("All");
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const filteredItems = galleryItems.filter(
    (item) => selectedCategory === "All" || item.category === selectedCategory
  );

  const activeItem = activeItemIndex !== null ? filteredItems[activeItemIndex] : null;

  const handleNext = () => {
    if (activeItemIndex === null) return;
    setActiveItemIndex((activeItemIndex + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    if (activeItemIndex === null) return;
    setActiveItemIndex((activeItemIndex - 1 + filteredItems.length) % filteredItems.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeItemIndex === null) return;
      if (e.key === "Escape") setActiveItemIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeItemIndex, filteredItems.length]);

  return (
    <section className="bg-[#1c1712] px-6 py-20 text-white md:px-14 md:py-28">
      <div className="mx-auto max-w-[1260px]">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-white/20 pb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel dark>Client Installations & Locations</SectionLabel>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.055em] text-white md:text-5xl">
              Our materials in live spaces.
            </h2>
            <p className="mt-3 max-w-lg text-sm text-white/70">
              Explore real-world client site installations across luxury villas, boutique hotels, and executive corporate headquarters.
            </p>
          </div>

          {/* Filter Categories */}
          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Residential", "Hospitality", "Corporate", "Commercial"] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveItemIndex(null);
                  }}
                  className={`rounded-full px-4 py-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] transition-colors ${
                    selectedCategory === cat
                      ? "bg-white text-[#1c1712]"
                      : "border border-white/30 text-white/75 hover:border-white hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => setActiveItemIndex(idx)}
              className="group relative cursor-pointer overflow-hidden rounded-lg bg-[#27211a] border border-white/10 transition-all duration-500 hover:border-white/40 hover:shadow-2xl"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={`${item.title} at ${item.location}, ${item.city}`}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14100c] via-[#14100c]/30 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

                {/* Top Location & Category Badges */}
                <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[0.6rem] font-mono text-white/90 border border-white/20">
                    <MapPin size={10} className="text-[#d8c2a3]" />
                    {item.location}, {item.city}
                  </span>
                  <span className="rounded-full bg-white/15 backdrop-blur-md px-2.5 py-1 text-[0.55rem] font-medium uppercase tracking-wider text-white">
                    {item.category}
                  </span>
                </div>

                {/* Hover Expand Icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[0.65rem] font-medium uppercase tracking-wider text-[#1c1712] shadow-lg">
                    <Expand size={13} /> View Project
                  </span>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-5">
                <h3 className="text-base font-medium tracking-tight text-white group-hover:text-[#eee4d8] transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-white/60 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
                  <span className="text-[0.6rem] uppercase tracking-wider text-white/40">Products:</span>
                  {item.productsUsed.map((prod) => (
                    <span
                      key={prod.slug}
                      className="rounded bg-white/10 px-2 py-0.5 text-[0.6rem] text-white/80"
                    >
                      {prod.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-xl border border-white/15 bg-white/5 p-8 backdrop-blur-sm md:flex-row">
          <div>
            <h4 className="text-xl font-normal text-white">Installing surfaces for a commercial or residential space?</h4>
            <p className="mt-1 text-xs text-white/65">
              Request material samples, project site measurements, or talk with our surface architects.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openQuery()}
            className="shrink-0 rounded-full bg-white px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#1c1712] transition-colors hover:bg-[#eee4d8]"
          >
            Request Site Visit / Samples
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          {/* Backdrop Overlay Click to Close */}
          <div
            className="absolute inset-0"
            onClick={() => setActiveItemIndex(null)}
          />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-[#1c1712] shadow-2xl md:flex-row">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setActiveItemIndex(null)}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/60 text-white border border-white/20 transition-colors hover:bg-white hover:text-black"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Left Image Section */}
            <div className="relative flex min-h-[320px] flex-1 items-center justify-center bg-black/50 md:min-h-[500px]">
              <img
                src={activeItem.image}
                alt={activeItem.title}
                className="h-full w-full object-contain max-h-[70vh]"
              />

              {/* Prev / Next Nav Buttons inside Lightbox */}
              {filteredItems.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white border border-white/20 transition-colors hover:bg-white hover:text-black"
                    aria-label="Previous project"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white border border-white/20 transition-colors hover:bg-white hover:text-black"
                    aria-label="Next project"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>

            {/* Right Details Panel */}
            <div className="flex w-full flex-col justify-between p-6 md:w-[380px] md:p-8 border-t md:border-t-0 md:border-l border-white/15 bg-[#211b15]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-wider text-white">
                    {activeItem.category}
                  </span>
                  <span className="text-[0.65rem] font-mono text-white/50">{activeItem.year}</span>
                </div>

                <h3 className="mt-4 text-2xl font-normal tracking-tight text-white">
                  {activeItem.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-[#d8c2a3] font-mono">
                  <MapPin size={13} />
                  <span>{activeItem.location}, {activeItem.city}</span>
                </div>

                <p className="mt-5 text-xs leading-relaxed text-white/75 border-t border-white/10 pt-4">
                  {activeItem.description}
                </p>

                {/* Products Installed */}
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h4 className="text-[0.65rem] font-medium uppercase tracking-widest text-white/50">
                    Products & Finishes Installed
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activeItem.productsUsed.map((prod) => (
                      <Link
                        key={prod.slug}
                        to="/products"
                        onClick={() => setActiveItemIndex(null)}
                        className="group inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white hover:text-[#1c1712]"
                      >
                        <span>{prod.name}</span>
                        <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-white/10 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveItemIndex(null);
                    openQuery();
                  }}
                  className="w-full rounded-full bg-white py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#1c1712] transition-colors hover:bg-[#eee4d8]"
                >
                  Inquire About This Look
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Home() {
  return (
    <main>
      <Hero />
      <Products />
      <Bestsellers />
      <Story />
      <ClientGallery />
      <Testimonial />
      <FAQs />
    </main>
  );
}
