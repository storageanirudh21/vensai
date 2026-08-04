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
  Copy
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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories(true);
      setCategories(data);
    } catch (err) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    try {
      await deleteCategory(id);
      toast.success(`Category "${name}" deleted`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      toast.error("Failed to delete category");
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    const nextStatus = cat.status === "active" ? "hidden" : "active";
    try {
      await updateCategory(cat.id, { status: nextStatus });
      toast.success(`Category status set to ${nextStatus}`);
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, status: nextStatus } : c));
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 font-sans bg-white">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">Categories</h1>
            <Badge className="bg-black text-white font-mono text-[10px] uppercase">
              {filteredCategories.length} Categories
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">Manage store product lines, specifications templates, and series.</p>
        </div>
        <Button asChild size="sm" className="h-9 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm px-4">
          <Link to="/admin/categories/new">
            <Plus className="mr-1.5 h-4 w-4 text-white" /> Add New Category
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-black" />
            <Input
              placeholder="Search category title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-neutral-200 bg-neutral-50 text-black placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("all")}
              className={cn("h-8 rounded-lg text-xs font-semibold", statusFilter === "all" ? "bg-black text-white" : "border-neutral-200 text-black")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("active")}
              className={cn("h-8 rounded-lg text-xs font-semibold", statusFilter === "active" ? "bg-black text-white" : "border-neutral-200 text-black")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "hidden" ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter("hidden")}
              className={cn("h-8 rounded-lg text-xs font-semibold", statusFilter === "hidden" ? "bg-black text-white" : "border-neutral-200 text-black")}
            >
              Hidden
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50 border-b border-neutral-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider">Cover</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Category Name & Slug</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Templates & Filters</TableHead>
              <TableHead className="w-[100px] font-bold text-black text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-10 bg-neutral-100 rounded-lg" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 bg-neutral-100 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FolderTree className="h-8 w-8 text-black opacity-30" />
                    <p className="text-xs font-bold text-black">No categories found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100">
                  <TableCell>
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {cat.coverImage?.url ? (
                        <img src={cat.coverImage.url} alt={cat.name} className="h-full w-full object-cover" />
                      ) : (
                        <FolderTree className="h-5 w-5 text-black" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <Link to="/admin/categories/$id" params={{ id: cat.id }} className="font-bold text-xs text-black hover:underline">
                        {cat.name}
                      </Link>
                      <p className="font-mono text-[10px] text-neutral-500 mt-0.5">/{cat.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                      <span className="bg-neutral-100 text-black border border-neutral-200 px-2 py-0.5 rounded font-bold">
                        Specs: {cat.specificationTemplate?.length || 0}
                      </span>
                      <span className="bg-neutral-100 text-black border border-neutral-200 px-2 py-0.5 rounded font-bold">
                        Filters: {cat.filterConfig?.length || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggleStatus(cat)} className="cursor-pointer">
                      <Badge variant={cat.status === "active" ? "default" : "secondary"} className={cn(
                        "font-mono text-[9px] uppercase tracking-wider",
                        cat.status === "active" ? "bg-black text-white" : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                      )}>
                        {cat.status}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-neutral-100">
                          <MoreHorizontal className="h-4 w-4 text-black" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border-neutral-200 rounded-lg text-xs w-44">
                        <DropdownMenuLabel className="font-bold text-black text-[10px] uppercase">Category Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-neutral-100" />
                        <DropdownMenuItem asChild className="hover:bg-neutral-100 font-semibold cursor-pointer">
                          <Link to="/admin/categories/$id" params={{ id: cat.id }}>
                            <Edit2 className="mr-2 h-3.5 w-3.5 text-black" /> Edit Category
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-neutral-100" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(cat.id, cat.name)}
                          className="text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5 text-red-600" /> Delete Category
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
  );
}
