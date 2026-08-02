import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, collection, getDoc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category, Series, SpecField, FilterField, ImageMetadata } from "@/types/catalogue";
import { getCategory, createCategory, updateCategory } from "@/services/categoryService";
import { getSeriesByCategory, createSeries, createSeriesBulk, updateSeries, deleteSeries, updateSeriesOrder } from "@/services/seriesService";
import { uploadRawFile, deleteStorageFile } from "@/services/storageService";
import {
  FolderTree,
  Plus,
  Trash2,
  Settings,
  Upload,
  Loader2,
  Check,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  Info,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";

// Validation Schema
const categorySchema = z.object({
  name: z.string().min(1, "Category Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and dashes only"),
  shortDescription: z.string().default(""),
  description: z.string().default(""),
  coverImage: z.object({
    url: z.string(),
    storagePath: z.string(),
    alt: z.string(),
  }).nullable().default(null),
  featured: z.boolean().default(false),
  status: z.enum(["active", "hidden"]).default("active"),
  order: z.number().default(0),
  specificationTemplate: z.array(z.object({
    label: z.string().min(1, "Label is required"),
    key: z.string().min(1, "Key is required").regex(/^[a-z0-9-]+$/, "Key must be lowercase alphanumeric and dashes"),
    type: z.enum(["text", "number", "select", "multi-select", "boolean"]),
    unit: z.string().default(""),
    required: z.boolean().default(false),
    order: z.number().default(0),
  })).default([]),
  filterConfig: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    label: z.string().min(1, "Label is required"),
    type: z.enum(["select", "multi-select", "number", "boolean"]),
    source: z.enum(["product", "finish", "series"]),
    unit: z.string().default(""),
    order: z.number().default(0),
    enabled: z.boolean().default(true),
  })).default([]),
  seo: z.object({
    title: z.string().default(""),
    description: z.string().default(""),
    keywords: z.array(z.string()).default([]),
  }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  id?: string; // If provided, edit mode
  duplicateId?: string; // If provided, copy fields from this category
}

export function CategoryForm({ id: editId, duplicateId }: CategoryFormProps) {
  const navigate = useNavigate();
  const [categoryId] = useState(() => editId || doc(collection(db, "categories")).id);
  const isEdit = !!editId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  
  // Image upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Series states (only in edit mode)
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [singleSeriesOpen, setSingleSeriesOpen] = useState(false);
  const [bulkSeriesOpen, setBulkSeriesOpen] = useState(false);
  
  // Bulk series raw text input
  const [bulkSeriesText, setBulkSeriesText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ name: string; slug: string }[]>([]);
  const [bulkDuplicates, setBulkDuplicates] = useState<string[]>([]);
  
  // Single series inputs
  const [newSeriesName, setNewSeriesName] = useState("");
  const [newSeriesCode, setNewSeriesCode] = useState("");
  const [newSeriesSlug, setNewSeriesSlug] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      shortDescription: "",
      description: "",
      coverImage: null,
      featured: false,
      status: "active",
      order: 0,
      specificationTemplate: [],
      filterConfig: [],
      seo: { title: "", description: "", keywords: [] },
    }
  });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
    move: moveSpecField
  } = useFieldArray({
    control,
    name: "specificationTemplate"
  });

  const {
    fields: filterFields,
    append: appendFilter,
    remove: removeFilter,
    move: moveFilterField
  } = useFieldArray({
    control,
    name: "filterConfig"
  });

  const nameVal = watch("name");
  const slugVal = watch("slug");
  const coverImageVal = watch("coverImage");

  // Auto-generate slug from name
  useEffect(() => {
    if (nameVal && !isEdit && !duplicateId) {
      const generatedSlug = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug);
      
      // Auto-suggest SEO Title
      setValue("seo.title", `${nameVal} | Vensai Prime`);
    }
  }, [nameVal, setValue, isEdit, duplicateId]);

  // Load category data
  useEffect(() => {
    async function loadData() {
      const targetId = editId || duplicateId;
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const cat = await getCategory(targetId);
        if (cat) {
          reset({
            name: duplicateId ? `${cat.name} (Copy)` : cat.name,
            slug: duplicateId ? `${cat.slug}-copy` : cat.slug,
            shortDescription: cat.shortDescription,
            description: cat.description,
            coverImage: cat.coverImage,
            featured: cat.featured,
            status: cat.status,
            order: cat.order,
            specificationTemplate: cat.specificationTemplate || [],
            filterConfig: cat.filterConfig || [],
            seo: cat.seo || { title: "", description: "", keywords: [] }
          });

          if (isEdit) {
            // Load series
            loadSeriesData();
          }
        } else {
          toast.error("Category data not found");
        }
      } catch (error) {
        toast.error("Error loading category");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [editId, duplicateId, reset, isEdit]);

  const loadSeriesData = async () => {
    if (!isEdit) return;
    try {
      setLoadingSeries(true);
      const list = await getSeriesByCategory(categoryId, true);
      setSeriesList(list);
    } catch (error) {
      toast.error("Failed to load series");
    } finally {
      setLoadingSeries(false);
    }
  };

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to discard them?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    try {
      setUploadProgress(10);
      const meta = await uploadRawFile(`categories/${categoryId}/cover`, file, (p) => {
        setUploadProgress(Math.max(10, p));
      });
      setValue("coverImage", {
        url: meta.url,
        storagePath: meta.storagePath,
        alt: file.name.split(".")[0],
      }, { shouldDirty: true });
      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = async () => {
    if (!coverImageVal) return;
    try {
      await deleteStorageFile(coverImageVal.storagePath);
      setValue("coverImage", null, { shouldDirty: true });
      toast.success("Image removed");
    } catch (error) {
      toast.error("Failed to delete image from storage");
    }
  };

  // Series Creation
  useEffect(() => {
    if (newSeriesName) {
      const generatedSlug = newSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setNewSeriesSlug(generatedSlug);
    }
  }, [newSeriesName]);

  const handleAddSingleSeries = async () => {
    if (!newSeriesName.trim()) {
      toast.error("Series Name is required");
      return;
    }
    
    try {
      const slug = newSeriesSlug || newSeriesName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const orderVal = seriesList.length + 1;
      
      await createSeries({
        name: newSeriesName.trim(),
        code: newSeriesCode.trim() || `WPC-${slug.slice(0, 3).toUpperCase()}`,
        slug,
        categoryId,
        categoryName: watch("name"),
        description: "",
        image: null,
        order: orderVal,
        status: "active"
      });

      toast.success(`Series "${newSeriesName}" added successfully.`);
      setNewSeriesName("");
      setNewSeriesCode("");
      setNewSeriesSlug("");
      setSingleSeriesOpen(false);
      loadSeriesData();
    } catch (error: any) {
      toast.error(error.message || "Failed to create series");
    }
  };

  // Bulk Series Parsing
  const handleBulkTextChange = (text: string) => {
    setBulkSeriesText(text);
    const lines = text.split("\n");
    const parsed: { name: string; slug: string }[] = [];
    const duplicates: string[] = [];
    const seen = new Set<string>();

    lines.forEach((line) => {
      const name = line.trim();
      if (!name) return;

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      if (seen.has(slug)) {
        duplicates.push(name);
      } else {
        seen.add(slug);
        parsed.push({ name, slug });
      }
    });

    setBulkPreview(parsed);
    setBulkDuplicates(duplicates);
  };

  const handleAddBulkSeries = async () => {
    if (bulkPreview.length === 0) {
      toast.error("No valid series lines entered.");
      return;
    }

    try {
      const catName = watch("name");
      const listToCreate = bulkPreview.map((item, idx) => ({
        name: item.name,
        code: `WPC-${item.slug.slice(0, 3).toUpperCase()}`,
        slug: item.slug,
        description: "",
        image: null,
        order: seriesList.length + idx + 1,
        status: "active" as const
      }));

      await createSeriesBulk(categoryId, catName, listToCreate);
      toast.success(`Successfully added ${listToCreate.length} series.`);
      setBulkSeriesText("");
      setBulkPreview([]);
      setBulkDuplicates([]);
      setBulkSeriesOpen(false);
      loadSeriesData();
    } catch (error) {
      toast.error("Failed to run bulk creation batch");
    }
  };

  const handleDeleteSeriesItem = async (seriesId: string, seriesName: string) => {
    if (!window.confirm(`Are you sure you want to delete series "${seriesName}"?`)) {
      return;
    }
    try {
      await deleteSeries(seriesId);
      toast.success("Series deleted");
      loadSeriesData();
    } catch (error: any) {
      toast.error(error.message || "Deletion blocked");
    }
  };

  const handleReorderSeries = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === seriesList.length - 1) return;

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newList = [...seriesList];
    const temp = newList[index];
    newList[index] = newList[newIndex];
    newList[newIndex] = temp;

    // Local state swap
    setSeriesList(newList);

    // Save orders in background
    try {
      const orders = newList.map((item, idx) => ({ id: item.id, order: idx + 1 }));
      await updateSeriesOrder(orders);
    } catch (error) {
      toast.error("Failed to save new ordering");
    }
  };

  // Submit Categories Form
  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    try {
      if (isEdit) {
        await updateCategory(categoryId, values);
        toast.success("Category updated successfully");
      } else {
        await setDoc(doc(db, "categories", categoryId), {
          ...values,
          seriesCount: 0,
          productCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success("Category created successfully");
      }
      reset(values); // reset dirty state
      navigate({ to: "/admin/categories" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B7D6B]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
      {/* Form Action Header */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#121212] md:text-3xl">
            {isEdit ? `Edit Category / ${watch("name")}` : "Add Category"}
          </h1>
          <p className="text-xs text-[#776E63] font-mono uppercase tracking-wider mt-1">
            Category ID: {categoryId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-sm border-[#E5E2DC] text-[#211C17]">
            <Link to="/admin/categories">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="rounded-sm bg-[#211C17] hover:bg-[#4E3F30] text-white"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Category" : "Create Category"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="flex flex-wrap gap-2 border-b bg-transparent p-0 h-auto rounded-none justify-start">
          {["general", "series", "specifications", "filters", "seo"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground data-[state=active]:border-[#211C17] data-[state=active]:text-[#211C17] data-[state=active]:bg-transparent hover:text-[#211C17] transition-all bg-transparent"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab 1: General Details */}
        <TabsContent value="general" className="space-y-8 max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Category Name *</Label>
              <Input
                placeholder="e.g. WPC Panels"
                {...register("name")}
                className={`rounded-sm border-[#E5E2DC] ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-[10px] text-red-500 font-mono mt-0.5">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Slug *</Label>
              <Input
                placeholder="wpc-panels"
                {...register("slug")}
                className={`rounded-sm border-[#E5E2DC] ${errors.slug ? "border-red-500" : ""}`}
              />
              {errors.slug && <p className="text-[10px] text-red-500 font-mono mt-0.5">{errors.slug.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Short Description</Label>
            <Input
              placeholder="e.g. Tactile wood-polymer composite wall cladding."
              {...register("shortDescription")}
              className="rounded-sm border-[#E5E2DC]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Detailed Description</Label>
            <Textarea
              placeholder="Provide background, installation contexts, and product line characteristics..."
              {...register("description")}
              className="rounded-sm border-[#E5E2DC] min-h-[120px]"
            />
          </div>

          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Category Cover Image</Label>
            {coverImageVal ? (
              <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-[#E5E2DC] bg-neutral-50 group">
                <img src={coverImageVal.url} alt="Cover preview" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="font-mono uppercase text-[9px] tracking-wider rounded-sm"
                  >
                    Delete Image
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E5E2DC] bg-white p-8 text-center transition-all hover:bg-neutral-50/50">
                {uploadProgress !== null ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#8B7D6B]" />
                    <p className="font-mono text-[10px] text-[#776E63]">Uploading {uploadProgress}%</p>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-[#776E63]/60" />
                    <span className="font-mono text-xs text-[#211C17] font-semibold">Upload cover photo</span>
                    <span className="font-mono text-[9px] text-[#776E63] uppercase">PNG, JPG or WebP up to 5MB</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Visibility and Meta */}
          <div className="grid gap-6 border-t pt-6 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-[#E5E2DC] bg-white p-4">
              <div>
                <Label className="text-xs font-semibold text-[#121212]">Featured Category</Label>
                <p className="text-[10px] text-muted-foreground font-mono">Showcase in highlights</p>
              </div>
              <Controller
                control={control}
                name="featured"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Display Order</Label>
              <Input
                type="number"
                {...register("order", { valueAsNumber: true })}
                className="rounded-sm border-[#E5E2DC]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="rounded-sm border-[#E5E2DC]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#E5E2DC] rounded-sm font-mono text-xs">
                      <SelectItem value="active">Active (Visible)</SelectItem>
                      <SelectItem value="hidden">Hidden (CMS only)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Series list (Edit only) */}
        <TabsContent value="series" className="space-y-6">
          {!isEdit ? (
            <CardContent className="border rounded-lg bg-white p-12 text-center text-xs text-muted-foreground font-mono">
              <Info className="h-6 w-6 text-[#8B7D6B] mx-auto mb-3" />
              Please save the Category first before configuring and building its Series lists.
            </CardContent>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[#121212]">Category Series ({seriesList.length})</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage and sequence product subgroups.</p>
                </div>
                <div className="flex gap-2">
                  <Dialog open={singleSeriesOpen} onOpenChange={setSingleSeriesOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-sm border-[#E5E2DC] text-xs font-mono">
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Single
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-[#E5E2DC] rounded-sm max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle className="font-display">Add Series</DialogTitle>
                        <DialogDescription className="font-mono text-[10px] text-[#776E63] uppercase">
                          Inherited: {watch("name")}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase font-mono font-semibold text-[#5B554C]">Series Name *</Label>
                          <Input
                            placeholder="e.g. 11 Series"
                            value={newSeriesName}
                            onChange={(e) => setNewSeriesName(e.target.value)}
                            className="rounded-sm border-[#E5E2DC]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase font-mono font-semibold text-[#5B554C]">Series Code</Label>
                          <Input
                            placeholder="e.g. WPC-11"
                            value={newSeriesCode}
                            onChange={(e) => setNewSeriesCode(e.target.value)}
                            className="rounded-sm border-[#E5E2DC]"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase font-mono font-semibold text-[#5B554C]">Slug</Label>
                          <Input
                            placeholder="11-series"
                            value={newSeriesSlug}
                            onChange={(e) => setNewSeriesSlug(e.target.value)}
                            className="rounded-sm border-[#E5E2DC]"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setSingleSeriesOpen(false)} className="font-mono text-xs">
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleAddSingleSeries} className="rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30]">
                          Create Series
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={bulkSeriesOpen} onOpenChange={setBulkSeriesOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30] text-xs font-mono">
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Add Multiple (Bulk)
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-[#E5E2DC] rounded-sm max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle className="font-display">Bulk Series Creator</DialogTitle>
                        <DialogDescription className="font-mono text-[10px] text-[#776E63] uppercase">
                          Create multiple series inside {watch("name")} instantly
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs uppercase font-mono font-semibold text-[#5B554C]">
                            Enter Series Names (one per line)
                          </Label>
                          <Textarea
                            placeholder="11 Series&#10;14 Series&#10;15 Series&#10;Shadow"
                            rows={8}
                            value={bulkSeriesText}
                            onChange={(e) => handleBulkTextChange(e.target.value)}
                            className="rounded-sm border-[#E5E2DC] font-mono text-xs"
                          />
                        </div>

                        {/* Previews and feedback */}
                        {bulkPreview.length > 0 && (
                          <div className="rounded border bg-neutral-50 p-3 space-y-2 max-h-[140px] overflow-y-auto">
                            <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#776E63]">
                              Detected Series Preview ({bulkPreview.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono text-neutral-600">
                              {bulkPreview.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 truncate">
                                  <ArrowRight className="h-3 w-3 shrink-0 text-[#8B7D6B]" />
                                  <span className="font-semibold text-neutral-800">{item.name}</span>
                                  <span className="text-[10px] text-muted-foreground">/{item.slug}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {bulkDuplicates.length > 0 && (
                          <p className="text-[10px] font-mono text-amber-600 bg-amber-50 p-2 rounded">
                            {bulkDuplicates.length} duplicate line(s) ignored: {bulkDuplicates.join(", ")}
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="ghost" size="sm" onClick={() => setBulkSeriesOpen(false)} className="font-mono text-xs">
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddBulkSeries}
                          disabled={bulkPreview.length === 0}
                          className="rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30]"
                        >
                          Add {bulkPreview.length} Series
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Series Listing Table */}
              <div className="rounded-lg border border-[#E5E2DC] bg-white overflow-hidden">
                <Table>
                  <TableHeader className="bg-neutral-50/50">
                    <TableRow className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                      <TableHead className="w-[60px] text-center">Move</TableHead>
                      <TableHead>Series Name</TableHead>
                      <TableHead>Series Code</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead className="text-center">Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingSeries ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto text-[#8B7D6B]" />
                        </TableCell>
                      </TableRow>
                    ) : seriesList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground font-mono">
                          No series created yet. Paste list in bulk mode to save time!
                        </TableCell>
                      </TableRow>
                    ) : (
                      seriesList.map((item, index) => (
                        <TableRow key={item.id} className="border-b border-[#E5E2DC]/50 font-sans text-xs">
                          <TableCell className="text-center flex justify-center gap-1 py-3">
                            <button
                              type="button"
                              onClick={() => handleReorderSeries(index, "up")}
                              disabled={index === 0}
                              className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                            >
                              <MoveUp className="h-3.5 w-3.5 text-[#776E63]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReorderSeries(index, "down")}
                              disabled={index === seriesList.length - 1}
                              className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                            >
                              <MoveDown className="h-3.5 w-3.5 text-[#776E63]" />
                            </button>
                          </TableCell>
                          <TableCell className="font-semibold text-neutral-800">{item.name}</TableCell>
                          <TableCell className="font-mono text-neutral-600 text-[10px]">{item.code || "N/A"}</TableCell>
                          <TableCell className="font-mono text-muted-foreground text-[10px]">/{item.slug}</TableCell>
                          <TableCell className="text-center font-semibold">{item.productCount || 0}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSeriesItem(item.id, item.name)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Specification Templates */}
        <TabsContent value="specifications" className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-semibold text-[#121212]">Category Specification Fields</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Prepopulate specifications for products in this category.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => appendSpec({ label: "", key: "", type: "text", unit: "", required: false, order: specFields.length + 1 })}
              className="rounded-sm border-[#E5E2DC] font-mono text-xs"
            >
              <Plus className="mr-1 w-3.5 h-3.5" /> Add Spec Field
            </Button>
          </div>

          {specFields.length === 0 ? (
            <div className="border border-dashed rounded-lg bg-white p-10 text-center text-xs text-muted-foreground font-mono">
              No specifications defined. Click "+ Add Spec Field" to begin (e.g. Panel Size, Thickness).
            </div>
          ) : (
            <div className="space-y-3">
              {specFields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-3 p-4 rounded-lg border border-[#E5E2DC] bg-white sm:flex-row sm:items-center">
                  {/* Ordering arrows */}
                  <div className="flex sm:flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveSpecField(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <MoveUp className="h-3.5 w-3.5 text-[#776E63]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSpecField(index, index + 1)}
                      disabled={index === specFields.length - 1}
                      className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <MoveDown className="h-3.5 w-3.5 text-[#776E63]" />
                    </button>
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-5">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Label</Label>
                      <Input
                        placeholder="e.g. Thickness"
                        {...register(`specificationTemplate.${index}.label` as const)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue(`specificationTemplate.${index}.label`, val);
                          // Auto generate key if not customized
                          const generatedKey = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                          setValue(`specificationTemplate.${index}.key`, generatedKey);
                        }}
                        className="h-8 rounded-sm text-xs border-[#E5E2DC]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Key</Label>
                      <Input
                        placeholder="e.g. thickness"
                        {...register(`specificationTemplate.${index}.key` as const)}
                        className="h-8 rounded-sm text-xs border-[#E5E2DC] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Type</Label>
                      <Controller
                        control={control}
                        name={`specificationTemplate.${index}.type` as const}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-8 rounded-sm text-xs border-[#E5E2DC]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="select">Select Dropdown</SelectItem>
                              <SelectItem value="multi-select">Multi-Select</SelectItem>
                              <SelectItem value="boolean">Boolean</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Unit</Label>
                      <Input
                        placeholder="e.g. mm"
                        {...register(`specificationTemplate.${index}.unit` as const)}
                        className="h-8 rounded-sm text-xs border-[#E5E2DC]"
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-5 sm:pt-6">
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name={`specificationTemplate.${index}.required` as const}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75 origin-left" />
                          )}
                        />
                        <span className="text-[10px] font-bold uppercase font-mono text-[#5B554C]">Required</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSpec(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-4 sm:mt-0 p-2 rounded self-end sm:self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 4: Category Filter Configurations */}
        <TabsContent value="filters" className="space-y-6 max-w-4xl">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h3 className="font-semibold text-[#121212]">Enabled Sidebar Filters</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Determine filters visitors use to browse this category.</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => appendFilter({ key: "", label: "", type: "multi-select", source: "product", unit: "", order: filterFields.length + 1, enabled: true })}
              className="rounded-sm border-[#E5E2DC] font-mono text-xs"
            >
              <Plus className="mr-1 w-3.5 h-3.5" /> Add Filter Field
            </Button>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/50 rounded p-4 text-xs font-mono flex items-start gap-2.5 max-w-2xl text-amber-800">
            <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
            <div>
              <span className="font-bold">Automated Filter Rules:</span> If your category contains Series (configured in the Series tab), the <b>Series Filter</b> is automatically generated on the frontend catalogue. You do not need to duplicate it here.
            </div>
          </div>

          {filterFields.length === 0 ? (
            <div className="border border-dashed rounded-lg bg-white p-10 text-center text-xs text-muted-foreground font-mono">
              No additional filters configured. Click "+ Add Filter Field" to define filter parameters (e.g. Finish, Material).
            </div>
          ) : (
            <div className="space-y-3">
              {filterFields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-3 p-4 rounded-lg border border-[#E5E2DC] bg-white sm:flex-row sm:items-center">
                  <div className="flex sm:flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => moveFilterField(index, index - 1)}
                      disabled={index === 0}
                      className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <MoveUp className="h-3.5 w-3.5 text-[#776E63]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFilterField(index, index + 1)}
                      disabled={index === filterFields.length - 1}
                      className="p-1 hover:bg-neutral-100 rounded disabled:opacity-30"
                    >
                      <MoveDown className="h-3.5 w-3.5 text-[#776E63]" />
                    </button>
                  </div>

                  <div className="grid flex-1 gap-3 sm:grid-cols-5">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Filter Label</Label>
                      <Input
                        placeholder="e.g. Finish"
                        {...register(`filterConfig.${index}.label` as const)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setValue(`filterConfig.${index}.label`, val);
                          const generatedKey = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
                          setValue(`filterConfig.${index}.key`, generatedKey);
                        }}
                        className="h-8 rounded-sm text-xs border-[#E5E2DC]"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Key</Label>
                      <Input
                        placeholder="e.g. finish"
                        {...register(`filterConfig.${index}.key` as const)}
                        className="h-8 rounded-sm text-xs border-[#E5E2DC] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Filter Type</Label>
                      <Controller
                        control={control}
                        name={`filterConfig.${index}.type` as const}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-8 rounded-sm text-xs border-[#E5E2DC]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                              <SelectItem value="select">Single Select</SelectItem>
                              <SelectItem value="multi-select">Multi-Select</SelectItem>
                              <SelectItem value="number">Number Slider</SelectItem>
                              <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Source Property</Label>
                      <Controller
                        control={control}
                        name={`filterConfig.${index}.source` as const}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-8 rounded-sm text-xs border-[#E5E2DC]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                              <SelectItem value="product">Product Details</SelectItem>
                              <SelectItem value="finish">Product Finishes</SelectItem>
                              <SelectItem value="series">Product Series</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    <div className="flex items-center gap-4 pt-5 sm:pt-6">
                      <div className="flex items-center gap-2">
                        <Controller
                          control={control}
                          name={`filterConfig.${index}.enabled` as const}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75 origin-left" />
                          )}
                        />
                        <span className="text-[10px] font-bold uppercase font-mono text-[#5B554C]">Enabled</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 mt-4 sm:mt-0 p-2 rounded self-end sm:self-center"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 5: SEO Configurations */}
        <TabsContent value="seo" className="space-y-6 max-w-3xl">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">SEO Page Title</Label>
            <Input
              placeholder="e.g. WPC Louver Panels | Vensai Prime Interiors"
              {...register("seo.title")}
              className="rounded-sm border-[#E5E2DC]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Meta Description</Label>
            <Textarea
              placeholder="Enter page summary for search engine snippet..."
              {...register("seo.description")}
              className="rounded-sm border-[#E5E2DC]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">SEO Keywords</Label>
            <Input
              placeholder="e.g. wpc louvres, wall panels, cladding (press comma or enter)"
              onKeyDown={(e) => {
                if (e.key === "," || e.key === "Enter") {
                  e.preventDefault();
                  const val = e.currentTarget.value.trim().replace(/,$/, "");
                  if (val) {
                    const current = watch("seo.keywords") || [];
                    if (!current.includes(val)) {
                      setValue("seo.keywords", [...current, val], { shouldDirty: true });
                    }
                    e.currentTarget.value = "";
                  }
                }
              }}
              className="rounded-sm border-[#E5E2DC]"
            />
            {/* Display tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(watch("seo.keywords") || []).map((word) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1 rounded bg-neutral-100 px-2 py-1 text-[10px] font-mono text-neutral-800"
                >
                  {word}
                  <button
                    type="button"
                    onClick={() => {
                      const current = watch("seo.keywords");
                      setValue("seo.keywords", current.filter(w => w !== word), { shouldDirty: true });
                    }}
                    className="text-neutral-500 hover:text-neutral-800 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}
