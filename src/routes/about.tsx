import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import hero from "@/assets/hero-interior.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import { useLead } from "@/lib/lead";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Vensai Prime Interiors — Surface Specialists" },
      {
        name: "description",
        content:
          "Vensai Prime Interiors has supplied architectural panels and surfaces since 2009, with works in Chennai, Hyderabad, Bengaluru and delivery across India.",
      },
    ],
  }),
  component: AboutPage,
});

function SectionLabel({ children, dark = false }: { children: string; dark?: boolean }) {
  return (
    <p
      className={`flex items-center gap-2 text-[0.62rem] font-medium uppercase tracking-[0.13em] ${
        dark ? "text-white/65" : "text-[#5b554c]"
      }`}
    >
      <span className={`h-1 w-1 rounded-full ${dark ? "bg-white" : "bg-[#3d382f]"}`} />
      {children}
    </p>
  );
}

const timeline = [
  {
    year: "2009",
    title: "Workshop Established",
    text: "Founded in Chennai as an architectural cladding and surface specification workshop.",
  },
  {
    year: "2014",
    title: "PolyGranite & Louvers",
    text: "Imported and locally color-matched first PolyGranite and WPC louver collections.",
  },
  {
    year: "2019",
    title: "Studio Expansion",
    text: "Opened trade experience centers in Bengaluru (Koramangala) and Hyderabad (Banjara Hills).",
  },
  {
    year: "2024",
    title: "Digital Catalogue & Swatches",
    text: "Launched full digital specification catalogue with 48-hour nationwide sample dispatch.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Specifiers First",
    desc: "Every panel is selected for durability, zero warping, and exact tone consistency across batches.",
  },
  {
    icon: Truck,
    title: "Elevation-Sequenced Crate Delivery",
    desc: "Panels arrive cut, tagged, and packed by wall reference so your site crew opens one crate per room.",
  },
  {
    icon: Sparkles,
    title: "In-Stock Guarantee",
    desc: "Every finish featured in our catalogue is held in inventory for predictable project timelines.",
  },
];

function AboutPage() {
  const { openQuery } = useLead();

  return (
    <main className="bg-[#f8f6f1]">
      {/* 1. Hero Section (Matching Homepage Dark Hero Style) */}
      <section className="relative min-h-[580px] overflow-hidden bg-[#1c1712] text-white">
        <img
          src={hero2}
          alt="Vensai interior craftsmanship"
          className="absolute inset-0 h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1712] via-[#1c1712]/70 to-transparent" />

        <div className="relative mx-auto flex min-h-[580px] max-w-[1440px] flex-col justify-center px-6 py-24 sm:px-8 md:px-14">
          <SectionLabel dark>About Vensai Prime</SectionLabel>
          <h1 className="mt-8 max-w-4xl font-sans text-[2.6rem] font-normal leading-[0.96] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            A surface is the first thing a room says.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80">
            Vensai Prime Interiors specifies, crafts, and delivers architectural panels, WPC louvers, PolyGranites, and luxury stone sheets for modern spaces across India.
          </p>
        </div>
      </section>

      {/* 2. Full Width Feature Image Showcase */}
      <section className="relative mx-auto max-w-[1260px] px-6 -mt-16 md:-mt-20 z-10">
        <div className="aspect-[21/9] overflow-hidden rounded-2xl border border-[#d5cdc1] shadow-2xl bg-[#ddd1c0]">
          <img
            src={hero}
            alt="Vensai architectural panelled interior"
            className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
          />
        </div>
      </section>

      {/* 3. Story & Craft Philosophy (Matching Homepage Split Layout) */}
      <section className="px-6 py-20 md:px-14 md:py-28">
        <div className="mx-auto max-w-[1260px]">
          <div className="grid gap-12 border-b border-[#d5cdc1] pb-16 md:grid-cols-[1fr_1.35fr]">
            <SectionLabel>Our Philosophy</SectionLabel>
            <div>
              <h2 className="max-w-2xl text-3xl font-normal leading-[1.05] tracking-[-0.055em] text-[#29241e] md:text-5xl">
                We are specifiers first and suppliers second.
              </h2>
              <p className="mt-6 text-sm leading-relaxed text-[#6c6458]">
                Drawings arrive, we mark up. Panels are cut, dry-fitted and tagged by wall reference, then packed in install sequence so your site crew opens one crate per elevation. It sounds obvious. Almost nobody does it.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-[#6c6458]">
                Every finish in the catalogue is held in stock, so the exact tone and texture you sample is the exact batch that arrives on your site.
              </p>
            </div>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid gap-8 pt-12 sm:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="border-b border-[#d5cdc1] pb-8">
                <v.icon className="h-6 w-6 text-[#755c3b]" strokeWidth={1.5} />
                <h3 className="mt-4 text-lg font-medium text-[#29241e]">{v.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-[#6c6458]">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Timeline Section (Matching Bestsellers / Off-white Background) */}
      <section className="bg-[#eee8de] px-6 py-20 md:px-14 md:py-28">
        <div className="mx-auto max-w-[1260px]">
          <div className="border-b border-[#cbc1b2] pb-8">
            <SectionLabel>Our Journey</SectionLabel>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.055em] text-[#29231d] md:text-5xl">
              15 Years of Surface Innovation
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((item) => (
              <div key={item.year} className="flex flex-col justify-between border-t border-[#cbc1b2] pt-6">
                <div>
                  <span className="font-mono text-3xl font-light text-[#755c3b]">{item.year}</span>
                  <h3 className="mt-3 text-sm font-medium tracking-tight text-[#29231d]">{item.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#6a6154]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Dark Featured Story Section (Matching Homepage Story Section) */}
      <section className="grid bg-[#211d18] text-white lg:grid-cols-2">
        <div className="relative min-h-[480px] overflow-hidden">
          <img
            src={hero3}
            alt="Vensai material detail"
            className="absolute inset-0 h-full w-full object-cover opacity-75"
          />
          <div className="absolute inset-0 bg-[#211d18]/45" />
          <p className="absolute bottom-8 left-8 max-w-xs text-xs leading-relaxed text-white/85 md:bottom-12 md:left-14">
            Every project begins with material samples, scale drawings, and a clear understanding of how the finish lives in the room.
          </p>
        </div>

        <div className="flex min-h-[480px] flex-col justify-between p-8 md:p-14">
          <SectionLabel dark>Designed Around Architecture</SectionLabel>
          <div>
            <h2 className="max-w-md text-3xl font-normal leading-[1.03] tracking-[-0.055em] md:text-5xl">
              Create spaces that feel warm, balanced, and complete.
            </h2>
            <p className="mt-5 max-w-md text-xs leading-relaxed text-white/70">
              Explore our full catalogue of WPC louvers, PolyGranite stone sheets, fluted panels, and acoustic baffles engineered for Indian interiors.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 rounded-full bg-white px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[#221c17] transition-colors hover:bg-[#eadfce]"
              >
                Browse Catalogue <ArrowRight size={14} />
              </Link>
              <button
                type="button"
                onClick={() => openQuery("Sample Request from About")}
                className="inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 cursor-pointer"
              >
                Request Swatch Box
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Bottom CTA Section */}
      <section className="bg-[#f8f6f1] px-6 py-20 md:px-14 md:py-24 text-center border-t border-[#d5cdc1]">
        <div className="mx-auto max-w-3xl">
          <SectionLabel>Start a conversation</SectionLabel>
          <h2 className="mt-5 text-3xl font-normal tracking-[-0.055em] text-[#29241e] md:text-5xl">
            Working on an interior project?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#6c6458]">
            Share your drawings or surface requirements with our specification team. We will guide you through sample selection and crate logistics.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              to="/contact"
              className="rounded-full bg-[#211c17] px-8 py-3.5 text-[0.65rem] font-medium uppercase tracking-[0.14em] text-white hover:bg-[#5b4937] transition-colors"
            >
              Contact Showroom
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
