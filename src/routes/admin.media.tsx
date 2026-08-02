import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category, Product, Brochure } from "@/types/catalogue";
import { Search, Image as ImageIcon, FileText, ExternalLink, Link as LinkIcon, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/media")({
  component: AdminMediaPage,
});

interface MediaItem {
  id: string;
  url: string;
  storagePath: string;
  fileName: string;
  type: "image" | "pdf";
  size?: string;
  associatedWith: string; // Product name or Category name
  associationUrl: string; // Edit page link
}

function AdminMediaPage() {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "pdf">("all");

  useEffect(() => {
    async function loadMedia() {
      try {
        setLoading(true);
        const [catsSnap, prodsSnap, brosSnap] = await Promise.all([
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "brochures"))
        ]);

        const items: MediaItem[] = [];

        // 1. Parse Category cover images
        catsSnap.docs.forEach(doc => {
          const cat = doc.data() as Category;
          if (cat.coverImage?.url) {
            items.push({
              id: `${doc.id}-cover`,
              url: cat.coverImage.url,
              storagePath: cat.coverImage.storagePath,
              fileName: cat.coverImage.storagePath.split("/").pop() || "cover_image",
              type: "image",
              associatedWith: `Category: ${cat.name}`,
              associationUrl: `/admin/categories/${doc.id}`
            });
          }
        });

        // 2. Parse Product images
        prodsSnap.docs.forEach(doc => {
          const p = doc.data() as Product;
          if (p.primaryImage?.url) {
            items.push({
              id: `${doc.id}-primary`,
              url: p.primaryImage.url,
              storagePath: p.primaryImage.storagePath,
              fileName: p.primaryImage.storagePath.split("/").pop() || "primary_image",
              type: "image",
              associatedWith: `Product: ${p.name} (Primary)`,
              associationUrl: `/admin/products/${doc.id}`
            });
          }
          if (p.images && p.images.length > 0) {
            p.images.forEach((img, idx) => {
              // Skip if it is the primary image to avoid duplicate list
              if (img.storagePath === p.primaryImage?.storagePath) return;
              items.push({
                id: `${doc.id}-img-${idx}`,
                url: img.url,
                storagePath: img.storagePath,
                fileName: img.storagePath.split("/").pop() || `product_image_${idx}`,
                type: "image",
                associatedWith: `Product: ${p.name}`,
                associationUrl: `/admin/products/${doc.id}`
              });
            });
          }
        });

        // 3. Parse Brochures
        brosSnap.docs.forEach(doc => {
          const bro = doc.data() as Brochure;
          const sizeKb = bro.fileSize ? `${Math.round(bro.fileSize / 1024)} KB` : undefined;
          items.push({
            id: doc.id,
            url: bro.fileUrl,
            storagePath: bro.storagePath,
            fileName: bro.fileName,
            type: "pdf",
            size: sizeKb,
            associatedWith: `Brochure: ${bro.title}`,
            associationUrl: `/admin/brochures`
          });
        });

        setMedia(items);
      } catch (error) {
        toast.error("Failed to compile media library");
      } finally {
        setLoading(false);
      }
    }

    loadMedia();
  }, []);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("File link copied to clipboard");
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.fileName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.associatedWith.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#121212] md:text-4xl">Media Library</h1>
        <p className="text-sm text-[#776E63]">Browse, filter, and inspect files currently in use across the catalog.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search filenames or association..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-[#E5E2DC] rounded-sm focus-visible:ring-[#8B7D6B] text-xs"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {(["all", "image", "pdf"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors ${
                typeFilter === type
                  ? "border-[#211C17] bg-[#211C17] text-white"
                  : "border-[#E5E2DC] text-[#776E63] hover:border-[#211C17] hover:text-[#211C17]"
              }`}
            >
              {type}s
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg bg-neutral-100" />
          ))}
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-xs text-muted-foreground font-mono">
          <Info className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          No media files matching criteria found.
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredMedia.map((item) => (
            <Card key={item.id} className="rounded-lg border-[#E5E2DC] overflow-hidden bg-white shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="relative aspect-square w-full bg-neutral-50 border-b flex items-center justify-center overflow-hidden">
                {item.type === "image" ? (
                  <img src={item.url} alt={item.fileName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <FileText className="h-10 w-10 text-[#8B7D6B]/60" />
                    <span className="text-[10px] font-mono text-[#776E63] uppercase">PDF Document</span>
                  </div>
                )}
                
                {/* Float hover options */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  <Button
                    type="button"
                    size="xs"
                    variant="secondary"
                    onClick={() => handleCopyLink(item.url)}
                    className="font-mono text-[9px] uppercase tracking-wider rounded-sm"
                  >
                    Copy Link
                  </Button>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    asChild
                    className="font-mono text-[9px] uppercase tracking-wider bg-white rounded-sm"
                  >
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      View
                    </a>
                  </Button>
                </div>
              </div>

              <CardContent className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-semibold text-neutral-800 truncate" title={item.fileName}>
                    {item.fileName}
                  </h4>
                  {item.size && (
                    <span className="font-mono text-[9px] text-[#776E63]">{item.size}</span>
                  )}
                  <p className="text-[10px] text-muted-foreground font-mono mt-1 leading-tight line-clamp-2">
                    Used: {item.associatedWith}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t flex justify-end">
                  <Button
                    size="xs"
                    variant="ghost"
                    asChild
                    className="h-6 text-[9px] font-mono hover:bg-neutral-50 px-1.5 text-neutral-500 hover:text-black flex items-center gap-1"
                  >
                    <Link to={item.associationUrl}>
                      <ExternalLink className="h-3 w-3" /> Go to item
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
