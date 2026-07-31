import { createFileRoute, Link } from "@tanstack/react-router";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import hero from "@/assets/hero-interior.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Vensai Prime Interiors — Surface Specialists" },
      {
        name: "description",
        content:
          "Vensai Prime Interiors has supplied architectural panels and surfaces since 2009, with works in Chennai and delivery across India.",
      },
      { property: "og:title", content: "About Vensai Prime Interiors — Surface Specialists" },
      {
        property: "og:description",
        content: "Fourteen years of architectural surfaces, dry-fitted and delivered in install sequence.",
      },
    ],
  }),
  component: AboutPage,
});

const timeline = [
  ["2009", "Founded in Chennai as a two-person cladding workshop."],
  ["2014", "First PolyGranite line imported and colour-matched locally."],
  ["2019", "Bengaluru and Hyderabad studios open to trade partners."],
  ["2024", "Digital catalogue launched with nationwide sample dispatch."],
];

function AboutPage() {
  return (
    <div>
      <section className="mx-auto max-w-7xl px-5 pt-16 pb-14 md:px-8 md:pt-24">
        <Reveal>
          <p className="eyebrow">About us</p>
          <h1 className="mt-3 max-w-3xl font-display text-5xl leading-[0.98] md:text-7xl">
            A surface is the first thing a room says.
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
            Vensai Prime Interiors supplies the panels, cladding and stone-look sheets behind some of India's
            most considered interiors. We are specifiers first and suppliers second.
          </p>
        </Reveal>
      </section>

      <Reveal className="media-zoom mx-auto max-w-7xl px-5 md:px-8">
        <div className="aspect-[21/9] overflow-hidden rounded-sm">
          <img
            src={hero}
            alt="Vensai panelled interior with warm daylight"
            loading="lazy"
            width={1600}
            height={1008}
            className="h-full w-full object-cover"
          />
        </div>
      </Reveal>

      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-14 md:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-4xl leading-tight">How we work</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Drawings arrive, we mark up. Panels are cut, dry-fitted and tagged by wall reference, then packed
              in install sequence so the crew opens one crate per elevation. It sounds obvious. Almost nobody
              does it.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Every finish in the catalogue is held in stock, so the tone you sample is the tone that ships.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ol className="divide-y border-t">
              {timeline.map(([year, text]) => (
                <li key={year} className="grid grid-cols-[auto_1fr] gap-6 py-6">
                  <span className="font-display text-2xl text-accent">{year}</span>
                  <span className="text-sm leading-relaxed text-muted-foreground">{text}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="border-t bg-secondary/30">
        <div className="mx-auto max-w-7xl px-5 py-20 text-center md:px-8">
          <Reveal>
            <h2 className="font-display text-4xl md:text-5xl">Working on something?</h2>
            <Button asChild size="lg" className="mt-8 rounded-sm px-10">
              <Link to="/contact">Start a conversation</Link>
            </Button>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
