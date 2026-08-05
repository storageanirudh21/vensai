import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getProducts, deleteProduct, updateProduct, duplicateProduct, subscribeToProducts } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { getSeriesByCategory } from "@/services/seriesService";
import { Product, Category, Series } from "@/types/catalogue";
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Star,
  StarOff,
  Filter,
  ShoppingBag
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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedSeries, setSelectedSeries] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadCategories();
    setLoading(true);
    const unsubscribe = subscribeToProducts((data) => {
      setProducts(data);
      setLoading(false);
    }, null); // include all for admin

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCategory && selectedCategory !== "all") {
      loadSeries(selectedCategory);
    } else {
      setSeriesList([]);
      setSelectedSeries("all");
    }
  }, [selectedCategory]);

  const loadCategories = async () => {
    try {
      const cats = await getCategories(true);
      setCategories(cats);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  const loadSeries = async (catId: string) => {
    try {
      const list = await getSeriesByCategory(catId, true);
      setSeriesList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { products: data } = await getProducts({ pageSize: 100 });
      setProducts(data);
    } catch (err) {
      toast.error("Failed to load product catalogue");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic filter logic
  const filteredProducts = products.filter(product => {
    const matchSearch = search.trim() === "" || 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(search.toLowerCase())) ||
      product.slug.toLowerCase().includes(search.toLowerCase());

    const matchCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    const matchSeries = selectedSeries === "all" || product.seriesId === selectedSeries;
    const matchStatus = selectedStatus === "all" || product.status === selectedStatus;

    return matchSearch && matchCategory && matchSeries && matchStatus;
  });

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    try {
      await deleteProduct(id);
      toast.success(`Product "${name}" deleted`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const nextStatus = product.status === "published" ? "draft" : "published";
    try {
      await updateProduct(product.id, { status: nextStatus });
      toast.success(`Updated status to ${nextStatus}`);
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: nextStatus } : p));
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    const nextFeatured = !product.featured;
    try {
      await updateProduct(product.id, { featured: nextFeatured });
      toast.success(nextFeatured ? "Added to featured showcase" : "Removed from featured");
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, featured: nextFeatured } : p));
    } catch (err) {
      toast.error("Failed to update featured flag");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newId = await duplicateProduct(id);
      toast.success("Product cloned as draft!");
      loadProducts();
      navigate({ to: `/admin/products/${newId}` });
    } catch (err) {
      toast.error("Cloning failed");
    }
  };

  return (
    <div className="space-y-6 font-sans bg-white">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">Products Catalogue</h1>
            <Badge className="bg-black text-white font-mono text-[10px] uppercase">
              {filteredProducts.length} Items
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">Manage store products, SKUs, images, and inventory parameters.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="h-9 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm px-4">
            <Link to="/admin/products/new">
              <Plus className="mr-1.5 h-4 w-4 text-white" /> Add New Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-black" />
            <Input
              placeholder="Search by Product Name, SKU, or Slug..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9 text-xs rounded-lg border-neutral-200 bg-neutral-50 text-black placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={(val) => { setSelectedCategory(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-[160px] text-xs rounded-lg border-neutral-200 bg-white text-black font-medium">
                <Filter className="mr-1.5 h-3.5 w-3.5 text-black" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-neutral-200 text-xs">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Series Filter */}
            {selectedCategory !== "all" && seriesList.length > 0 && (
              <Select value={selectedSeries} onValueChange={(val) => { setSelectedSeries(val); setCurrentPage(1); }}>
                <SelectTrigger className="h-9 w-[150px] text-xs rounded-lg border-neutral-200 bg-white text-black font-medium">
                  <SelectValue placeholder="All Series" />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200 text-xs">
                  <SelectItem value="all">All Series</SelectItem>
                  {seriesList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-[130px] text-xs rounded-lg border-neutral-200 bg-white text-black font-medium">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-neutral-200 text-xs">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Catalogue Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50 border-b border-neutral-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider">Image</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Product Name & SKU</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Category & Series</TableHead>
              <TableHead className="w-[100px] font-bold text-black text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[100px] font-bold text-black text-[11px] uppercase tracking-wider">Featured</TableHead>
              <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 bg-neutral-100 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 bg-neutral-100 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ShoppingBag className="h-8 w-8 text-black opacity-30" />
                    <p className="text-xs font-bold text-black">No products found</p>
                    <p className="text-[11px] text-neutral-400">Try adjusting your search query or filters.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100">
                  {/* Thumbnail Image */}
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {product.primaryImage?.thumbnailUrl || product.primaryImage?.url ? (
                        <img
                          src={product.primaryImage?.thumbnailUrl || product.primaryImage?.url}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-5 w-5 text-black" />
                      )}
                    </div>
                  </TableCell>

                  {/* Name and SKU */}
                  <TableCell>
                    <div>
                      <Link
                        to="/admin/products/$id"
                        params={{ id: product.id }}
                        className="font-bold text-xs text-black hover:underline"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-neutral-500 font-bold bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded">
                          SKU: {product.sku || "AUTO-GEN"}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">/{product.slug}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Category and Series */}
                  <TableCell>
                    <div className="text-xs">
                      <p className="font-bold text-black">{product.categoryName || "Uncategorized"}</p>
                      {product.seriesName && (
                        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">Series: {product.seriesName}</p>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Toggle */}
                  <TableCell>
                    <button
                      onClick={() => handleToggleStatus(product)}
                      className="cursor-pointer"
                    >
                      <Badge variant={product.status === "published" ? "default" : "secondary"} className={cn(
                        "font-mono text-[9px] uppercase tracking-wider transition-all",
                        product.status === "published" ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      )}>
                        {product.status}
                      </Badge>
                    </button>
                  </TableCell>

                  {/* Featured Toggle */}
                  <TableCell>
                    <button
                      onClick={() => handleToggleFeatured(product)}
                      className="p-1 rounded hover:bg-neutral-100 text-black cursor-pointer"
                      title={product.featured ? "Remove from Featured" : "Mark as Featured"}
                    >
                      {product.featured ? (
                        <Star className="h-4 w-4 fill-black text-black" />
                      ) : (
                        <StarOff className="h-4 w-4 text-neutral-400" />
                      )}
                    </button>
                  </TableCell>

                  {/* Action Menu */}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-neutral-100">
                          <MoreHorizontal className="h-4 w-4 text-black" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-neutral-200 rounded-lg text-xs w-44">
                        <DropdownMenuLabel className="font-bold text-black text-[10px] uppercase">Product Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-neutral-100" />
                        
                        <DropdownMenuItem asChild className="hover:bg-neutral-100 font-semibold cursor-pointer">
                          <Link to="/admin/products/$id" params={{ id: product.id }}>
                            <Edit2 className="mr-2 h-3.5 w-3.5 text-black" /> Edit Details
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => handleDuplicate(product.id)} className="hover:bg-neutral-100 font-semibold cursor-pointer">
                          <Copy className="mr-2 h-3.5 w-3.5 text-black" /> Duplicate Item
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild className="hover:bg-neutral-100 font-semibold cursor-pointer">
                          <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer">
                            <Eye className="mr-2 h-3.5 w-3.5 text-black" /> Preview Page
                          </a>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="bg-neutral-100" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id, product.name)}
                          className="text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5 text-red-600" /> Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3">
            <span className="text-xs text-neutral-500 font-mono">
              Page {currentPage} of {totalPages} ({filteredProducts.length} items)
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg border-neutral-200 text-xs font-semibold text-black"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-black" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 rounded-lg border-neutral-200 text-xs font-semibold text-black"
              >
                Next <ChevronRight className="h-3.5 w-3.5 text-black" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
