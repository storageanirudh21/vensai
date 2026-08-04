import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSiteVisits } from "@/services/siteVisitService";
import { SiteVisit, SiteVisitStatus } from "@/types/catalogue";
import { Calendar, Eye, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
        return <Badge className="bg-black font-mono text-[9px] uppercase tracking-wider text-white">Requested</Badge>;
      case "confirmed":
        return <Badge variant="outline" className="text-blue-700 border-blue-600 font-mono text-[9px] uppercase tracking-wider">Confirmed</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-emerald-700 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Completed</Badge>;
      case "cancelled":
        return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const filteredVisits = visits.filter((v) => {
    const matchSearch =
      v.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.includes(searchTerm) ||
      v.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6 font-sans bg-white">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">Site Visits</h1>
            <Badge className="bg-black text-white font-mono text-[10px] uppercase">
              {filteredVisits.length} Bookings
            </Badge>
          </div>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">Manage customer site inspection bookings and scheduled consultations.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-black" />
            <Input
              placeholder="Search by client name, phone, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border-neutral-200 bg-neutral-50 text-black placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {(["all", "requested", "confirmed", "completed", "cancelled"] as const).map((st) => (
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

      {/* Visits Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-neutral-50 border-b border-neutral-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Client & Contact</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Scheduled Date & Time</TableHead>
              <TableHead className="font-bold text-black text-[11px] uppercase tracking-wider">Location / City</TableHead>
              <TableHead className="w-[100px] font-bold text-black text-[11px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="w-[80px] font-bold text-black text-[11px] uppercase tracking-wider text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-36 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-neutral-100 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 bg-neutral-100 rounded ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : filteredVisits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Calendar className="h-8 w-8 text-black opacity-30" />
                    <p className="text-xs font-bold text-black">No site visits found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredVisits.map((v) => (
                <TableRow key={v.id} className="hover:bg-neutral-50 transition-colors border-b border-neutral-100">
                  <TableCell>
                    <div>
                      <p className="font-bold text-xs text-black">{v.customerName}</p>
                      <p className="font-mono text-[10px] text-neutral-500">{v.phone} • {v.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-mono text-xs font-bold text-black">{v.preferredDate} @ {v.preferredTime}</p>
                      <p className="text-[10px] text-neutral-400 font-mono">Booked: {formatDate(v.createdAt)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-black">
                      {v.location}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(v.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-neutral-100">
                      <Link to="/admin/site-visits/$id" params={{ id: v.id }}>
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
