import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, Search, Sparkles } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { getBrochures } from "@/services/brochureService";
import { subscribeToProducts } from "@/services/productService";
import { Brochure, Product } from "@/types/catalogue";

export const Route = createFileRoute("/catalogues")({
  head: () => ({
    meta: [
      { title: "Catalogues & Brochures | Vensai Prime Interiors" },
      {
        name: "description",
        content:
          "Download official product catalogues, technical specification sheets, and lookbooks for Vensai wall panels, PolyGranites, baffles, and acoustic surfaces.",
      },
      { property: "og:title", content: "Catalogues & Brochures | Vensai Prime Interiors" },
    ],
  }),
  component: CataloguesPage,
});

function CataloguesPage() {
  const [dbBrochures, setDbBrochures] = useState<Brochure[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getBrochures(true);
        if (isMounted && data && data.length > 0) {
          setDbBrochures(data);
        }
      } catch (err) {
        console.warn("Could not fetch brochures from Firebase:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    // Also collect product-attached brochures from Firebase
    const unsubProducts = subscribeToProducts((prods) => {
      if (!isMounted) return;
      const productPdfs: Brochure[] = prods
        .filter((p) => p.brochure && p.brochure.fileUrl)
        .map((p) => ({
          id: `prod-brochure-${p.id}`,
          title: p.brochure?.title || `${p.name} Specification Sheet`,
          categoryName: p.categoryName || "Product Spec",
          fileUrl: p.brochure!.fileUrl,
          fileSize: p.brochure?.fileSize || "PDF File",
          description: `Official technical specification PDF for ${p.name} (${p.categoryName || "Surface"}).`,
          status: "active",
        }));

      if (productPdfs.length > 0) {
        setDbBrochures((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newItems = productPdfs.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }
      setLoading(false);
    }, null);

    return () => {
      isMounted = false;
      unsubProducts();
    };
  }, []);

  const displayList = dbBrochures;

  const categories = ["All", ...Array.from(new Set(displayList.map((b) => b.categoryName || "General")))];

  const filteredCatalogues = displayList.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.categoryName === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.categoryName && item.categoryName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24 min-h-[85vh]">
      <Reveal>
        <div className="flex flex-col gap-4 border-b border-[#d5cdc1]/60 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Downloads & Specs</p>
            <h1 className="mt-3 font-display text-5xl leading-none md:text-7xl">Catalogues</h1>
            <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
              Download complete PDF product brochures, technical data sheets, and design guides for specifying Vensai interior surface collections.
            </p>
          </div>
         
        </div>
      </Reveal>

      {/* Filter & Search Bar */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none sm:pb-0 sm:flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] font-medium transition-all cursor-pointer border ${
                selectedCategory === cat
                  ? "bg-[#181512] text-white border-[#181512] shadow-xs"
                  : "bg-[#FAF8F5] text-[#6b6255] border-[#E5E2DC] hover:border-[#181512] hover:text-[#181512]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search brochures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-[#E5E2DC] bg-[#FAF8F5] py-2 pl-9 pr-4 text-xs placeholder:text-muted-foreground focus:border-[#181512] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Catalogues Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-neutral-200 p-6 space-y-4 bg-neutral-50/50">
              <Skeleton className="h-10 w-10 rounded-xl bg-neutral-200" />
              <Skeleton className="h-6 w-3/4 bg-neutral-200" />
              <Skeleton className="h-12 w-full bg-neutral-200" />
              <Skeleton className="h-10 w-full rounded-full bg-neutral-200" />
            </div>
          ))
        ) : filteredCatalogues.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-muted-foreground font-mono">
            No catalogues found matching "{searchQuery}".
          </div>
        ) : (
          filteredCatalogues.map((item) => (
            <div
              key={item.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-[#E5E2DC] bg-[#FAF8F5]/80 p-6 transition-all duration-300 hover:border-[#5b4937]/30 hover:bg-white hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#f0ece5] text-[#5b4937]">
                    <FileText className="h-6 w-6" />
                  </div>
                  {item.categoryName && (
                    <span className="rounded-full bg-[#f0e8de] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#5b4937]">
                      {item.categoryName}
                    </span>
                  )}
                </div>

                <h3 className="mt-5 font-display text-xl font-medium leading-snug text-[#29241e] group-hover:text-black">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="mt-2 text-xs leading-relaxed text-[#6c6458] line-clamp-3">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="mt-8 border-t border-[#E5E2DC] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    {item.fileSize || "PDF Document"}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d5cdc1] bg-white px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-[#5b4937] transition-all hover:border-[#5b4937] hover:bg-[#5b4937] hover:text-white"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>View</span>
                    </a>

                    <a
                      href={item.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full bg-[#181512] px-4 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-white transition-all hover:bg-[#5b4937] shadow-xs"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
