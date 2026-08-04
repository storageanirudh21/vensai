import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getBrochures, createBrochure, deleteBrochure } from "@/services/brochureService";
import { getCategories } from "@/services/categoryService";
import { uploadRawFile, deleteStorageFile } from "@/services/storageService";
import { Brochure, Category } from "@/types/catalogue";
import { FileText, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/brochures")({
  component: AdminBrochuresPage,
});

function AdminBrochuresPage() {
  const [brochures, setBrochures] = useState<Brochure[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New Brochure Form states
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("none");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bros, cats] = await Promise.all([
        getBrochures(true),
        getCategories(true)
      ]);
      setBrochures(bros);
      setCategories(cats);
    } catch (error) {
      toast.error("Failed to load brochures data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadBrochure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a brochure title.");
      return;
    }
    if (!file) {
      toast.error("Please select a PDF file to upload.");
      return;
    }

    try {
      setUploadProgress(0);
      const catObj = categories.find(c => c.id === selectedCategory);
      
      const fileMeta = await uploadRawFile(
        `brochures/${selectedCategory !== "none" ? selectedCategory : "general"}`,
        file,
        (pct) => setUploadProgress(pct)
      );

      await createBrochure({
        title,
        fileName: file.name,
        fileUrl: fileMeta.url,
        pdfUrl: fileMeta.url,
        storagePath: fileMeta.storagePath,
        categoryId: selectedCategory !== "none" ? selectedCategory : null,
        categoryName: catObj ? catObj.name : null,
        fileSize: fileMeta.fileSize,
        status: "active",
      });

      toast.success("Brochure uploaded successfully!");
      setTitle("");
      setSelectedCategory("none");
      setFile(null);
      setUploadProgress(null);
      loadData();

    } catch (error) {
      console.error(error);
      toast.error("Brochure upload failed.");
      setUploadProgress(null);
    }
  };

  const handleDelete = async (brochure: Brochure) => {
    if (!confirm(`Delete brochure "${brochure.title}"?`)) return;
    try {
      if (brochure.storagePath) {
        await deleteStorageFile(brochure.storagePath);
      }
      await deleteBrochure(brochure.id);
      toast.success("Brochure deleted");
      setBrochures(prev => prev.filter(b => b.id !== brochure.id));
    } catch (error) {
      toast.error("Failed to delete brochure");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-8 font-sans bg-white">
      {/* Top Header */}
      <div className="border-b border-neutral-200 pb-5">
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">Catalogue PDF Brochures</h1>
        <p className="text-xs text-neutral-500 font-medium mt-0.5">Upload and manage product catalog PDF downloads with automatic image raster compression.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Form: Upload Brochure */}
        <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs lg:col-span-4">
          <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50">
            <CardTitle className="font-display text-base font-extrabold text-black">Upload PDF Brochure</CardTitle>
            <CardDescription className="text-xs text-neutral-500 font-medium">
              Files are automatically compressed client-side before uploading.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <form onSubmit={handleUploadBrochure} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Brochure Title *</Label>
                <Input
                  placeholder="e.g. Vensai Global PVC Ceiling Catalogue 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-lg border-neutral-200 bg-white text-xs text-black"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Associated Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-lg border-neutral-200 text-xs text-black">
                    <SelectValue placeholder="General Catalogue" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 text-xs">
                    <SelectItem value="none">General Catalogue (All Categories)</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Select PDF File *</Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="rounded-lg border-neutral-200 text-xs text-black cursor-pointer"
                />
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs font-mono font-bold text-black">
                    <span>Compressing & Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full bg-black transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={uploadProgress !== null}
                className="w-full h-10 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm mt-4"
              >
                {uploadProgress !== null ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                ) : (
                  <Upload className="mr-2 h-4 w-4 text-white" />
                )}
                Upload Brochure
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Table: Existing Brochures */}
        <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden lg:col-span-8">
          <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50">
            <CardTitle className="font-display text-base font-extrabold text-black">Active Brochures ({brochures.length})</CardTitle>
            <CardDescription className="text-xs text-neutral-500 font-medium">
              PDF documents downloadable across website categories
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-neutral-50 border-b border-neutral-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Brochure Title</TableHead>
                  <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Category</TableHead>
                  <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Size</TableHead>
                  <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-48 bg-neutral-100 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 bg-neutral-100 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16 bg-neutral-100 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 bg-neutral-100 rounded ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : brochures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-black opacity-30" />
                        <p className="text-xs font-bold text-black">No PDF brochures uploaded</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  brochures.map((brochure) => (
                    <TableRow key={brochure.id} className="hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 border border-neutral-200 text-black shrink-0">
                            <FileText className="h-4 w-4 text-black" />
                          </div>
                          <div>
                            <a href={brochure.fileUrl || brochure.pdfUrl} target="_blank" rel="noreferrer" className="font-bold text-xs text-black hover:underline">
                              {brochure.title}
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-black font-mono">
                          {brochure.categoryName || "General Catalogue"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono font-semibold text-neutral-600">
                          {formatFileSize(brochure.fileSize)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(brochure)}
                          className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 text-black"
                          title="Delete Brochure"
                        >
                          <Trash2 className="h-4 w-4 text-black hover:text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
