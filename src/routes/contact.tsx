import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, Mail, MapPin, Phone, Send } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero-interior.jpg";
import { useLead } from "@/lib/lead";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Vensai Prime Interiors — Experience Centers & Quotes" },
      {
        name: "description",
        content:
          "Request a quote, book an experience center visit or order material swatches. Vensai Prime Interiors studios in Chennai, Bengaluru and Hyderabad.",
      },
    ],
  }),
  component: ContactPage,
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

const studios = [
  {
    city: "Chennai Flagship Studio",
    address: "No. 14, Poonamallee High Road, Kilpauk, Chennai 600010",
    phone: "+91 90590 99792",
  },
  {
    city: "Bengaluru Experience Center",
    address: "212, 100 Feet Road, Indiranagar, Bengaluru 560038",
    phone: "+91 90590 99792",
  },
  {
    city: "Hyderabad Studio",
    address: "8-2-120, Road No. 2, Banjara Hills, Hyderabad 500034",
    phone: "+91 90590 99792",
  },
];

function ContactPage() {
  const { openVisit } = useLead();
  const [sending, setSending] = useState(false);

  return (
    <main className="bg-[#f8f6f1]">
      {/* 1. Hero Section (Matching Homepage Dark Hero Style) */}
      <section className="relative min-h-[500px] overflow-hidden bg-[#1c1712] text-white">
        <img
          src={hero}
          alt="Vensai experience studio"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1c1712] via-[#1c1712]/75 to-transparent" />

        <div className="relative mx-auto flex min-h-[500px] max-w-[1440px] flex-col justify-center px-6 py-20 sm:px-8 md:px-14">
          <SectionLabel dark>Connect With Vensai</SectionLabel>
          <h1 className="mt-8 max-w-3xl font-sans text-[2.6rem] font-normal leading-[0.96] tracking-[-0.065em] sm:text-6xl lg:text-7xl">
            Tell us about your space.
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80">
            Talk to an interior surface specifier, request custom swatch samples, or book a guided visit to our experience centers.
          </p>
        </div>
      </section>

      {/* 2. Main Contact Form & Experience Centers Section */}
      <section className="px-6 py-20 md:px-14 md:py-28">
        <div className="mx-auto max-w-[1260px]">
          <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr]">
            {/* Form Column */}
            <div className="rounded-3xl border border-[#d5cdc1] bg-white p-8 md:p-12 shadow-xl">
              <SectionLabel>Specification Form</SectionLabel>
              <h2 className="mt-4 text-2xl font-normal tracking-[-0.04em] text-[#29241e] sm:text-3xl">
                Send a Project Inquiry
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-[#6c6458]">
                Fill in your project details below. Our team will review your requirements and respond within one business day.
              </p>

              <form
                className="mt-8 grid gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSending(true);
                  setTimeout(() => {
                    setSending(false);
                    (e.target as HTMLFormElement).reset();
                    toast.success("Enquiry received", {
                      description: "A surface specifier will contact you within one business day.",
                    });
                  }, 700);
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <label htmlFor="contact-name" className="text-xs font-semibold text-[#29241e]">
                      Full Name *
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      required
                      placeholder="e.g. Aditi Ramachandran"
                      className="rounded-xl border border-[#d5cdc1] bg-[#fcfaf5] px-4 py-3 text-xs text-[#29241e] placeholder-[#a09788] focus:border-[#755c3b] focus:outline-none"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label htmlFor="contact-phone" className="text-xs font-semibold text-[#29241e]">
                      Mobile / Phone *
                    </label>
                    <input
                      id="contact-phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+91 98400 12345"
                      className="rounded-xl border border-[#d5cdc1] bg-[#fcfaf5] px-4 py-3 text-xs text-[#29241e] placeholder-[#a09788] focus:border-[#755c3b] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="contact-location" className="text-xs font-semibold text-[#29241e]">
                    Project Location / City
                  </label>
                  <input
                    id="contact-location"
                    name="location"
                    placeholder="e.g. Chennai, Bengaluru"
                    className="rounded-xl border border-[#d5cdc1] bg-[#fcfaf5] px-4 py-3 text-xs text-[#29241e] placeholder-[#a09788] focus:border-[#755c3b] focus:outline-none"
                  />
                </div>

                <div className="grid gap-1.5">
                  <label htmlFor="contact-message" className="text-xs font-semibold text-[#29241e]">
                    What surfaces are you specifying? *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={5}
                    placeholder="Describe your project, required materials (WPC louvers, PolyGranites, baffles), area in sq.ft, or timelines…"
                    className="rounded-xl border border-[#d5cdc1] bg-[#fcfaf5] px-4 py-3 text-xs text-[#29241e] placeholder-[#a09788] focus:border-[#755c3b] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-[#211c17] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all hover:bg-[#5b4937] cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sending ? "Submitting..." : "Send Specification Inquiry"}</span>
                </button>
              </form>
            </div>

            {/* Right Column: Direct Info & Experience Centers */}
            <div className="flex flex-col gap-8">
              {/* Direct Info Card */}
              <div className="rounded-3xl border border-[#cbc1b2] bg-[#eee8de] p-8">
                <SectionLabel>Direct Contact</SectionLabel>
                <div className="mt-6 space-y-4 text-xs text-[#29241e]">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#755c3b]" />
                    <div>
                      <p className="font-semibold">Hotline & WhatsApp</p>
                      <a href="tel:+919840012345" className="text-[#6c6458] hover:underline">
                        +91 98400 12345
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#755c3b]" />
                    <div>
                      <p className="font-semibold">Architectural Desk</p>
                      <a href="mailto:hello@vensai.in" className="text-[#6c6458] hover:underline">
                        hello@vensai.in
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-[#755c3b]" />
                    <div>
                      <p className="font-semibold">Operating Hours</p>
                      <p className="text-[#6c6458]">Monday – Saturday · 10:00 AM to 7:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience Centers List Card */}
              <div className="rounded-3xl bg-[#211d18] text-white p-8">
                <SectionLabel dark>Experience Centers</SectionLabel>
                <h3 className="mt-4 text-xl font-normal tracking-tight">Visit Our Showrooms</h3>

                <div className="mt-6 space-y-6">
                  {studios.map((s) => (
                    <div key={s.city} className="border-b border-white/15 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-white">
                        <MapPin className="h-4 w-4 text-[#c69c63]" />
                        <span>{s.city}</span>
                      </div>
                      <p className="mt-1 text-xs text-white/70 leading-relaxed pl-6">{s.address}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => openVisit()}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-white px-6 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#211d18] transition-colors hover:bg-[#eee4d8] cursor-pointer"
                >
                  Book Showroom Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
