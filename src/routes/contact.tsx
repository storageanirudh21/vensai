import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Vensai Prime Interiors — Studios & Quotes" },
      {
        name: "description",
        content:
          "Request a quote, book a studio visit or order swatches. Vensai Prime Interiors studios in Chennai, Bengaluru and Hyderabad.",
      },
      { property: "og:title", content: "Contact Vensai Prime Interiors — Studios & Quotes" },
      {
        property: "og:description",
        content: "Talk to a specifier about panels, cladding and surfaces for your project.",
      },
    ],
  }),
  component: ContactPage,
});

const studios = [
  { city: "Chennai", line: "No. 14, Poonamallee High Road, Kilpauk" },
  { city: "Bengaluru", line: "212, 100 Feet Road, Indiranagar" },
  { city: "Hyderabad", line: "8-2-120, Road No. 2, Banjara Hills" },
];

function ContactPage() {
  const [sending, setSending] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <Reveal>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl leading-none md:text-7xl">
          Tell us about the space.
        </h1>
      </Reveal>

      <div className="mt-16 grid gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <form
            className="grid gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSending(true);
              setTimeout(() => {
                setSending(false);
                (e.target as HTMLFormElement).reset();
                toast.success("Enquiry sent", { description: "A specifier will reply within one business day." });
              }, 700);
            }}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required className="rounded-sm" placeholder="Your name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required className="rounded-sm" placeholder="you@studio.com" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project">Project location</Label>
              <Input id="project" name="project" className="rounded-sm" placeholder="City / site address" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">What are you specifying?</Label>
              <Textarea
                id="message"
                name="message"
                rows={6}
                className="rounded-sm"
                placeholder="Areas, finishes, timelines…"
              />
            </div>
            <Button type="submit" size="lg" disabled={sending} className="justify-self-start rounded-sm px-10">
              {sending ? "Sending…" : "Send enquiry"}
            </Button>
          </form>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-8 border-l pl-8">
            <div>
              <h2 className="eyebrow">Direct</h2>
              <p className="mt-4 flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-accent" strokeWidth={1.4} /> +91 98400 12345
              </p>
              <p className="mt-3 flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-accent" strokeWidth={1.4} /> hello@vensai.in
              </p>
            </div>
            <div>
              <h2 className="eyebrow">Studios</h2>
              <ul className="mt-4 space-y-5">
                {studios.map((s) => (
                  <li key={s.city} className="flex gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.4} />
                    <span>
                      <span className="block text-sm">{s.city}</span>
                      <span className="block text-sm text-muted-foreground">{s.line}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="eyebrow">Hours</h2>
              <p className="mt-4 text-sm text-muted-foreground">Mon – Sat · 10:00 to 19:00</p>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
