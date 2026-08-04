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
  ArrowLeft,
  Sparkles,
  Layers,
  SlidersHorizontal,
  FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

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
  id?: string;
  duplicateId?: string;
}

const STEPS = [
  { id: 1, title: "1. Essentials", desc: "Title & Cover" },
  { id: 2, title: "2. Series", desc: "Category Series" },
  { id: 3, title: "3. Specs", desc: "Specifications" },
  { id: 4, title: "4. Filters", desc: "Store Filters" },
  { id: 5, title: "5. SEO & Save", desc: "Review & Publish" },
];

export function CategoryForm({ id: editId, duplicateId }: CategoryFormProps) {
  const navigate = useNavigate();
  const [categoryId] = useState(() => editId || doc(collection(db, "categories")).id);
  const isEdit = !!editId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Image upload state
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Series states
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [singleSeriesOpen, setSingleSeriesOpen] = useState(false);
  const [bulkSeriesOpen, setBulkSeriesOpen] = useState(false);
  
  // Bulk series raw text input
  const [bulkSeriesText, setBulkSeriesText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<{ name: string; slug: string; code: string }[]>([]);
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

  // Auto-generate slug & SEO suggestions
  useEffect(() => {
    if (nameVal && !isEdit && !duplicateId) {
      const generatedSlug = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug);
      setValue("seo.title", `${nameVal} | Vensai Prime`);
    }
  }, [nameVal, setValue, isEdit, duplicateId]);

  // Auto-generate series code & slug when typing single series name
  useEffect(() => {
    if (newSeriesName) {
      const slug = newSeriesName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setNewSeriesSlug(slug);

      if (!newSeriesCode) {
        const catPrefix = nameVal ? nameVal.slice(0, 3).toUpperCase() : "CAT";
        const initials = newSeriesName.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).map(w => w[0]).join("").toUpperCase();
        const digits = newSeriesName.match(/\d+/g)?.join("") || "";
        setNewSeriesCode(`${catPrefix}-${initials}${digits ? `-${digits}` : ""}`);
      }
    }
  }, [newSeriesName]);

  // Load category & series data
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

          // Load series
          const list = await getSeriesByCategory(targetId, true);
          setSeriesList(list);
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
  }, [editId, duplicateId, reset]);

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    try {
      setUploadProgress(0);
      const metadata = await uploadRawFile(
        `categories/${categoryId}`,
        file,
        (pct) => setUploadProgress(pct)
      );

      setValue("coverImage", {
        url: metadata.url,
        storagePath: metadata.storagePath,
        alt: nameVal || "Category Cover",
      }, { shouldDirty: true });

      toast.success("Cover image uploaded");
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleRemoveImage = async () => {
    if (!coverImageVal) return;
    try {
      if (coverImageVal.storagePath) {
        await deleteStorageFile(coverImageVal.storagePath);
      }
      setValue("coverImage", null, { shouldDirty: true });
      toast.success("Cover image removed");
    } catch (error) {
      toast.error("Failed to delete cover image");
    }
  };

  // Add Single Series to local state / Firestore
  const handleAddSingleSeries = async () => {
    if (!newSeriesName.trim()) {
      toast.error("Series Name is required.");
      return;
    }

    const slug = newSeriesSlug.trim() || newSeriesName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const code = newSeriesCode.trim() || `${nameVal.slice(0, 3).toUpperCase()}-${slug.slice(0, 3).toUpperCase()}`;

    const newSeriesItem: Series = {
      id: doc(collection(db, "series")).id,
      name: newSeriesName.trim(),
      code,
      slug,
      categoryId,
      categoryName: nameVal || "Category",
      description: "",
      image: null,
      order: seriesList.length + 1,
      status: "active",
      productCount: 0,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    };

    setSeriesList(prev => [...prev, newSeriesItem]);
    toast.success(`Series "${newSeriesName}" added!`);

    setNewSeriesName("");
    setNewSeriesCode("");
    setNewSeriesSlug("");
    setSingleSeriesOpen(false);
  };

  // Bulk Series Parsing
  const handleBulkTextChange = (text: string) => {
    setBulkSeriesText(text);
    const lines = text.split("\n");
    const parsed: { name: string; slug: string; code: string }[] = [];
    const duplicates: string[] = [];
    const seen = new Set<string>();

    const catPrefix = nameVal ? nameVal.slice(0, 3).toUpperCase() : "SER";

    lines.forEach((line) => {
      const name = line.trim();
      if (!name) return;

      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const initials = name.replace(/[^a-zA-Z0-9\s]/g, "").split(/\s+/).map(w => w[0]).join("").toUpperCase();
      const digits = name.match(/\d+/g)?.join("") || "";
      const code = `${catPrefix}-${initials}${digits ? `-${digits}` : ""}`;

      if (seen.has(slug)) {
        duplicates.push(name);
      } else {
        seen.add(slug);
        parsed.push({ name, slug, code });
      }
    });

    setBulkPreview(parsed);
    setBulkDuplicates(duplicates);
  };

  const handleAddBulkSeries = () => {
    if (bulkPreview.length === 0) {
      toast.error("No valid series lines entered.");
      return;
    }

    const createdItems: Series[] = bulkPreview.map((item, idx) => ({
      id: doc(collection(db, "series")).id,
      name: item.name,
      code: item.code,
      slug: item.slug,
      categoryId,
      categoryName: nameVal || "Category",
      description: "",
      image: null,
      order: seriesList.length + idx + 1,
      status: "active" as const,
      productCount: 0,
      createdAt: new Date() as any,
      updatedAt: new Date() as any
    }));

    setSeriesList(prev => [...prev, ...createdItems]);
    toast.success(`Added ${createdItems.length} series.`);
    setBulkSeriesText("");
    setBulkPreview([]);
    setBulkDuplicates([]);
    setBulkSeriesOpen(false);
  };

  const handleDeleteSeriesItem = (seriesId: string, seriesName: string) => {
    setSeriesList(prev => prev.filter(s => s.id !== seriesId));
    toast.success(`Removed series "${seriesName}"`);
  };

  // Submit Categories & All Series Together
  const onSubmit = async (values: CategoryFormValues) => {
    setSubmitting(true);
    try {
      // 1. Save / Update Category Document
      if (isEdit) {
        await updateCategory(categoryId, values);
      } else {
        await setDoc(doc(db, "categories", categoryId), {
          ...values,
          seriesCount: seriesList.length,
          productCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // 2. Batch Save All Series Documents
      if (seriesList.length > 0) {
        const batch = writeBatch(db);
        seriesList.forEach((s, idx) => {
          const ref = doc(db, "series", s.id);
          batch.set(ref, {
            ...s,
            categoryId,
            categoryName: values.name,
            order: idx + 1,
            updatedAt: new Date()
          }, { merge: true });
        });
        await batch.commit();
      }

      toast.success("Category & Series saved successfully!");
      reset(values);
      navigate({ to: "/admin/categories" });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to save category and series");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans bg-white">
      {/* Top Header CTA Bar */}
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-black sm:text-3xl">
            {isEdit ? `Edit Category / ${watch("name")}` : "Add New Category"}
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Category ID: {categoryId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" variant="outline" className="rounded-lg border-neutral-200 text-black hover:bg-neutral-100 text-xs font-semibold">
            <Link to="/admin/categories">Cancel</Link>
          </Button>
          <Button
            type="button"
            onClick={handleSubmit(onSubmit as any)}
            disabled={submitting}
            size="sm"
            className="rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm px-4"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
            Save Category & Series
          </Button>
        </div>
      </div>

      {/* Stepper Progress Navigation Header */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all cursor-pointer",
                  isActive
                    ? "border-black bg-black text-white shadow-xs"
                    : isDone
                    ? "border-neutral-200 bg-neutral-50 text-black hover:bg-neutral-100"
                    : "border-neutral-200 bg-white text-neutral-400 hover:text-black hover:bg-neutral-50"
                )}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Step {step.id}</span>
                  {isDone && <Check className="h-3.5 w-3.5 text-black" />}
                </div>
                <span className="text-xs font-extrabold">{step.title}</span>
                <span className={cn("text-[9px] font-mono truncate", isActive ? "text-neutral-300" : "text-neutral-400")}>
                  {step.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content Body by Step */}
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
        {/* STEP 1: GENERAL ESSENTIALS */}
        {currentStep === 1 && (
          <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50">
              <CardTitle className="font-display text-base font-extrabold text-black">Step 1: Category Essentials</CardTitle>
              <CardDescription className="text-xs text-neutral-500 font-medium">
                Set category titles, descriptions, status, and cover media.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Category Name *</Label>
                  <Input
                    placeholder="e.g. WPC Wall Panels"
                    {...register("name")}
                    className={`rounded-lg border-neutral-200 text-xs text-black ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-mono mt-0.5">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Slug *</Label>
                  <Input
                    placeholder="wpc-wall-panels"
                    {...register("slug")}
                    className={`rounded-lg border-neutral-200 text-xs text-black font-mono ${errors.slug ? "border-red-500" : ""}`}
                  />
                  {errors.slug && <p className="text-[10px] text-red-500 font-mono mt-0.5">{errors.slug.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Short Description</Label>
                <Input
                  placeholder="e.g. Premium interior wood-polymer composite wall cladding."
                  {...register("shortDescription")}
                  className="rounded-lg border-neutral-200 text-xs text-black"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Detailed Description</Label>
                <Textarea
                  placeholder="Provide background, installation contexts, and product line characteristics..."
                  {...register("description")}
                  className="rounded-lg border-neutral-200 text-xs text-black min-h-[120px]"
                />
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Category Cover Image</Label>
                {coverImageVal ? (
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 group">
                    <img src={coverImageVal.url} alt="Cover preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="font-mono uppercase text-[9px] tracking-wider rounded-lg"
                      >
                        Delete Image
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center transition-all hover:bg-neutral-50">
                    {uploadProgress !== null ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-black" />
                        <p className="font-mono text-[10px] text-black">Uploading {uploadProgress}%</p>
                      </div>
                    ) : (
                      <label className="flex cursor-pointer flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-black" />
                        <span className="font-mono text-xs text-black font-bold">Upload cover photo</span>
                        <span className="font-mono text-[9px] text-neutral-400 uppercase">PNG, JPG or WebP up to 5MB</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Status and Featured */}
              <div className="grid gap-6 sm:grid-cols-2 border-t border-neutral-200 pt-6">
                <div className="flex items-center justify-between rounded-xl border border-neutral-200 p-4 bg-neutral-50/50">
                  <div>
                    <Label className="text-xs font-bold text-black">Featured Category</Label>
                    <p className="text-[10px] text-neutral-500 font-mono">Display in homepage showcase</p>
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
                  <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Catalogue Status</Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="rounded-lg border-neutral-200 text-xs text-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-neutral-200 rounded-lg font-mono text-xs text-black">
                          <SelectItem value="active">Active (Visible on website)</SelectItem>
                          <SelectItem value="hidden">Hidden (CMS only)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: SERIES CONFIGURATION */}
        {currentStep === 2 && (
          <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-extrabold text-black">Step 2: Category Series ({seriesList.length})</CardTitle>
                <CardDescription className="text-xs text-neutral-500 font-medium">
                  Add and auto-code Series for this category before publishing.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {/* Add Single Series Modal */}
                <Dialog open={singleSeriesOpen} onOpenChange={setSingleSeriesOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="rounded-lg border-neutral-200 text-xs font-semibold text-black hover:bg-neutral-100">
                      <Plus className="mr-1.5 h-3.5 w-3.5 text-black" /> Add Single Series
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-neutral-200 rounded-xl max-w-[420px]">
                    <DialogHeader>
                      <DialogTitle className="font-display font-extrabold text-black">Add New Series</DialogTitle>
                      <DialogDescription className="font-mono text-[10px] text-neutral-500 uppercase">
                        Category: {nameVal || "New Category"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-mono font-bold text-black">Series Name *</Label>
                        <Input
                          placeholder="e.g. 11 Series"
                          value={newSeriesName}
                          onChange={(e) => setNewSeriesName(e.target.value)}
                          className="rounded-lg border-neutral-200 text-xs text-black"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <Label className="text-xs uppercase font-mono font-bold text-black">Series Code *</Label>
                          <span className="text-[10px] text-neutral-400 font-mono">Auto-generated</span>
                        </div>
                        <Input
                          placeholder="e.g. WPC-11S"
                          value={newSeriesCode}
                          onChange={(e) => setNewSeriesCode(e.target.value)}
                          className="rounded-lg border-neutral-200 text-xs text-black font-mono"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase font-mono font-bold text-black">Slug</Label>
                        <Input
                          placeholder="11-series"
                          value={newSeriesSlug}
                          onChange={(e) => setNewSeriesSlug(e.target.value)}
                          className="rounded-lg border-neutral-200 text-xs text-black font-mono"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" size="sm" onClick={() => setSingleSeriesOpen(false)} className="font-mono text-xs text-black">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddSingleSeries} className="rounded-lg bg-black text-white hover:bg-neutral-800 font-semibold text-xs">
                        Create Series
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Add Bulk Series Modal */}
                <Dialog open={bulkSeriesOpen} onOpenChange={setBulkSeriesOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-lg bg-black text-white hover:bg-neutral-800 text-xs font-semibold shadow-sm">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-white" /> Add Multiple (Bulk)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-neutral-200 rounded-xl max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle className="font-display font-extrabold text-black">Bulk Series Creator</DialogTitle>
                      <DialogDescription className="font-mono text-[10px] text-neutral-500 uppercase">
                        Type one series name per line (Codes and Slugs auto-generate)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                      <Textarea
                        placeholder={`11 Series\n14 Series\nShadow Line Series\nFluted Panel Series`}
                        value={bulkSeriesText}
                        onChange={(e) => handleBulkTextChange(e.target.value)}
                        className="min-h-[140px] font-mono text-xs rounded-lg border-neutral-200 bg-neutral-50 text-black"
                      />
                      {bulkPreview.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-black font-mono">Parsed Series ({bulkPreview.length}):</p>
                          <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-neutral-200 p-3 bg-white">
                            {bulkPreview.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs border-b border-neutral-100 pb-1">
                                <span className="font-bold text-black">{item.name}</span>
                                <span className="font-mono text-[10px] text-neutral-500">{item.code} • /{item.slug}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" size="sm" onClick={() => setBulkSeriesOpen(false)} className="font-mono text-xs text-black">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleAddBulkSeries} className="rounded-lg bg-black text-white hover:bg-neutral-800 font-semibold text-xs">
                        Add {bulkPreview.length} Series
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {seriesList.length === 0 ? (
                <div className="p-12 text-center text-xs text-neutral-400 font-medium">
                  <Layers className="h-8 w-8 text-black opacity-30 mx-auto mb-2" />
                  No series created yet. Click "Add Single Series" or "Add Multiple (Bulk)" above.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-neutral-50 border-b border-neutral-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Series Name</TableHead>
                      <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Series Code</TableHead>
                      <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Slug</TableHead>
                      <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seriesList.map((s) => (
                      <TableRow key={s.id} className="hover:bg-neutral-50 border-b border-neutral-100">
                        <TableCell className="font-bold text-xs text-black">{s.name}</TableCell>
                        <TableCell className="font-mono text-xs font-bold text-black">
                          <span className="bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">{s.code}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-neutral-500">/{s.slug}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSeriesItem(s.id, s.name)}
                            className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-600 text-black"
                          >
                            <Trash2 className="h-4 w-4 text-black hover:text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 3: SPECIFICATION TEMPLATES */}
        {currentStep === 3 && (
          <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-extrabold text-black">Step 3: Specification Templates ({specFields.length})</CardTitle>
                <CardDescription className="text-xs text-neutral-500 font-medium">
                  Configure default specifications key-value fields for products in this category.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => appendSpec({ label: "", key: "", type: "text", unit: "", required: false, order: specFields.length })}
                className="rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5 text-white" /> Add Spec Field
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {specFields.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 font-medium border-2 border-dashed border-neutral-200 rounded-xl">
                  No spec template fields configured yet. Click "Add Spec Field" to define attributes like Thickness, Density, Length, etc.
                </div>
              ) : (
                <div className="space-y-3">
                  {specFields.map((field, idx) => (
                    <div key={field.id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Label *</Label>
                        <Input
                          placeholder="e.g. Panel Thickness"
                          {...register(`specificationTemplate.${idx}.label`)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue(`specificationTemplate.${idx}.label`, val);
                            const key = val.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                            setValue(`specificationTemplate.${idx}.key`, key);
                          }}
                          className="rounded-lg border-neutral-200 bg-white text-xs text-black"
                        />
                      </div>
                      <div className="w-36 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Key *</Label>
                        <Input
                          placeholder="panel-thickness"
                          {...register(`specificationTemplate.${idx}.key`)}
                          className="rounded-lg border-neutral-200 bg-white text-xs font-mono text-black"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Type</Label>
                        <Controller
                          control={control}
                          name={`specificationTemplate.${idx}.type`}
                          render={({ field: f }) => (
                            <Select onValueChange={f.onChange} value={f.value}>
                              <SelectTrigger className="rounded-lg border-neutral-200 bg-white text-xs text-black">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-neutral-200 text-xs">
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="number">Number</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Unit</Label>
                        <Input
                          placeholder="mm"
                          {...register(`specificationTemplate.${idx}.unit`)}
                          className="rounded-lg border-neutral-200 bg-white text-xs font-mono text-black"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpec(idx)}
                        className="h-8 w-8 rounded-lg hover:bg-red-50 text-black mt-5"
                      >
                        <Trash2 className="h-4 w-4 text-black hover:text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 4: FILTER CONFIGURATION */}
        {currentStep === 4 && (
          <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-base font-extrabold text-black">Step 4: Store Filters ({filterFields.length})</CardTitle>
                <CardDescription className="text-xs text-neutral-500 font-medium">
                  Configure storefront filtering attributes for category catalogue browsing.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const defaults = [
                      { key: "seriesId", label: "Series Group", type: "select" as const, source: "series" as const, unit: "", order: 0, enabled: true },
                      { key: "finish-type", label: "Finish Type", type: "select" as const, source: "finish" as const, unit: "", order: 1, enabled: true },
                      { key: "application", label: "Application", type: "select" as const, source: "product" as const, unit: "", order: 2, enabled: true },
                      { key: "texture", label: "Texture / Pattern", type: "select" as const, source: "product" as const, unit: "", order: 3, enabled: true }
                    ];
                    setValue("filterConfig", defaults, { shouldDirty: true });
                    toast.success("Auto-generated 4 standard store filters!");
                  }}
                  className="rounded-lg border-neutral-200 text-black hover:bg-neutral-100 text-xs font-semibold"
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-black" /> Auto-Generate Filters
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => appendFilter({ key: "", label: "", type: "select", source: "product", unit: "", order: filterFields.length, enabled: true })}
                  className="rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5 text-white" /> Add Filter Attribute
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="rounded-lg bg-neutral-100 border border-neutral-200 p-3 text-xs text-neutral-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-black uppercase text-[10px] font-mono block">⚡ Automatic Filtering Active:</span>
                  <span>If left empty, the store catalogue automatically extracts filters directly from product finishes, series, and specs!</span>
                </div>
              </div>

              {filterFields.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 font-medium border-2 border-dashed border-neutral-200 rounded-xl">
                  No custom filter overrides configured. Click <b>"Auto-Generate Filters"</b> or leave blank for 100% automatic storefront filtering.
                </div>
              ) : (
                <div className="space-y-3">
                  {filterFields.map((field, idx) => (
                    <div key={field.id} className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Filter Label *</Label>
                        <Input
                          placeholder="e.g. Finish Type"
                          {...register(`filterConfig.${idx}.label`)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue(`filterConfig.${idx}.label`, val);
                            const key = val.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                            setValue(`filterConfig.${idx}.key`, key);
                          }}
                          className="rounded-lg border-neutral-200 bg-white text-xs text-black"
                        />
                      </div>
                      <div className="w-36 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Filter Key *</Label>
                        <Input
                          placeholder="finish-type"
                          {...register(`filterConfig.${idx}.key`)}
                          className="rounded-lg border-neutral-200 bg-white text-xs font-mono text-black"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <Label className="text-[10px] font-mono font-bold uppercase text-black">Source</Label>
                        <Controller
                          control={control}
                          name={`filterConfig.${idx}.source`}
                          render={({ field: f }) => (
                            <Select onValueChange={f.onChange} value={f.value}>
                              <SelectTrigger className="rounded-lg border-neutral-200 bg-white text-xs text-black">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-neutral-200 text-xs">
                                <SelectItem value="product">Product Level</SelectItem>
                                <SelectItem value="finish">Finish Variant</SelectItem>
                                <SelectItem value="series">Series Group</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFilter(idx)}
                        className="h-8 w-8 rounded-lg hover:bg-red-50 text-black mt-5"
                      >
                        <Trash2 className="h-4 w-4 text-black hover:text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 5: SEO & FINAL REVIEW */}
        {currentStep === 5 && (
          <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
            <CardHeader className="border-b border-neutral-200 p-5 bg-neutral-50/50">
              <CardTitle className="font-display text-base font-extrabold text-black">Step 5: SEO Meta & Final Review</CardTitle>
              <CardDescription className="text-xs text-neutral-500 font-medium">
                Review all category parameters and publish to Firestore database.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Meta Page Title</Label>
                <Input
                  placeholder="e.g. WPC Wall Panels & Louver Surfaces | Vensai Prime"
                  {...register("seo.title")}
                  className="rounded-lg border-neutral-200 text-xs text-black"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">Meta Page Description</Label>
                <Textarea
                  placeholder="Search engine summary..."
                  {...register("seo.description")}
                  className="rounded-lg border-neutral-200 text-xs text-black min-h-[80px]"
                />
              </div>

              {/* Review Summary Box */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="font-bold text-black uppercase">Category Name:</span>
                  <span className="font-bold text-black">{watch("name") || "Not set"}</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="font-bold text-black uppercase">Configured Series:</span>
                  <span className="font-bold text-black">{seriesList.length} Series</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="font-bold text-black uppercase">Specifications Template:</span>
                  <span className="font-bold text-black">{specFields.length} Attributes</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-black uppercase">Store Filters:</span>
                  <span className="font-bold text-black">{filterFields.length} Filters</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stepper Navigation Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep(s => Math.max(s - 1, 1))}
            disabled={currentStep === 1}
            className="h-10 rounded-lg border-neutral-200 text-black text-xs font-semibold hover:bg-neutral-100"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4 text-black" /> Previous Step
          </Button>

          {currentStep < 5 ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(s => Math.min(s + 1, 5))}
              className="h-10 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm px-6"
            >
              Next Step <ArrowRight className="ml-1.5 h-4 w-4 text-white" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm px-6"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
              Save Category & All Series
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
