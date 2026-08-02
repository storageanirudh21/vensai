import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getCategories, deleteCategory, updateCategory } from "@/services/categoryService";
import { Category } from "@/types/catalogue";
import {
  FolderTree,
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/categories/")({
  component: AdminCategoriesPage,
});

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  
  const navigate = useNavigate();

  const loadCategories = async () => {
    try {
      setLoading(true);
      const list = await getCategories(true);
      setCategories(list);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success(`Category "${name}" deleted successfully`);
      loadCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  const handleToggleStatus = async (category: Category) => {
    const newStatus = category.status === "active" ? "hidden" : "active";
    try {
      await updateCategory(category.id, { status: newStatus });
      toast.success(`Category status updated to ${newStatus}`);
      loadCategories();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDuplicate = async (category: Category) => {
    navigate({
      to: `/admin/categories/new`,
      search: { duplicateId: category.id }
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cat.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#211C17] sm:text-3xl">Categories</h1>
          <p className="text-xs text-[#776E63] font-medium mt-0.5">Organize categories, product series, and catalogue hierarchy.</p>
        </div>
        <Button asChild size="sm" className="h-10 rounded-xl bg-[#211C17] hover:bg-[#3D332A] text-white font-medium text-xs shadow-md shadow-[#211C17]/15 px-4 flex items-center gap-2">
          <Link to="/admin/categories/new">
            <Plus className="h-4 w-4 text-[#EADFCE]" /> Add Category
          </Link>
        </Button>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl border border-[#E5E2DC] bg-white shadow-xs overflow-hidden p-6 space-y-6">
        
        {/* Filter Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex items-center w-full max-w-sm">
            <Search className="absolute left-3.5 h-4 w-4 text-[#776E63] pointer-events-none" />
            <input
              type="text"
              placeholder="Search Categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl bg-[#FAF8F5] border border-[#E5E2DC] pl-10 pr-4 text-xs text-[#211C17] placeholder-[#776E63] focus:outline-none focus:border-[#8B7D6B] focus:ring-2 focus:ring-[#8B7D6B]/20 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {(["all", "active", "hidden"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all",
                  statusFilter === status
                    ? "bg-[#211C17] text-white shadow-sm"
                    : "text-[#776E63] hover:text-[#211C17] hover:bg-[#FAF8F5]"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Category Table */}
        <div className="rounded-xl border border-[#E5E2DC] overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-[#FAF8F5]">
              <TableRow className="border-b border-[#E5E2DC] hover:bg-[#FAF8F5]">
                <TableHead className="w-16 text-center">Image</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs">Category Name</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Series Count</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Products</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Status</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-center">Display Order</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs">Updated</TableHead>
                <TableHead className="font-semibold text-[#5B554C] text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-b border-[#E5E2DC]/60">
                    <TableCell colSpan={8} className="py-4 px-6">
                      <Skeleton className="h-10 w-full bg-[#FAF8F5] rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-[#776E63] font-medium">
                    {searchTerm || statusFilter !== "all" ? "No matching categories found." : "No categories created yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((cat) => (
                  <TableRow key={cat.id} className="border-b border-[#E5E2DC]/60 hover:bg-[#FAF8F5] transition-colors text-xs text-[#211C17]">
                    <TableCell className="text-center">
                      <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E2DC] bg-[#FAF8F5]">
                        {cat.coverImage?.url ? (
                          <img src={cat.coverImage.url} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <FolderTree className="h-5 w-5 text-[#8B7D6B]/50" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#211C17] py-3.5">
                      <div className="flex flex-col">
                        <Link to="/admin/categories/$id" params={{ id: cat.id }} className="font-semibold text-[#211C17] hover:text-[#8B7D6B] transition-colors">
                          {cat.name}
                        </Link>
                        <span className="text-[10px] text-[#776E63] font-mono">/{cat.slug}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-bold text-[#211C17]">{cat.seriesCount || 0}</TableCell>
                    <TableCell className="text-center font-bold text-[#211C17]">{cat.productCount || 0}</TableCell>
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                          cat.status === "active" ? "bg-[#211C17]" : "bg-[#E5E2DC]"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                            cat.status === "active" ? "translate-x-4" : "translate-x-0"
                          )}
                        />
                      </button>
                    </TableCell>
                    <TableCell className="text-center font-mono font-semibold text-[#211C17]">{cat.order}</TableCell>
                    <TableCell className="text-[#776E63] font-mono text-[11px]">{formatDate(cat.updatedAt)}</TableCell>
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
                            <Link to="/admin/categories/$id" params={{ id: cat.id }}>
                              <Edit2 className="mr-2 h-3.5 w-3.5 text-[#776E63]" /> Edit Category
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(cat)} className="text-xs cursor-pointer">
                            <Copy className="mr-2 h-3.5 w-3.5 text-[#776E63]" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-[#E5E2DC]" />
                          <DropdownMenuItem onClick={() => handleDelete(cat.id, cat.name)} className="text-xs text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                            <Trash2 className="mr-2 h-3.5 w-3.5 text-red-500" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
