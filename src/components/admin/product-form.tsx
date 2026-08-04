import React, { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { doc, collection, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Category, Series, ProductFinish, ImageMetadata, ProductSpecification, Brochure } from "@/types/catalogue";
import { getProduct, createProduct, updateProduct } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getSeriesByCategory, createSeries } from "@/services/seriesService";
import { getBrochures, createBrochure } from "@/services/brochureService";
import { uploadProductImageGroup, uploadRawFile, deleteStorageFile } from "@/services/storageService";
import {
  Package,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Check,
  Eye,
  EyeOff,
  Info,
  ArrowRight,
  Sparkles,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckSquare,
  Square,
  PlusCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Link, useNavigate } from "@tanstack/react-router";

// Helper for auto SKU generation
export function generateProductSku(productName: string, categoryName?: string): string {
  if (!productName || !productName.trim()) return "";
  
  let catPrefix = "VNS";
  if (categoryName) {
    const cleanedCat = categoryName.replace(/[^a-zA-Z0-9\s]/g, "").trim();
    const catWords = cleanedCat.split(/\s+/);
    if (catWords.length >= 2) {
      catPrefix = catWords.map(w => w[0]).join("").toUpperCase().slice(0, 4);
    } else if (cleanedCat.length >= 3) {
      catPrefix = cleanedCat.slice(0, 3).toUpperCase();
    }
  }

  const cleanedName = productName.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
  const parts = cleanedName.split(/[\s-]+/);
  
  let nameCode = "";
  const numbers = cleanedName.match(/\d+/g);

  if (parts.length === 1) {
    nameCode = parts[0].slice(0, 4).toUpperCase();
  } else {
    nameCode = parts.map(p => p[0]).join("").toUpperCase();
    if (nameCode.length < 3) {
      nameCode = parts[0].slice(0, 3).toUpperCase();
    }
  }

  const numberSuffix = numbers ? `-${numbers.join("")}` : "";
  return `${catPrefix}-${nameCode}${numberSuffix}`.replace(/--+/g, "-");
}

// Validation schema
const productSchema = z.object({
  name: z.string().min(1, "Product Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and dashes"),
  sku: z.string().default(""),
  categoryId: z.string().min(1, "Category is required"),
  categoryName: z.string().default(""),
  seriesId: z.string().min(1, "Series is required"),
  seriesName: z.string().default(""),
  shortDescription: z.string().default(""),
  description: z.string().default(""),
  primaryImage: z.object({
    url: z.string(),
    thumbnailUrl: z.string(),
    storagePath: z.string(),
    alt: z.string(),
  }).nullable().default(null),
  images: z.array(z.object({
    url: z.string(),
    thumbnailUrl: z.string(),
    storagePath: z.string(),
    alt: z.string(),
    finishId: z.string().optional(),
  })).default([]),
  finishes: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, "Finish Name is required"),
    slug: z.string().min(1, "Finish slug is required"),
    code: z.string().default(""),
    swatch: z.string().nullable().default(""),
    available: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    order: z.number().default(0),
  })).default([]),
  specifications: z.array(z.object({
    key: z.string().min(1, "Key is required"),
    label: z.string().min(1, "Label is required"),
    value: z.string().min(1, "Value is required"),
    unit: z.string().default(""),
    order: z.number().default(0),
  })).default([]),
  filterData: z.record(z.any()).default({}),
  brochure: z.object({
    id: z.string(),
    title: z.string(),
    fileUrl: z.string(),
  }).nullable().default(null),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published", "hidden"]).default("draft"),
  order: z.number().default(0),
  seo: z.object({
    title: z.string().default(""),
    description: z.string().default(""),
    keywords: z.array(z.string()).default([]),
  }),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  id?: string; // If edit mode
  duplicateId?: string; // If duplicate mode
}

export function ProductForm({ id: editId, duplicateId }: ProductFormProps) {
  const navigate = useNavigate();
  const [productId] = useState(() => editId || doc(collection(db, "products")).id);
  const isEdit = !!editId;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form options lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [brochures, setBrochures] = useState<Brochure[]>([]);

  // Category specifications template & filter configs loaded dynamically
  const [selectedCategoryData, setSelectedCategoryData] = useState<Category | null>(null);

  // Quick series modal states
  const [quickSeriesOpen, setQuickSeriesOpen] = useState(false);
  const [quickSeriesName, setQuickSeriesName] = useState("");
  const [quickSeriesCode, setQuickSeriesCode] = useState("");

  // Media upload progress
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  
  // Brochure upload progress
  const [brochureUploadProgress, setBrochureUploadProgress] = useState<number | null>(null);
  const [newBrochureTitle, setNewBrochureTitle] = useState("");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty }
  } = useForm<any>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      sku: "",
      categoryId: "",
      categoryName: "",
      seriesId: "",
      seriesName: "",
      shortDescription: "",
      description: "",
      primaryImage: null,
      images: [],
      finishes: [],
      specifications: [],
      filterData: {},
      brochure: null,
      featured: false,
      status: "draft",
      order: 0,
      seo: { title: "", description: "", keywords: [] },
    }
  });

  const {
    fields: finishFields,
    append: appendFinish,
    remove: removeFinish,
  } = useFieldArray({
    control,
    name: "finishes"
  });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
    move: moveSpec,
  } = useFieldArray({
    control,
    name: "specifications"
  });

  const nameVal = watch("name");
  const catIdVal = watch("categoryId");
  const seriesIdVal = watch("seriesId");
  const imagesVal = watch("images") || [];
  const finishesVal = watch("finishes") || [];
  const brochureVal = watch("brochure");
  const primaryImageVal = watch("primaryImage");
  const specFieldsVal = watch("specifications") || [];
  const filterDataVal = watch("filterData") || {};

  const skuVal = watch("sku");

  // Auto-generate slug & SKU & SEO suggestions
  useEffect(() => {
    if (nameVal && !isEdit && !duplicateId) {
      const generatedSlug = nameVal
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug);
      setValue("seo.title", `${nameVal} | Vensai Prime`);

      // Auto-generate SKU if SKU is currently empty
      if (!skuVal) {
        const catObj = categories.find(c => c.id === catIdVal);
        const autoSku = generateProductSku(nameVal, catObj?.name);
        setValue("sku", autoSku);
      }
    }
  }, [nameVal, catIdVal, categories, setValue, isEdit, duplicateId, skuVal]);

  // Load standard dropdown options
  useEffect(() => {
    async function loadOptions() {
      try {
        const [cats, bros] = await Promise.all([
          getCategories(true),
          getBrochures(true)
        ]);
        setCategories(cats);
        setBrochures(bros);
      } catch (error) {
        toast.error("Failed to load options");
      }
    }
    loadOptions();
  }, []);

  // Watch Category Selection and load active Series list
  useEffect(() => {
    async function loadSeriesForCategory() {
      if (!catIdVal) {
        setSeriesList([]);
        return;
      }
      
      const cat = categories.find(c => c.id === catIdVal);
      if (cat) {
        setValue("categoryName", cat.name);
        setSelectedCategoryData(cat);

        // Prepopulate Specifications template if this is a new product
        if (specFieldsVal.length === 0 && cat.specificationTemplate) {
          const formattedSpecs = cat.specificationTemplate.map(tmpl => ({
            key: tmpl.key,
            label: tmpl.label,
            value: "",
            unit: tmpl.unit || "",
            order: tmpl.order
          }));
          setValue("specifications", formattedSpecs);
        }
      }

      try {
        const list = await getSeriesByCategory(catIdVal, true);
        setSeriesList(list);
      } catch (error) {
        console.error("Error loading dependent series:", error);
      }
    }

    if (categories.length > 0) {
      loadSeriesForCategory();
    }
  }, [catIdVal, categories, setValue]);

  // Watch seriesId selection and denormalize name
  useEffect(() => {
    if (seriesIdVal && seriesList.length > 0) {
      const series = seriesList.find(s => s.id === seriesIdVal);
      if (series) {
        setValue("seriesName", series.name);
      }
    }
  }, [seriesIdVal, seriesList, setValue]);

  // Load product data (edit or duplicate mode)
  useEffect(() => {
    async function loadProductData() {
      const targetId = editId || duplicateId;
      if (!targetId) {
        setLoading(false);
        return;
      }

      if (categories.length === 0) return;

      try {
        const prod = await getProduct(targetId);
        if (prod) {
          reset({
            name: duplicateId ? `${prod.name} (Copy)` : prod.name,
            slug: duplicateId ? `${prod.slug}-copy` : prod.slug,
            sku: duplicateId ? "" : prod.sku,
            categoryId: prod.categoryId,
            categoryName: prod.categoryName,
            seriesId: prod.seriesId,
            seriesName: prod.seriesName,
            shortDescription: prod.shortDescription,
            description: prod.description,
            primaryImage: prod.primaryImage,
            images: prod.images || [],
            finishes: prod.finishes || [],
            specifications: prod.specifications || [],
            filterData: prod.filterData || {},
            brochure: prod.brochure,
            featured: prod.featured,
            status: duplicateId ? "draft" : prod.status,
            order: prod.order,
            seo: prod.seo || { title: "", description: "", keywords: [] }
          });
        } else {
          toast.error("Product not found");
        }
      } catch (error) {
        toast.error("Error loading product data");
      } finally {
        setLoading(false);
      }
    }
    
    loadProductData();
  }, [editId, duplicateId, categories, reset]);

  // Warn on dirty state navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Image Upload handler
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setImageUploadProgress(10);
    try {
      const uploadedMetaArray: ImageMetadata[] = [];
      let idx = 1;
      
      for (const file of files) {
        // Upload images one by one or show status
        const progressOffset = ((idx - 1) / files.length) * 100;
        const progressWeight = 1 / files.length;

        const imgGroup = await uploadProductImageGroup(productId, file, (p) => {
          setImageUploadProgress(Math.round(progressOffset + p * progressWeight));
        });

        const newMeta: ImageMetadata = {
          url: imgGroup.optimized.url,
          thumbnailUrl: imgGroup.thumbnail.url,
          storagePath: imgGroup.optimized.storagePath,
          alt: file.name.split(".")[0],
        };

        uploadedMetaArray.push(newMeta);
        idx++;
      }

      const updatedImages = [...imagesVal, ...uploadedMetaArray];
      setValue("images", updatedImages as any, { shouldDirty: true });

      // Auto-assign primary image if none currently exists
      if (!primaryImageVal && updatedImages.length > 0) {
        setValue("primaryImage", updatedImages[0] as any);
      }

      toast.success("Images uploaded successfully");
    } catch (error) {
      toast.error("Image upload failed");
    } finally {
      setImageUploadProgress(null);
    }
  };

  const handleRemoveImage = async (index: number) => {
    const target = imagesVal[index];
    try {
      // Delete optimized version
      await deleteStorageFile(target.storagePath);
      // Delete thumbnail if present
      if (target.thumbnailUrl) {
        const thumbPath = target.storagePath.replace("/optimized/", "/thumbnails/").replace("-optimized.webp", "-thumbnail.webp");
        await deleteStorageFile(thumbPath);
      }
      
      const newImages = imagesVal.filter((_: any, idx: number) => idx !== index);
      setValue("images", newImages, { shouldDirty: true });

      // If removed was primary, re-assign first remaining
      if (primaryImageVal?.storagePath === target.storagePath) {
        setValue("primaryImage", newImages[0] || null);
      }

      toast.success("Image deleted");
    } catch (error) {
      toast.error("Failed to delete image file");
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    setValue("primaryImage", imagesVal[index], { shouldDirty: true });
    toast.success("Primary image assigned");
  };

  const handleMoveImage = (index: number, direction: "left" | "right") => {
    if (direction === "left" && index === 0) return;
    if (direction === "right" && index === imagesVal.length - 1) return;

    const newIndex = direction === "left" ? index - 1 : index + 1;
    const newImages = [...imagesVal];
    const temp = newImages[index];
    newImages[index] = newImages[newIndex];
    newImages[newIndex] = temp;
    setValue("images", newImages, { shouldDirty: true });
  };

  const handleImageAltChange = (index: number, alt: string) => {
    const newImages = [...imagesVal];
    newImages[index].alt = alt;
    setValue("images", newImages, { shouldDirty: true });
  };

  const handleImageFinishChange = (index: number, finishId: string) => {
    const newImages = [...imagesVal];
    newImages[index].finishId = finishId === "none" ? undefined : finishId;
    setValue("images", newImages, { shouldDirty: true });
  };

  // Finishes Manager
  const handleAddFinish = () => {
    const nextOrder = finishesVal.length + 1;
    const newFinishId = doc(collection(db, "temp")).id;
    appendFinish({
      id: newFinishId,
      name: "",
      slug: "",
      code: "",
      swatch: "#ffffff",
      available: true,
      isDefault: finishesVal.length === 0, // Make default if first finish
      order: nextOrder
    });
  };

  const handleSetDefaultFinish = (index: number) => {
    const updated = finishesVal.map((f: any, idx: number) => ({
      ...f,
      isDefault: idx === index
    }));
    setValue("finishes", updated, { shouldDirty: true });
    toast.success(`Default finish updated to "${finishesVal[index].name || 'Finish'}"`);
  };

  // Quick Series creation from Product
  const handleQuickCreateSeries = async () => {
    if (!quickSeriesName.trim()) {
      toast.error("Series Name is required");
      return;
    }
    try {
      const slug = quickSeriesName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      const newId = await createSeries({
        name: quickSeriesName.trim(),
        code: quickSeriesCode.trim() || `WPC-${slug.slice(0, 3).toUpperCase()}`,
        slug,
        categoryId: catIdVal,
        categoryName: watch("categoryName"),
        description: "",
        image: null,
        order: seriesList.length + 1,
        status: "active"
      });

      toast.success(`Series "${quickSeriesName}" created.`);
      
      // Reload Series list
      const list = await getSeriesByCategory(catIdVal, true);
      setSeriesList(list);

      // Select new series
      setValue("seriesId", newId);
      setQuickSeriesName("");
      setQuickSeriesCode("");
      setQuickSeriesOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create series");
    }
  };

  // Brochure Upload
  const handleBrochureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF brochure");
      return;
    }

    setBrochureUploadProgress(10);
    try {
      const meta = await uploadRawFile(`brochures/${catIdVal}`, file, (p) => {
        setBrochureUploadProgress(Math.max(10, p));
      });

      const title = newBrochureTitle.trim() || file.name.split(".")[0];
      const brochureId = await createBrochure({
        title,
        categoryId: catIdVal,
        fileName: file.name,
        fileUrl: meta.url,
        storagePath: meta.storagePath,
        fileSize: file.size,
        status: "active"
      });

      setValue("brochure", {
        id: brochureId,
        title,
        fileUrl: meta.url
      }, { shouldDirty: true });

      // Reload brochures list
      const list = await getBrochures(true);
      setBrochures(list);

      toast.success("Brochure uploaded and associated");
      setNewBrochureTitle("");
    } catch (error) {
      toast.error("Brochure upload failed");
    } finally {
      setBrochureUploadProgress(null);
    }
  };

  // Form Submit
  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true);
    try {
      // Pre-validation checks
      if (!values.primaryImage) {
        toast.error("Please select a primary product image before publishing.");
        setSubmitting(false);
        return;
      }

      // Compile filterData based on specifications & finishes
      const compiledFilterData: Record<string, any> = { ...filterDataVal };
      
      // Auto compile seriesId
      compiledFilterData.seriesId = values.seriesId;

      // Extract specifications values and insert into filterData if configured as filter
      if (selectedCategoryData?.filterConfig) {
        selectedCategoryData.filterConfig.forEach(cfg => {
          if (cfg.source === "product") {
            const spec = values.specifications.find(s => s.key === cfg.key);
            if (spec && spec.value) {
              if (cfg.type === "number") {
                compiledFilterData[cfg.key] = parseFloat(spec.value) || 0;
              } else if (cfg.type === "boolean") {
                compiledFilterData[cfg.key] = spec.value.toLowerCase() === "yes" || spec.value.toLowerCase() === "true";
              } else {
                compiledFilterData[cfg.key] = spec.value;
              }
            }
          }
        });
      }

      // Auto compile finishes into filterData
      compiledFilterData.finishes = values.finishes.map(f => f.name);

      const finalPayload = {
        ...values,
        filterData: compiledFilterData
      };

      if (isEdit) {
        await updateProduct(productId, finalPayload as any);
        toast.success("Product updated successfully");
      } else {
        await setDoc(doc(db, "products", productId), {
          ...finalPayload,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success("Product created successfully");
      }
      reset(values); // clear dirty state
      navigate({ to: "/admin/products" });
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
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
    <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-10">
      {/* Top CTA Bar */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#121212] md:text-3xl">
            {isEdit ? `Edit Product / ${watch("name")}` : "Add Product"}
          </h1>
          <p className="text-xs text-[#776E63] font-mono uppercase tracking-wider mt-1">
            Product ID: {productId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-sm border-[#E5E2DC] text-[#211C17]">
            <Link to="/admin/products">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            size="sm"
            className="rounded-sm bg-[#211C17] hover:bg-[#4E3F30] text-white"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Product" : "Publish Product"}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Side Main Form */}
        <div className="space-y-8 lg:col-span-8">
          {/* Section 1: Organization */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">1. Product Organization</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Categorize catalogue item
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Category *</Label>
                <Controller
                  control={control}
                  name="categoryId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-sm border-[#E5E2DC]">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.categoryId && <p className="text-[10px] text-red-500 font-mono mt-0.5">{String((errors.categoryId as any)?.message || "")}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Series *</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Controller
                      control={control}
                      name="seriesId"
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!catIdVal}
                        >
                          <SelectTrigger className="rounded-sm border-[#E5E2DC] disabled:opacity-50">
                            <SelectValue placeholder={catIdVal ? "Select Series" : "Select category first"} />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                            {seriesList.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  
                  {catIdVal && (
                    <Dialog open={quickSeriesOpen} onOpenChange={setQuickSeriesOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" className="rounded-sm border-[#E5E2DC] h-10 w-10 shrink-0" title="Quick create Series">
                          <PlusCircle className="h-4 w-4 text-[#8B7D6B]" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white border-[#E5E2DC] rounded-sm max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle className="font-display">Quick Create Series</DialogTitle>
                          <DialogDescription className="font-mono text-[10px] text-[#776E63] uppercase">
                            Adding series to: {watch("categoryName")}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase font-mono font-semibold text-[#5B554C]">Series Name *</Label>
                            <Input
                              placeholder="e.g. 11 Series"
                              value={quickSeriesName}
                              onChange={(e) => setQuickSeriesName(e.target.value)}
                              className="rounded-sm border-[#E5E2DC]"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs uppercase font-mono font-semibold text-[#5B554C]">Series Code</Label>
                            <Input
                              placeholder="e.g. WPC-11"
                              value={quickSeriesCode}
                              onChange={(e) => setQuickSeriesCode(e.target.value)}
                              className="rounded-sm border-[#E5E2DC]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" size="sm" onClick={() => setQuickSeriesOpen(false)} className="font-mono text-xs">
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleQuickCreateSeries} className="rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30]">
                            Create Series
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                {errors.seriesId && <p className="text-[10px] text-red-500 font-mono mt-0.5">{String((errors.seriesId as any)?.message || "")}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Basic Info */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">2. Basic Information</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Title and descriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Product Name *</Label>
                  <Input
                    placeholder="e.g. WPC Louvre Panel"
                    {...register("name")}
                    className={`rounded-sm border-[#E5E2DC] ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-mono mt-0.5">{String((errors.name as any)?.message || "")}</p>}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-black font-mono">SKU / Code *</Label>
                    <span className="text-[10px] text-neutral-400 font-mono">Auto-generated</span>
                  </div>
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="e.g. WPC-CLP-1104"
                      {...register("sku")}
                      className="rounded-lg border-neutral-200 bg-white font-mono text-xs text-black"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const catObj = categories.find(c => c.id === catIdVal);
                        const autoSku = generateProductSku(nameVal || "PROD", catObj?.name);
                        setValue("sku", autoSku, { shouldDirty: true });
                        toast.success(`Generated SKU: ${autoSku}`);
                      }}
                      className="rounded-lg border-neutral-200 text-xs font-semibold shrink-0 hover:bg-neutral-100 text-black px-2.5"
                      title="Auto-generate SKU"
                    >
                      <Sparkles className="mr-1 h-3.5 w-3.5 text-black" /> Auto
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Slug *</Label>
                <Input
                  placeholder="wpc-louvre-panel"
                  {...register("slug")}
                  className={`rounded-sm border-[#E5E2DC] ${errors.slug ? "border-red-500" : ""}`}
                />
                {errors.slug && <p className="text-[10px] text-red-500 font-mono mt-0.5">{String((errors.slug as any)?.message || "")}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Short Blurb</Label>
                <Input
                  placeholder="A quick 1-sentence sales teaser..."
                  {...register("shortDescription")}
                  className="rounded-sm border-[#E5E2DC]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Product Description</Label>
                <Textarea
                  placeholder="Full architectural specs, material properties, and design instructions..."
                  {...register("description")}
                  className="rounded-sm border-[#E5E2DC] min-h-[140px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Media Manager */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">3. Product Media Manager</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Manage finishes and listing images (first is primary by default)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image upload box */}
              <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E5E2DC] bg-white p-8 text-center transition-all hover:bg-neutral-50/50">
                {imageUploadProgress !== null ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-[#8B7D6B]" />
                    <p className="font-mono text-[10px] text-[#776E63]">Uploading & Resizing WebP {imageUploadProgress}%</p>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-[#776E63]/60" />
                    <span className="font-mono text-xs text-[#211C17] font-semibold">Upload Product Photos</span>
                    <span className="font-mono text-[9px] text-[#776E63] uppercase">Drag multiple files here</span>
                    <input type="file" multiple accept="image/*" onChange={handleImagesUpload} className="hidden" />
                  </label>
                )}
              </div>

              {/* Uploaded Images List */}
              {imagesVal.length > 0 && (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  {imagesVal.map((img: any, index: number) => {
                    const isPrimary = primaryImageVal?.storagePath === img.storagePath;
                    return (
                      <div key={index} className={`relative flex flex-col rounded-lg border bg-neutral-50 p-3 overflow-hidden ${isPrimary ? "border-[#8B7D6B] ring-1 ring-[#8B7D6B]" : "border-[#E5E2DC]"}`}>
                        <div className="relative aspect-square w-full rounded overflow-hidden bg-neutral-200 border">
                          <img src={img.url} alt={img.alt} className="h-full w-full object-cover" />
                          <Badge variant={isPrimary ? "default" : "secondary"} className="absolute left-2 top-2 font-mono text-[8px] uppercase tracking-wider">
                            {isPrimary ? "Primary" : `Img 0${index + 1}`}
                          </Badge>
                        </div>

                        {/* Image Metadata & Associations */}
                        <div className="mt-3 space-y-2">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-wider font-mono text-neutral-500">Alt Tag</Label>
                            <Input
                              value={img.alt}
                              onChange={(e) => handleImageAltChange(index, e.target.value)}
                              className="h-7 text-[10px] rounded-sm border-[#E5E2DC]"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold uppercase tracking-wider font-mono text-neutral-500">Finish Association</Label>
                            <Select
                              value={img.finishId || "none"}
                              onValueChange={(val) => handleImageFinishChange(index, val)}
                            >
                              <SelectTrigger className="h-7 text-[10px] rounded-sm border-[#E5E2DC]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-[#E5E2DC] text-[10px] font-mono">
                                <SelectItem value="none">General Listing Card</SelectItem>
                                {finishesVal.map((f: any) => (
                                  <SelectItem key={f.id} value={f.id}>{f.name || f.slug || "Unnamed Finish"}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Reordering and Actions */}
                        <div className="mt-3 flex items-center justify-between border-t pt-3.5">
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              disabled={index === 0}
                              onClick={() => handleMoveImage(index, "left")}
                              className="h-6 w-6 p-0 border-[#E5E2DC]"
                            >
                              ←
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              disabled={index === imagesVal.length - 1}
                              onClick={() => handleMoveImage(index, "right")}
                              className="h-6 w-6 p-0 border-[#E5E2DC]"
                            >
                              →
                            </Button>
                          </div>
                          
                          <div className="flex gap-1.5">
                            {!isPrimary && (
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() => handleSetPrimaryImage(index)}
                                className="h-6 text-[9px] font-mono rounded-sm border-[#E5E2DC] text-neutral-700 hover:text-black"
                              >
                                Set Primary
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={() => handleRemoveImage(index)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 4: Finishes Manager */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">4. Product Finishes / Variants</CardTitle>
                <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                  Add available colors (e.g. Rosewood, Walnut)
                </CardDescription>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={handleAddFinish}
                className="rounded-sm border-[#E5E2DC] font-mono text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Finish
              </Button>
            </CardHeader>
            <CardContent>
              {finishFields.length === 0 ? (
                <div className="border border-dashed rounded-lg bg-[#FAF8F5]/30 p-8 text-center text-xs text-muted-foreground font-mono">
                  No finishes defined yet. Click "+ Add Finish" to begin.
                </div>
              ) : (
                <div className="space-y-4">
                  {finishFields.map((field, index) => {
                    const isDefault = finishesVal[index]?.isDefault;
                    return (
                      <div key={field.id} className="flex flex-col gap-4 p-4 rounded-lg border border-[#E5E2DC] bg-white sm:flex-row sm:items-center">
                        <div className="grid flex-1 gap-4 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Finish Name</Label>
                            <Input
                              placeholder="e.g. Rosewood"
                              {...register(`finishes.${index}.name` as const)}
                              onChange={(e) => {
                                const val = e.target.value;
                                setValue(`finishes.${index}.name`, val);
                                setValue(`finishes.${index}.slug`, val.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                              }}
                              className="h-8 rounded-sm text-xs border-[#E5E2DC]"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Code</Label>
                            <Input
                              placeholder="e.g. WPC-ROSE"
                              {...register(`finishes.${index}.code` as const)}
                              className="h-8 rounded-sm text-xs border-[#E5E2DC] font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Swatch (Hex Color)</Label>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="color"
                                {...register(`finishes.${index}.swatch` as const)}
                                className="h-8 w-10 p-0.5 rounded-sm border-[#E5E2DC] cursor-pointer"
                              />
                              <Input
                                placeholder="#8B7D6B"
                                {...register(`finishes.${index}.swatch` as const)}
                                className="h-8 rounded-sm text-xs border-[#E5E2DC] font-mono w-24"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-start gap-6 pt-4 sm:pt-6">
                            <div className="flex items-center gap-2">
                              <Controller
                                control={control}
                                name={`finishes.${index}.available` as const}
                                render={({ field }) => (
                                  <Switch checked={field.value} onCheckedChange={field.onChange} className="scale-75 origin-left" />
                                )}
                              />
                              <span className="text-[10px] font-bold uppercase font-mono text-[#5B554C]">In Stock</span>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleSetDefaultFinish(index)}
                              className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-black"
                            >
                              {isDefault ? (
                                <>
                                  <Check className="h-4 w-4 text-[#8B7D6B]" />
                                  <span className="text-[10px] font-mono font-bold text-[#8B7D6B] uppercase">Default</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-3.5 w-3.5 border rounded-full border-neutral-300" />
                                  <span className="text-[10px] font-mono text-muted-foreground uppercase">Set Default</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => removeFinish(index)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded self-end sm:self-center"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Dynamic Specifications */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">5. Product Specifications</CardTitle>
                <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                  Configure product specifications (pre-populated by category template)
                </CardDescription>
              </div>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => appendSpec({ key: "", label: "", value: "", unit: "", order: specFields.length + 1 })}
                className="rounded-sm border-[#E5E2DC] font-mono text-xs"
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Spec
              </Button>
            </CardHeader>
            <CardContent>
              {specFields.length === 0 ? (
                <div className="border border-dashed rounded-lg bg-[#FAF8F5]/30 p-8 text-center text-xs text-muted-foreground font-mono">
                  No specifications loaded. Choose a category first to populate templates, or add custom ones.
                </div>
              ) : (
                <div className="space-y-3">
                  {specFields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-center p-3 rounded border border-neutral-100 bg-neutral-50/50">
                      <div className="grid flex-1 gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase tracking-wider font-mono text-neutral-500">Label</Label>
                          <Input
                            placeholder="e.g. Size"
                            {...register(`specifications.${index}.label` as const)}
                            onChange={(e) => {
                              const val = e.target.value;
                              setValue(`specifications.${index}.label`, val);
                              setValue(`specifications.${index}.key`, val.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                            }}
                            className="h-8 rounded-sm text-xs border-[#E5E2DC] bg-white"
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-[9px] font-bold uppercase tracking-wider font-mono text-neutral-500">Value</Label>
                          <Input
                            placeholder="e.g. 2900 x 160 mm"
                            {...register(`specifications.${index}.value` as const)}
                            className="h-8 rounded-sm text-xs border-[#E5E2DC] bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold uppercase tracking-wider font-mono text-neutral-500">Unit</Label>
                          <Input
                            placeholder="e.g. mm"
                            {...register(`specifications.${index}.unit` as const)}
                            className="h-8 rounded-sm text-xs border-[#E5E2DC] bg-white"
                          />
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => removeSpec(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side Settings Panel */}
        <div className="space-y-8 lg:col-span-4 lg:sticky lg:top-20">
          {/* Publishing Controls */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Publishing Parameters</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Manage visibility state
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Catalog Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-sm border-[#E5E2DC]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                        <SelectItem value="draft">Draft (Private)</SelectItem>
                        <SelectItem value="published">Published (Public)</SelectItem>
                        <SelectItem value="hidden">Hidden (Archive)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex items-center justify-between rounded border border-neutral-100 p-3 bg-neutral-50/50">
                <div>
                  <Label className="text-xs font-semibold text-[#121212]">Featured product</Label>
                  <p className="text-[9px] font-mono text-muted-foreground mt-0.5">Showcase on homepage</p>
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
            </CardContent>
          </Card>

          {/* Brochures Association */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Product Brochure PDF</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Link catalogues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {brochureVal ? (
                <div className="rounded border bg-neutral-50 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-5 w-5 text-[#8B7D6B] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-semibold block text-neutral-800 truncate">{brochureVal.title}</span>
                      <a href={brochureVal.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-blue-600 hover:underline">
                        View uploaded PDF
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => setValue("brochure", null, { shouldDirty: true })}
                    className="text-red-500 text-[10px] font-mono h-6 hover:bg-red-50 uppercase tracking-wider"
                  >
                    Unlink Brochure
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Select Existing Brochure</Label>
                    <Select
                      onValueChange={(val) => {
                        if (val === "none") {
                          setValue("brochure", null, { shouldDirty: true });
                          return;
                        }
                        const bro = brochures.find(b => b.id === val);
                        if (bro) {
                          setValue("brochure", {
                            id: bro.id,
                            title: bro.title,
                            fileUrl: bro.fileUrl
                          }, { shouldDirty: true });
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-sm border-[#E5E2DC] text-xs">
                        <SelectValue placeholder="Link brochure" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E5E2DC] text-xs font-mono">
                        <SelectItem value="none">No Brochure Associated</SelectItem>
                        {brochures.map(b => (
                          <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Upload New Brochure</Label>
                    <Input
                      placeholder="e.g. WPC Catalogue 2026"
                      value={newBrochureTitle}
                      onChange={(e) => setNewBrochureTitle(e.currentTarget.value)}
                      className="rounded-sm border-[#E5E2DC] text-xs h-8"
                    />
                    
                    <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#E5E2DC] bg-white p-4 text-center transition-all hover:bg-neutral-50/50">
                      {brochureUploadProgress !== null ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <Loader2 className="h-5 w-5 animate-spin text-[#8B7D6B]" />
                          <p className="font-mono text-[9px] text-[#776E63]">Uploading {brochureUploadProgress}%</p>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center gap-1">
                          <Upload className="h-4 w-4 text-[#776E63]/60" />
                          <span className="font-mono text-[10px] text-[#211C17] font-semibold">Upload PDF File</span>
                          <input type="file" accept="application/pdf" onChange={handleBrochureUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO Details */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Search Engine Optimization</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Keywords and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">SEO Page Title</Label>
                <Input
                  placeholder="e.g. WPC Louvre panel | Vensai Prime"
                  {...register("seo.title")}
                  className="rounded-sm border-[#E5E2DC] text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase tracking-wider font-mono text-neutral-500">Meta Description</Label>
                <Textarea
                  placeholder="Description for search snippets..."
                  {...register("seo.description")}
                  className="rounded-sm border-[#E5E2DC] text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
