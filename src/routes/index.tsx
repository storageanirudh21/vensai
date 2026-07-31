import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Quote,
} from "lucide-react";
import { useEffect, useState } from "react";
import hero from "@/assets/hero-interior.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { products } from "@/lib/products";
import { useLead } from "@/lib/lead";

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

function ProductCard({ product, index }: { product: (typeof products)[number]; index: number }) {
  return (
    <Link to="/products/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd1c0]">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
        />
        {index === 0 && (
          <span className="absolute left-3 top-3 border border-white/60 bg-[#261b14]/70 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white">
            Selected
          </span>
        )}
      </div>
      <div className="border-b border-[#cdc4b7] py-3">
        <p className="text-[0.56rem] font-medium uppercase tracking-[0.15em] text-[#776f63]">
          {product.collection}
        </p>
        <div className="mt-1 flex items-center justify-between gap-4">
          <h3 className="text-sm font-medium tracking-[-0.025em] text-[#27221c]">{product.name}</h3>
          <ArrowUpRight size={14} className="text-[#776f63] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </Link>
  );
}

function Products() {
  return (
    <section className="bg-[#f8f6f1] px-6 py-20 md:px-14 md:py-28">
      <div className="mx-auto max-w-[1260px]">
        <div className="grid gap-10 border-b border-[#d5cdc1] pb-12 md:grid-cols-[1fr_1.35fr]">
          <SectionLabel>Our collections</SectionLabel>
          <div>
            <h2 className="max-w-xl text-3xl font-normal leading-[1.05] tracking-[-0.055em] text-[#29241e] md:text-5xl">
              Surfaces designed to become part of the room.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#6c6458]">
              A practical collection of high-performance finishes selected for their depth,
              durability and calm material character.
            </p>
          </div>
        </div>
        <div className="grid gap-5 pt-7 sm:grid-cols-3">
          {featured.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
        <div className="mt-9 flex justify-between border-b border-[#d5cdc1] pb-5">
          <Link
            to="/products"
            className="rounded-full bg-[#211c17] px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white hover:bg-[#5b4937]"
          >
            View all collections
          </Link>
          <span className="hidden text-xs text-[#756d62] md:block">
            Panels · Surfaces · Marble · Artifacts
          </span>
        </div>
      </div>
    </section>
  );
}

function Bestsellers() {
  const bestsellers = products.slice(3, 7);
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
        <div className="-mr-6 mt-7 flex gap-4 overflow-x-auto pb-3 pr-6 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pr-0 lg:grid-cols-4">
          {bestsellers.map((product, index) => (
            <div key={product.slug} className="w-[72vw] shrink-0 sm:w-auto">
              <ProductCard product={product} index={index + 1} />
            </div>
          ))}
        </div>
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

function Home() {
  return (
    <main>
      <Hero />
      <Products />
      <Bestsellers />
      <Story />
      <Testimonial />
      <FAQs />
    </main>
  );
}
