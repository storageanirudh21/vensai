import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Enquiry, SiteVisit } from "@/types/catalogue";
import {
  Package,
  FolderTree,
  Inbox,
  Calendar,
  Layers,
  CheckCircle2,
  PlusCircle,
  Eye,
  TrendingUp,
  UserCheck,
  Plus,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

interface DashboardMetrics {
  totalProducts: number;
  publishedProducts: number;
  totalCategories: number;
  totalSeries: number;
  newEnquiries: number;
  pendingVisits: number;
}

function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentEnquiries, setRecentEnquiries] = useState<Enquiry[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [upcomingVisits, setUpcomingVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch counts using optimized getCountFromServer
        const productsCol = collection(db, "products");
        const categoriesCol = collection(db, "categories");
        const seriesCol = collection(db, "series");
        const enquiriesCol = collection(db, "enquiries");
        const visitsCol = collection(db, "siteVisits");

        const [
          totalProductsCount,
          publishedProductsCount,
          totalCategoriesCount,
          totalSeriesCount,
          newEnquiriesCount,
          pendingVisitsCount
        ] = await Promise.all([
          getCountFromServer(productsCol),
          getCountFromServer(query(productsCol, where("status", "==", "published"))),
          getCountFromServer(categoriesCol),
          getCountFromServer(seriesCol),
          getCountFromServer(query(enquiriesCol, where("status", "==", "new"))),
          getCountFromServer(query(visitsCol, where("status", "in", ["requested", "confirmed"])))
        ]);

        setMetrics({
          totalProducts: totalProductsCount.data().count,
          publishedProducts: publishedProductsCount.data().count,
          totalCategories: totalCategoriesCount.data().count,
          totalSeries: totalSeriesCount.data().count,
          newEnquiries: newEnquiriesCount.data().count,
          pendingVisits: pendingVisitsCount.data().count
        });

        // 2. Fetch recent entries (limit 5 for cost control)
        const [enquiriesSnap, productsSnap, visitsSnap] = await Promise.all([
          getDocs(query(enquiriesCol, orderBy("createdAt", "desc"), limit(5))),
          getDocs(query(productsCol, orderBy("createdAt", "desc"), limit(5))),
          getDocs(query(visitsCol, where("status", "in", ["requested", "confirmed"]), orderBy("createdAt", "asc"), limit(5)))
        ]);

        setRecentEnquiries(enquiriesSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Enquiry));
        setRecentProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as Product));
        setUpcomingVisits(visitsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as SiteVisit));

      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getEnquiryStatusBadge = (status: string) => {
    switch (status) {
      case "new": return <Badge className="bg-[#211C17] text-white font-mono text-[9px] uppercase tracking-wider">New</Badge>;
      case "contacted": return <Badge variant="outline" className="text-amber-700 border-amber-600 font-mono text-[9px] uppercase tracking-wider">Contacted</Badge>;
      case "qualified": return <Badge variant="outline" className="text-emerald-700 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Qualified</Badge>;
      case "closed": return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Closed</Badge>;
      default: return null;
    }
  };

  const getVisitStatusBadge = (status: string) => {
    switch (status) {
      case "requested": return <Badge className="bg-[#8B7D6B] text-white font-mono text-[9px] uppercase tracking-wider">Requested</Badge>;
      case "confirmed": return <Badge variant="outline" className="text-blue-700 border-blue-600 font-mono text-[9px] uppercase tracking-wider">Confirmed</Badge>;
      case "completed": return <Badge variant="outline" className="text-emerald-700 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Completed</Badge>;
      case "cancelled": return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Cancelled</Badge>;
      default: return null;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, desc }: { title: string; value: number | undefined; icon: any; desc: string }) => (
    <Card className="rounded-2xl border border-[#E5E2DC] bg-white p-5 shadow-xs hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#776E63] uppercase tracking-wider">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F1EA] text-[#8B7D6B] border border-[#E5E2DC]">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-8 w-20 bg-[#FAF8F5] rounded-lg" />
        ) : (
          <div className="font-display text-3xl font-bold text-[#211C17]">{value ?? 0}</div>
        )}
        <p className="mt-1 text-[11px] text-[#776E63] font-medium">{desc}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header and Quick CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#211C17] sm:text-3xl">Dashboard</h1>
          <p className="text-xs text-[#776E63] font-medium mt-0.5">Live view of catalogue inventory and lead conversions.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm" className="h-10 rounded-xl bg-[#211C17] hover:bg-[#3D332A] text-white font-medium text-xs shadow-md shadow-[#211C17]/15 px-4">
            <Link to="/admin/products/new">
              <Plus className="mr-1.5 h-4 w-4 text-[#EADFCE]" /> Add Product
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-10 rounded-xl border-[#E5E2DC] bg-white text-[#211C17] hover:bg-[#FAF8F5] text-xs font-medium shadow-xs">
            <Link to="/admin/categories/new">
              <Plus className="mr-1.5 h-4 w-4 text-[#776E63]" /> Add Category
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-10 rounded-xl border-[#E5E2DC] bg-white text-[#211C17] hover:bg-[#FAF8F5] text-xs font-medium shadow-xs">
            <Link to="/admin/enquiries">
              <Eye className="mr-1.5 h-4 w-4 text-[#776E63]" /> View Enquiries
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Total Products" value={metrics?.totalProducts} icon={Package} desc="In Firestore database" />
        <MetricCard title="Published" value={metrics?.publishedProducts} icon={CheckCircle2} desc="Visible on site" />
        <MetricCard title="Categories" value={metrics?.totalCategories} icon={FolderTree} desc="Main catalog groups" />
        <MetricCard title="Series" value={metrics?.totalSeries} icon={Layers} desc="Sub-series variations" />
        <MetricCard title="Enquiries" value={metrics?.newEnquiries} icon={Inbox} desc="New pending review" />
        <MetricCard title="Site Visits" value={metrics?.pendingVisits} icon={Calendar} desc="Pending visit date" />
      </div>

      {/* Details Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Enquiries */}
        <Card className="rounded-2xl border border-[#E5E2DC] bg-white shadow-xs overflow-hidden lg:col-span-8">
          <CardHeader className="border-b border-[#E5E2DC] p-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base font-bold text-[#211C17]">Recent Enquiries</CardTitle>
              <CardDescription className="text-xs text-[#776E63] font-medium">
                Latest customer product enquiries
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-[#8B7D6B] hover:bg-[#F5F1EA] rounded-lg">
              <Link to="/admin/enquiries">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-[#FAF8F5] rounded-lg" />)}
              </div>
            ) : recentEnquiries.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#776E63] font-medium">No enquiries received yet.</div>
            ) : (
              <div className="divide-y divide-[#E5E2DC]/60">
                {recentEnquiries.map((enquiry) => (
                  <Link
                    key={enquiry.id}
                    to="/admin/enquiries/$id"
                    params={{ id: enquiry.id }}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#211C17]">{enquiry.customer.name}</span>
                        {getEnquiryStatusBadge(enquiry.status)}
                      </div>
                      <p className="text-xs text-[#776E63] font-medium mt-0.5">
                        {enquiry.productName} ({enquiry.selectedFinish}) • Qty: {enquiry.quantity} {enquiry.quantityUnit}
                      </p>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-[#776E63] font-mono">
                      {formatDate(enquiry.createdAt)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Site Visits */}
        <Card className="rounded-2xl border border-[#E5E2DC] bg-white shadow-xs overflow-hidden lg:col-span-4">
          <CardHeader className="border-b border-[#E5E2DC] p-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-base font-bold text-[#211C17]">Pending Visits</CardTitle>
              <CardDescription className="text-xs text-[#776E63] font-medium">
                Upcoming site bookings
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs text-[#8B7D6B] hover:bg-[#F5F1EA] rounded-lg">
              <Link to="/admin/site-visits">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-[#FAF8F5] rounded-lg" />)}
              </div>
            ) : upcomingVisits.length === 0 ? (
              <div className="p-12 text-center text-xs text-[#776E63] font-medium">No pending site visits.</div>
            ) : (
              <div className="divide-y divide-[#E5E2DC]/60">
                {upcomingVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    to="/admin/site-visits/$id"
                    params={{ id: visit.id }}
                    className="flex flex-col gap-1.5 p-4 hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#211C17]">{visit.customerName}</span>
                      {getVisitStatusBadge(visit.status)}
                    </div>
                    <p className="text-xs text-[#776E63] font-mono">
                      {visit.preferredDate} @ {visit.preferredTime}
                    </p>
                    <p className="text-[10px] text-[#776E63]/80 truncate">
                      Loc: {visit.location}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Catalog Additions */}
      <Card className="rounded-2xl border border-[#E5E2DC] bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-[#E5E2DC] p-5 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-base font-bold text-[#211C17]">Recent Products</CardTitle>
            <CardDescription className="text-xs text-[#776E63] font-medium">
              Recently added catalogue items
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs text-[#8B7D6B] hover:bg-[#F5F1EA] rounded-lg">
            <Link to="/admin/products">View Catalogue <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-[#FAF8F5] rounded-lg" />)}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#776E63] font-medium">No products in database yet.</div>
          ) : (
            <div className="divide-y divide-[#E5E2DC]/60">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 hover:bg-[#FAF8F5] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#FAF8F5] border border-[#E5E2DC] flex items-center justify-center">
                      {product.primaryImage?.thumbnailUrl || product.primaryImage?.url ? (
                        <img src={product.primaryImage?.thumbnailUrl || product.primaryImage?.url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-[#8B7D6B]/50" />
                      )}
                    </div>
                    <div>
                      <Link to="/admin/products/$id" params={{ id: product.id }} className="text-xs font-semibold text-[#211C17] hover:text-[#8B7D6B]">
                        {product.name}
                      </Link>
                      <p className="text-[10px] text-[#776E63] font-mono">/{product.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#776E63] font-medium">{product.categoryName}</span>
                    <Badge variant={product.status === "published" ? "default" : "secondary"} className={cn(
                      "text-[9px] font-mono uppercase tracking-wider",
                      product.status === "published" ? "bg-[#211C17] text-white" : ""
                    )}>
                      {product.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
