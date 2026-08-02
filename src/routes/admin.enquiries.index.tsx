import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getEnquiries } from "@/services/enquiryService";
import { Enquiry, EnquiryStatus } from "@/types/catalogue";
import { Inbox, Eye, Search, AlertCircle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/enquiries/")({
  component: AdminEnquiriesPage,
});

function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | EnquiryStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadList = async () => {
    try {
      setLoading(true);
      const list = await getEnquiries(statusFilter === "all" ? undefined : statusFilter);
      setEnquiries(list);
    } catch (error) {
      toast.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, [statusFilter]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: EnquiryStatus) => {
    switch (status) {
      case "new":
        return <Badge className="bg-[#8B7D6B] hover:bg-[#8B7D6B]/90 font-mono text-[9px] uppercase tracking-wider text-white">New</Badge>;
      case "contacted":
        return <Badge variant="outline" className="text-amber-600 border-amber-600 font-mono text-[9px] uppercase tracking-wider">Contacted</Badge>;
      case "qualified":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Qualified</Badge>;
      case "closed":
        return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Closed</Badge>;
      default:
        return null;
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const term = searchTerm.toLowerCase();
    return enq.customer.name.toLowerCase().includes(term) ||
           enq.customer.phone.includes(term) ||
           enq.customer.email.toLowerCase().includes(term) ||
           enq.productName.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#121212] md:text-4xl">Enquiries</h1>
        <p className="text-sm text-[#776E63]">Track customer enquiries, log communications, and manage pipeline leads.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, phone, or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-[#E5E2DC] rounded-sm focus-visible:ring-[#8B7D6B] text-xs"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "new", "contacted", "qualified", "closed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-sm border px-3 py-1.5 text-xs font-mono tracking-wider uppercase transition-colors ${
                statusFilter === status
                  ? "border-[#211C17] bg-[#211C17] text-white"
                  : "border-[#E5E2DC] text-[#776E63] hover:border-[#211C17] hover:text-[#211C17]"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#E5E2DC] bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50/50">
            <TableRow className="border-b border-[#E5E2DC] font-mono text-[9px] tracking-wider uppercase text-[#776E63]">
              <TableHead>Customer</TableHead>
              <TableHead>Requested Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Finish</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-b border-[#E5E2DC]/50">
                  <TableCell>
                    <Skeleton className="h-4 w-28 bg-neutral-100" />
                    <Skeleton className="h-3 w-36 bg-neutral-100 mt-1" />
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-36 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="mx-auto h-4 w-12 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-8 w-8 bg-neutral-100" /></TableCell>
                </TableRow>
              ))
            ) : filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground font-mono">
                  No enquiries received.
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enq) => (
                <TableRow key={enq.id} className="border-b border-[#E5E2DC]/50 hover:bg-neutral-50/30 transition-colors">
                  <TableCell>
                    <div className="font-semibold text-xs text-[#121212]">{enq.customer.name}</div>
                    <div className="font-mono text-[9px] text-[#776E63] mt-0.5">{enq.customer.phone}</div>
                  </TableCell>
                  <TableCell className="font-medium text-xs">{enq.productName}</TableCell>
                  <TableCell className="text-xs">{enq.categoryName}</TableCell>
                  <TableCell className="text-xs font-mono">{enq.selectedFinish || "—"}</TableCell>
                  <TableCell className="text-center font-mono text-xs font-semibold">
                    {enq.quantity ? `${enq.quantity} ${enq.quantityUnit}` : "—"}
                  </TableCell>
                  <TableCell>{getStatusBadge(enq.status)}</TableCell>
                  <TableCell className="font-mono text-[9px] text-muted-foreground">{formatDate(enq.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="xs" variant="outline" className="rounded-sm h-7 text-[10px] font-mono border-[#E5E2DC]">
                      <Link to="/admin/enquiries/$id" params={{ id: enq.id }}>
                        Review <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
