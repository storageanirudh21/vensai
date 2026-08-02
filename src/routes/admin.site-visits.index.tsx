import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSiteVisits } from "@/services/siteVisitService";
import { SiteVisit, SiteVisitStatus } from "@/types/catalogue";
import { Calendar, Eye, Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/site-visits/")({
  component: AdminSiteVisitsPage,
});

function AdminSiteVisitsPage() {
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | SiteVisitStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const loadList = async () => {
    try {
      setLoading(true);
      const list = await getSiteVisits(statusFilter === "all" ? undefined : statusFilter);
      setVisits(list);
    } catch (error) {
      toast.error("Failed to load site visits");
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
    return date.toLocaleDateString("en-IN", { day: '2-digit', month: 'short' });
  };

  const getStatusBadge = (status: SiteVisitStatus) => {
    switch (status) {
      case "requested":
        return <Badge className="bg-[#8B7D6B] font-mono text-[9px] uppercase tracking-wider text-white">Requested</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="text-blue-600 border-blue-600 font-mono text-[9px] uppercase tracking-wider">Confirmed</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-emerald-600 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filteredVisits = visits.filter(v => {
    const term = searchTerm.toLowerCase();
    return v.customerName.toLowerCase().includes(term) ||
           v.phone.includes(term) ||
           v.email.toLowerCase().includes(term) ||
           v.location.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#121212] md:text-4xl">Site Visits</h1>
        <p className="text-sm text-[#776E63]">Manage site consultation bookings and showroom experience center visits.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customer, location, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-[#E5E2DC] rounded-sm focus-visible:ring-[#8B7D6B] text-xs"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "requested", "confirmed", "completed", "cancelled"] as const).map((status) => (
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
              <TableHead>Preferred Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Project Type</TableHead>
              <TableHead>Product Ref</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booked On</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-32 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-14 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100" /></TableCell>
                  <TableCell><Skeleton className="ml-auto h-8 w-8 bg-neutral-100" /></TableCell>
                </TableRow>
              ))
            ) : filteredVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground font-mono">
                  No site visits booked.
                </TableCell>
              </TableRow>
            ) : (
              filteredVisits.map((v) => (
                <TableRow key={v.id} className="border-b border-[#E5E2DC]/50 hover:bg-neutral-50/30 transition-colors">
                  <TableCell>
                    <div className="font-semibold text-xs text-[#121212]">{v.customerName}</div>
                    <div className="font-mono text-[9px] text-[#776E63] mt-0.5">{v.phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-neutral-800">{v.preferredDate}</div>
                    <div className="font-mono text-[9px] text-[#776E63] mt-0.5">{v.preferredTime}</div>
                  </TableCell>
                  <TableCell className="text-xs truncate max-w-[200px]" title={v.location}>{v.location}</TableCell>
                  <TableCell className="text-xs capitalize font-mono text-[10px]">{v.projectType || "—"}</TableCell>
                  <TableCell className="text-xs truncate max-w-[150px] font-semibold text-[#8B7D6B]">{v.productName || "—"}</TableCell>
                  <TableCell>{getStatusBadge(v.status)}</TableCell>
                  <TableCell className="font-mono text-[9px] text-muted-foreground">{formatDate(v.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="xs" variant="outline" className="rounded-sm h-7 text-[10px] font-mono border-[#E5E2DC]">
                      <Link to="/admin/site-visits/$id" params={{ id: v.id }}>
                        Logistics <ArrowRight className="ml-1 h-3.5 w-3.5" />
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
