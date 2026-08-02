import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getBrochures, createBrochure, deleteBrochure } from "@/services/brochureService";
import { getCategories } from "@/services/categoryService";
import { uploadRawFile, deleteStorageFile } from "@/services/storageService";
import { Brochure, Category } from "@/types/catalogue";
import { FileText, Plus, Trash2, Upload, Loader2, Link as LinkIcon, Info } from "lucide-react";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }

    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.split(".")[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      toast.error("Please enter a title and select a PDF file.");
      return;
    }

    setUploadProgress(10);
    try {
      const categoryId = selectedCategory === "none" ? null : selectedCategory;
      const folderPath = `brochures/${categoryId || "general"}`;
      
      const meta = await uploadRawFile(folderPath, file, (p) => {
        setUploadProgress(Math.max(10, p));
      });

      await createBrochure({
        title: title.trim(),
        categoryId,
        fileName: file.name,
        fileUrl: meta.url,
        storagePath: meta.storagePath,
        fileSize: file.size,
        status: "active"
      });

      toast.success("Brochure uploaded successfully");
      
      // Reset form
      setTitle("");
      setSelectedCategory("none");
      setFile(null);
      
      // Reload table
      loadData();
    } catch (error) {
      toast.error("Brochure upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string, storagePath: string, name: string) => {
    if (!window.confirm(`Delete brochure "${name}"?`)) {
      return;
    }

    try {
      // 1. Delete from Firebase Storage
      await deleteStorageFile(storagePath);
      // 2. Delete document in Firestore
      await deleteBrochure(id);
      
      toast.success("Brochure deleted");
      loadData();
    } catch (error) {
      toast.error("Deletion failed");
    }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return "General / Unassigned";
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : "Unknown Category";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#121212] md:text-4xl">Brochures</h1>
        <p className="text-sm text-[#776E63]">Upload and link catalogs and technical brochures for category items.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left: Listing Table */}
        <Card className="rounded-lg border-[#E5E2DC] lg:col-span-8 bg-white shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Catalogues</CardTitle>
            <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
              PDF attachments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-neutral-50/50">
                <TableRow className="border-b border-[#E5E2DC] font-mono text-[9px] tracking-wider uppercase text-[#776E63]">
                  <TableHead>Brochure Title</TableHead>
                  <TableHead>Associated Category</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <TableRow key={i} className="border-b border-[#E5E2DC]/50">
                      <TableCell><Skeleton className="h-4 w-40 bg-neutral-100" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28 bg-neutral-100" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32 bg-neutral-100" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 bg-neutral-100" /></TableCell>
                      <TableCell><Skeleton className="ml-auto h-8 w-8 bg-neutral-100" /></TableCell>
                    </TableRow>
                  ))
                ) : brochures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-xs text-muted-foreground font-mono">
                      No brochures uploaded yet. Create one using the form on the right.
                    </TableCell>
                  </TableRow>
                ) : (
                  brochures.map((b) => (
                    <TableRow key={b.id} className="border-b border-[#E5E2DC]/50 hover:bg-neutral-50/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-[#121212]">{b.title}</TableCell>
                      <TableCell className="text-xs">{getCategoryName(b.categoryId)}</TableCell>
                      <TableCell className="font-mono text-[10px] text-[#776E63] max-w-[150px] truncate" title={b.fileName}>
                        {b.fileName}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-neutral-600">{formatSize(b.fileSize)}</TableCell>
                      <TableCell className="text-right flex items-center justify-end gap-1 py-3">
                        <Button
                          variant="ghost"
                          size="xs"
                          asChild
                          className="h-8 w-8 p-0 text-neutral-600 hover:bg-neutral-100"
                          title="Open PDF"
                        >
                          <a href={b.fileUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDelete(b.id, b.storagePath, b.title)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete brochure"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right: Upload Box Form */}
        <Card className="rounded-lg border-[#E5E2DC] lg:col-span-4 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Upload Catalogue</CardTitle>
            <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
              Upload PDF Brochure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Brochure Title *</Label>
                <Input
                  placeholder="e.g. WPC Panels Catalogue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="rounded-sm border-[#E5E2DC]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Associated Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="rounded-sm border-[#E5E2DC] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E2DC] rounded-sm text-xs font-mono">
                    <SelectItem value="none">General / Unassigned</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">PDF File *</Label>
                {file ? (
                  <div className="rounded border bg-neutral-50 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-[#8B7D6B] shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-xs font-semibold block text-neutral-800 truncate">{file.name}</span>
                        <span className="font-mono text-[9px] text-[#776E63]">{formatSize(file.size)}</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setFile(null)}
                      className="text-red-500 font-mono text-[9px] uppercase tracking-wider h-6 hover:bg-red-50"
                    >
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E5E2DC] bg-white p-6 text-center transition-all hover:bg-neutral-50/50">
                    {uploadProgress !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-[#8B7D6B]" />
                        <p className="font-mono text-[9px] text-[#776E63]">Uploading PDF {uploadProgress}%</p>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-1.5">
                        <Upload className="h-6 w-6 text-[#776E63]/60" />
                        <span className="font-mono text-[10px] text-[#211C17] font-semibold">Select PDF Brochure</span>
                        <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={!file || !title.trim() || uploadProgress !== null}
                className="w-full rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30] font-mono text-xs uppercase tracking-widest py-5"
              >
                {uploadProgress !== null ? "Uploading..." : "Upload Brochure"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
