import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getEnquiries } from "@/services/enquiryService";
import { Enquiry, EnquiryStatus } from "@/types/catalogue";
import { Inbox, Eye, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        return <Badge className="bg-black text-white font-mono text-[9px] uppercase tracking-wider">New</Badge>;
      case "contacted":
        return <Badge variant="outline" className="text-amber-700 border-amber-600 font-mono text-[9px] uppercase tracking-wider">Contacted</Badge>;
      case "qualified":
        return <Badge variant="outline" className="text-emerald-700 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Qualified</Badge>;
      case "closed":
        return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Closed</Badge>;
      default:
        return null;
    }
  };

  const filteredEnquiries = enquiries.filter((enq) => {
    const matchSearch =
      enq.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.customer.phone.includes(searchTerm) ||
      enq.productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 font-sans bg-white">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">Customer Enquiries</h1>
            <Badge className="bg-black text-white font-mono text-[10px] uppercase">
              {filteredEnquiries.length} Enquiries
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">Manage inbound product quote requests and customer leads.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-black" />
            <Input
              placeholder="Search by customer name, phone, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-neutral-200 bg-neutral-50 text-black placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "new", "contacted", "qualified", "closed"] as const).map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className={cn("h-8 rounded-lg text-xs font-semibold uppercase", statusFilter === st ? "bg-black text-white" : "border-neutral-200 text-black")}
              >
                {st}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50 border-b border-neutral-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Customer Name & Contact</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Product & Quantity</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Date Received</TableHead>
              <TableHead className="w-[100px] font-bold text-black text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 bg-neutral-100 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredEnquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-black opacity-30" />
                    <p className="text-xs font-bold text-black">No enquiries found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredEnquiries.map((enq) => (
                <TableRow key={enq.id} className="hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                  <TableCell>
                    <div>
                      <p className="font-bold text-xs text-black">{enq.customer.name}</p>
                      <p className="font-mono text-[10px] text-neutral-500">{enq.customer.phone} • {enq.customer.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-bold text-xs text-black">{enq.productName}</p>
                      <p className="text-[10px] text-neutral-500 font-mono">
                        Finish: {enq.selectedFinish} | Qty: {enq.quantity} {enq.quantityUnit}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-neutral-600 font-semibold">{formatDate(enq.createdAt)}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(enq.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-neutral-100">
                      <Link to="/admin/enquiries/$id" params={{ id: enq.id }}>
                        <Eye className="h-4 w-4 text-black" />
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
