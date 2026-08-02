import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getProducts, deleteProduct, updateProduct, duplicateProduct } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getSeriesByCategory } from "@/services/seriesService";
import { Product, Category, Series } from "@/types/catalogue";
import { DocumentSnapshot } from "firebase/firestore";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  ArrowUpDown,
  Download,
  Upload,
  Filter,
  SlidersHorizontal,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProductsPage,
});

const PAGE_SIZE = 10;

function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFeatured, setSelectedFeatured] = useState<string>("all");

  // Selection states
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Pagination states
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [cursorHistory, setCursorHistory] = useState<DocumentSnapshot[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  // Load categories initially
  useEffect(() => {
    async function loadFilters() {
      try {
        const cats = await getCategories(true);
        setCategories(cats);
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    }
    loadFilters();
  }, []);

  // Dependent Series Dropdown logic
  useEffect(() => {
    async function loadSeries() {
      if (selectedCategory === "all") {
        setSeriesList([]);
        setSelectedSeries("all");
        return;
      }
      try {
        const list = await getSeriesByCategory(selectedCategory, true);
        setSeriesList(list);
        setSelectedSeries("all");
      } catch (error) {
        console.error("Error loading dependent series:", error);
      }
    }
    loadSeries();
  }, [selectedCategory]);

  const loadProductsList = async (cursor?: DocumentSnapshot, isNext = true) => {
    try {
      setLoading(true);
      
      const options: any = {
        pageSize: PAGE_SIZE,
        lastDoc: cursor
      };

      if (selectedCategory !== "all") options.categoryId = selectedCategory;
      if (selectedSeries !== "all") options.seriesId = selectedSeries;
      if (selectedStatus !== "all") options.status = selectedStatus;
      if (selectedFeatured !== "all") options.featured = selectedFeatured === "yes";
      if (searchTerm.trim()) options.search = searchTerm.trim();

      const result = await getProducts(options);
      
      setProducts(result.products);
      setHasMore(result.products.length === PAGE_SIZE);
      
      if (result.products.length > 0) {
        setLastDoc(result.lastDoc);
      } else {
        setLastDoc(null);
      }

    } catch (error) {
      toast.error("Failed to load products list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLastDoc(null);
    setCursorHistory([]);
    setCurrentPage(1);
    loadProductsList(undefined, true);
  }, [selectedCategory, selectedSeries, selectedStatus, selectedFeatured, searchTerm]);

  const handleNextPage = () => {
    if (!hasMore || !lastDoc) return;
    setCursorHistory([...cursorHistory, lastDoc]);
    setCurrentPage(currentPage + 1);
    loadProductsList(lastDoc, true);
  };

  const handlePrevPage = () => {
    if (currentPage <= 1 || cursorHistory.length === 0) return;
    const newHistory = [...cursorHistory];
    const prevCursor = newHistory.pop();
    const beforePrevCursor = newHistory.length > 0 ? newHistory[newHistory.length - 1] : undefined;
    
    setCursorHistory(newHistory);
    setCurrentPage(currentPage - 1);
    loadProductsList(beforePrevCursor, false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) return;
    try {
      await deleteProduct(id);
      toast.success(`Product "${name}" deleted`);
      loadProductsList();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "published" ? "draft" : "published";
    try {
      await updateProduct(product.id, { status: newStatus });
      toast.success(`Product status updated to ${newStatus}`);
      loadProductsList();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await updateProduct(product.id, { featured: !product.featured });
      toast.success(`Product ${!product.featured ? "marked as featured" : "unfeatured"}`);
      loadProductsList();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      toast.loading("Duplicating product...");
      const newId = await duplicateProduct(product.id);
      toast.dismiss();
      toast.success("Product duplicated successfully!");
      navigate({ to: `/admin/products/$id`, params: { id: newId } });
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Failed to duplicate product");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds([...selectedProductIds, id]);
    } else {
      setSelectedProductIds(selectedProductIds.filter(item => item !== id));
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#211C17] sm:text-3xl">Products</h1>
          <p className="text-xs text-[#776E63] font-medium mt-0.5">Manage product catalogue, series finishes and availability.</p>
        </div>
        
        {/* Top Right Action Buttons matching homepage theme */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Exporting products CSV...")}
            className="h-10 rounded-xl border-[#E5E2DC] bg-white font-medium text-xs text-[#211C17] hover:bg-[#FAF8F5] transition-all flex items-center gap-2 shadow-xs"
          >
            <Download className="h-4 w-4 text-[#776E63]" />
            <span>Export</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info("Import feature ready")}
            className="h-10 rounded-xl border-[#E5E2DC] bg-white font-medium text-xs text-[#211C17] hover:bg-[#FAF8F5] transition-all flex items-center gap-2 shadow-xs"
          >
            <Upload className="h-4 w-4 text-[#776E63]" />
            <span>Import</span>
          </Button>
          
          <Button
            asChild
            size="sm"
            className="h-10 rounded-xl bg-[#211C17] hover:bg-[#3D332A] text-white font-medium text-xs transition-all shadow-md shadow-[#211C17]/15 flex items-center gap-2 px-4"
          >
            <Link to="/admin/products/new">
              <Plus className="h-4 w-4 text-[#EADFCE]" />
              <span>Add Product</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="rounded-2xl border border-[#E5E2DC] bg-white shadow-xs overflow-hidden p-6 space-y-6">
        
        {/* Tab Filters (All Products, Active, Draft, Featured) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E2DC] pb-4">
          {[
            { id: "all", label: "All Products" },
            { id: "published", label: "Active" },
            { id: "draft", label: "Draft / Hidden" },
            { id: "featured", label: "Featured" }
          ].map((tab) => {
            const isActive = selectedStatus === tab.id || (tab.id === "featured" && selectedFeatured === "yes");
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === "featured") {
                    setSelectedFeatured(selectedFeatured === "yes" ? "all" : "yes");
                  } else {
                    setSelectedStatus(tab.id);
                    setSelectedFeatured("all");
                  }
                }}
                className={cn(
                  "px-4 py-2 text-xs font-semibold rounded-lg transition-all",
                  isActive
                    ? "bg-[#211C17] text-white shadow-sm"
                    : "text-[#776E63] hover:text-[#211C17] hover:bg-[#FAF8F5]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Filter & Search Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-xs text-[#776E63]">
            <span className="font-bold text-[#211C17] text-sm">{products.length} Products</span>
            <div className="flex items-center gap-2">
              <span>Show</span>
              <div className="px-2.5 py-1 rounded-lg border border-[#E5E2DC] bg-white text-[#211C17] font-semibold text-xs">
                {PAGE_SIZE}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 rounded-xl border-[#E5E2DC] bg-white text-xs text-[#211C17] w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E2DC] rounded-xl text-xs font-mono">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-[#E5E2DC] bg-white text-xs text-[#211C17] hover:bg-[#FAF8F5] flex items-center gap-2 px-3"
            >
              <Filter className="h-3.5 w-3.5 text-[#776E63]" />
              <span>Filter</span>
            </Button>

            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 h-3.5 w-3.5 text-[#776E63] pointer-events-none" />
              <input
                type="text"
                placeholder="Search Products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-60 rounded-xl bg-[#FAF8F5] border border-[#E5E2DC] pl-9 pr-3 text-xs text-[#211C17] placeholder-[#776E63] focus:outline-none focus:border-[#8B7D6B] focus:ring-1 focus:ring-[#8B7D6B] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-xl border border-[#E5E2DC] overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#FAF8F5]">
              <TableRow className="border-b border-[#E5E2DC] hover:bg-[#FAF8F5]">
                <TableHead className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5E2DC] text-[#211C17] focus:ring-[#8B7D6B]"
                  />
                </TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs">Product Name</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Image</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs">Category & Series</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Status</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Finishes</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs">SKU</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-[#E5E2DC]/60">
                    <TableCell colSpan={8} className="py-4 px-6">
                      <Skeleton className="h-10 w-full bg-[#FAF8F5] rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-[#776E63] font-medium">
                    No products match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <TableRow
                      key={product.id}
                      className={cn(
                        "border-b border-[#E5E2DC]/60 hover:bg-[#FAF8F5] transition-colors text-xs text-[#211C17]",
                        isSelected && "bg-[#F5F1EA]"
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectOne(product.id, e.target.checked)}
                          className="h-4 w-4 rounded border-[#E5E2DC] text-[#211C17] focus:ring-[#8B7D6B]"
                        />
                      </TableCell>

                      {/* Product Name & Details */}
                      <TableCell className="font-medium text-[#211C17] py-3.5">
                        <div className="flex flex-col">
                          <Link
                            to="/admin/products/$id"
                            params={{ id: product.id }}
                            className="font-semibold text-[#211C17] hover:text-[#8B7D6B] transition-colors"
                          >
                            {product.name}
                          </Link>
                          <span className="text-[10px] text-[#776E63] font-mono">/{product.slug}</span>
                        </div>
                      </TableCell>

                      {/* Image Thumbnail */}
                      <TableCell className="text-center">
                        <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#FAF8F5]">
                          {product.primaryImage ? (
                            <img src={product.primaryImage.thumbnailUrl || product.primaryImage.url} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-[#8B7D6B]/50" />
                          )}
                        </div>
                      </TableCell>

                      {/* Category & Series */}
                      <TableCell>
                        <div className="flex flex-col text-[#211C17]">
                          <span className="font-medium text-[#211C17]">{product.categoryName || "Uncategorized"}</span>
                          <span className="text-[10px] text-[#776E63]">{product.seriesName || "Standard"}</span>
                        </div>
                      </TableCell>

                      {/* Status Toggle Switch */}
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              product.status === "published" ? "bg-[#211C17]" : "bg-[#E5E2DC]"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                                product.status === "published" ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            product.status === "published" ? "text-[#211C17]" : "text-[#776E63]"
                          )}>
                            {product.status === "published" ? "Active" : "Draft"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Finishes Count */}
                      <TableCell className="text-center font-medium text-[#211C17]">
                        {product.finishes ? product.finishes.length : 0} Finishes
                      </TableCell>

                      {/* SKU */}
                      <TableCell className="font-mono text-[11px] text-[#776E63]">
                        {product.sku || "N/A"}
                      </TableCell>

                      {/* Actions Menu */}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#776E63] hover:text-[#211C17] rounded-lg">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl bg-white border-[#E5E2DC]">
                            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[#776E63]">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="text-xs cursor-pointer">
                              <Link to="/admin/products/$id" params={{ id: product.id }}>
                                <Edit2 className="mr-2 h-3.5 w-3.5 text-[#776E63]" /> Edit Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(product)} className="text-xs cursor-pointer">
                              <Copy className="mr-2 h-3.5 w-3.5 text-[#776E63]" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleFeatured(product)} className="text-xs cursor-pointer">
                              {product.featured ? (
                                <><StarOff className="mr-2 h-3.5 w-3.5 text-amber-600" /> Unfeature</>
                              ) : (
                                <><Star className="mr-2 h-3.5 w-3.5 text-amber-600" /> Feature</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#E5E2DC]" />
                            <DropdownMenuItem onClick={() => handleDelete(product.id, product.name)} className="text-xs text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                              <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-2">
          <div className="text-xs text-[#776E63] font-medium">
            Page <span className="font-bold text-[#211C17]">{currentPage}</span>
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage <= 1 || loading}
              className="h-8 rounded-lg border-[#E5E2DC] bg-white text-xs font-semibold text-[#211C17] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>

            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (p === currentPage) return;
                  if (p < currentPage) handlePrevPage();
                  else handleNextPage();
                }}
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-bold transition-all",
                  currentPage === p
                    ? "bg-[#211C17] text-white shadow-xs"
                    : "bg-white border border-[#E5E2DC] text-[#776E63] hover:bg-[#FAF8F5]"
                )}
              >
                {p}
              </button>
            ))}

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={!hasMore || loading}
              className="h-8 rounded-lg border-[#E5E2DC] bg-white text-xs font-semibold text-[#211C17] disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
