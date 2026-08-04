import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getCountFromServer
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
  Eye,
  Plus,
  ArrowRight,
  ShoppingBag
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

        const productsCol = collection(db, "products");
        const categoriesCol = collection(db, "categories");
        const seriesCol = collection(db, "series");
        const enquiriesCol = collection(db, "enquiries");
        const visitsCol = collection(db, "siteVisits");

        const safeCount = async (q: any) => {
          try {
            const res = await getCountFromServer(q);
            return res.data().count;
          } catch (e) {
            console.warn("Count query fallback:", e);
            return 0;
          }
        };

        const [
          totalProducts,
          publishedProducts,
          totalCategories,
          totalSeries,
          newEnquiries,
          pendingVisits
        ] = await Promise.all([
          safeCount(productsCol),
          safeCount(query(productsCol, where("status", "==", "published"))),
          safeCount(categoriesCol),
          safeCount(seriesCol),
          safeCount(query(enquiriesCol, where("status", "==", "new"))),
          safeCount(query(visitsCol, where("status", "in", ["requested", "confirmed"])))
        ]);

        setMetrics({
          totalProducts,
          publishedProducts,
          totalCategories,
          totalSeries,
          newEnquiries,
          pendingVisits
        });

        const safeFetchDocs = async <T,>(q: any): Promise<T[]> => {
          try {
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...(d.data() as object) }) as T);
          } catch (e) {
            console.warn("Doc fetch fallback:", e);
            return [];
          }
        };

        const [enquiriesList, productsList, visitsList] = await Promise.all([
          safeFetchDocs<Enquiry>(query(enquiriesCol, orderBy("createdAt", "desc"), limit(5))),
          safeFetchDocs<Product>(query(productsCol, orderBy("createdAt", "desc"), limit(5))),
          safeFetchDocs<SiteVisit>(query(visitsCol, where("status", "in", ["requested", "confirmed"]), orderBy("createdAt", "asc"), limit(5)))
        ]);

        setRecentEnquiries(enquiriesList);
        setRecentProducts(productsList);
        setUpcomingVisits(visitsList);

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
      case "new": return <Badge className="bg-black text-white font-mono text-[9px] uppercase tracking-wider">New</Badge>;
      case "contacted": return <Badge variant="outline" className="text-amber-700 border-amber-600 font-mono text-[9px] uppercase tracking-wider">Contacted</Badge>;
      case "qualified": return <Badge variant="outline" className="text-emerald-700 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Qualified</Badge>;
      case "closed": return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Closed</Badge>;
      default: return null;
    }
  };

  const getVisitStatusBadge = (status: string) => {
    switch (status) {
      case "requested": return <Badge className="bg-black text-white font-mono text-[9px] uppercase tracking-wider">Requested</Badge>;
      case "confirmed": return <Badge variant="outline" className="text-blue-700 border-blue-600 font-mono text-[9px] uppercase tracking-wider">Confirmed</Badge>;
      case "completed": return <Badge variant="outline" className="text-emerald-700 border-emerald-600 font-mono text-[9px] uppercase tracking-wider">Completed</Badge>;
      case "cancelled": return <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider">Cancelled</Badge>;
      default: return null;
    }
  };

  const MetricCard = ({ title, value, icon: Icon, desc }: { title: string; value: number | undefined; icon: any; desc: string }) => (
    <Card className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs hover:border-black transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">{title}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-black border border-neutral-200">
          <Icon className="h-4 w-4 text-black" />
        </div>
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-8 w-20 bg-neutral-100 rounded-lg" />
        ) : (
          <div className="font-display text-3xl font-extrabold text-black">{value ?? 0}</div>
        )}
        <p className="mt-1 text-[11px] text-neutral-500 font-medium">{desc}</p>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8 font-sans bg-white">
      {/* Header and Quick CTAs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 pb-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-black sm:text-3xl">Dashboard Overview</h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">Live catalogue inventory, product analytics, and customer enquiries.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm" className="h-9 rounded-lg bg-black hover:bg-neutral-800 text-white font-semibold text-xs shadow-sm px-4">
            <Link to="/admin/products/new">
              <Plus className="mr-1.5 h-4 w-4 text-white" /> Add Product
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 rounded-lg border-neutral-200 bg-white text-black hover:bg-neutral-100 text-xs font-semibold shadow-xs">
            <Link to="/admin/categories/new">
              <Plus className="mr-1.5 h-4 w-4 text-black" /> Add Category
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-9 rounded-lg border-neutral-200 bg-white text-black hover:bg-neutral-100 text-xs font-semibold shadow-xs">
            <Link to="/admin/enquiries">
              <Eye className="mr-1.5 h-4 w-4 text-black" /> View Enquiries
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Total Products" value={metrics?.totalProducts} icon={ShoppingBag} desc="Inventory items" />
        <MetricCard title="Published" value={metrics?.publishedProducts} icon={CheckCircle2} desc="Live on website" />
        <MetricCard title="Categories" value={metrics?.totalCategories} icon={FolderTree} desc="Product lines" />
        <MetricCard title="Series" value={metrics?.totalSeries} icon={Layers} desc="Catalogue groups" />
        <MetricCard title="Enquiries" value={metrics?.newEnquiries} icon={Inbox} desc="Pending responses" />
        <MetricCard title="Site Visits" value={metrics?.pendingVisits} icon={Calendar} desc="Booked visits" />
      </div>

      {/* Details Tables Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Recent Enquiries */}
        <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden lg:col-span-8">
          <CardHeader className="border-b border-neutral-200 p-5 flex flex-row items-center justify-between bg-neutral-50/50">
            <div>
              <CardTitle className="font-display text-base font-extrabold text-black">Recent Enquiries</CardTitle>
              <CardDescription className="text-xs text-neutral-500 font-medium">
                Latest inbound product quotes and customer requests
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-black hover:bg-neutral-100 rounded-lg">
              <Link to="/admin/enquiries">View All <ArrowRight className="ml-1 h-3.5 w-3.5 text-black" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-neutral-100 rounded-lg" />)}
              </div>
            ) : recentEnquiries.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400 font-medium">No enquiries received yet.</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recentEnquiries.map((enquiry) => (
                  <Link
                    key={enquiry.id}
                    to="/admin/enquiries/$id"
                    params={{ id: enquiry.id }}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-black">{enquiry.customer.name}</span>
                        {getEnquiryStatusBadge(enquiry.status)}
                      </div>
                      <p className="text-xs text-neutral-600 font-medium mt-0.5">
                        {enquiry.productName} ({enquiry.selectedFinish}) • Qty: {enquiry.quantity} {enquiry.quantityUnit}
                      </p>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-neutral-500 font-mono">
                      {formatDate(enquiry.createdAt)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Site Visits */}
        <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden lg:col-span-4">
          <CardHeader className="border-b border-neutral-200 p-5 flex flex-row items-center justify-between bg-neutral-50/50">
            <div>
              <CardTitle className="font-display text-base font-extrabold text-black">Pending Visits</CardTitle>
              <CardDescription className="text-xs text-neutral-500 font-medium">
                Scheduled client site bookings
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-black hover:bg-neutral-100 rounded-lg">
              <Link to="/admin/site-visits">View All <ArrowRight className="ml-1 h-3.5 w-3.5 text-black" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-2 p-6">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-neutral-100 rounded-lg" />)}
              </div>
            ) : upcomingVisits.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-400 font-medium">No pending site visits.</div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {upcomingVisits.map((visit) => (
                  <Link
                    key={visit.id}
                    to="/admin/site-visits/$id"
                    params={{ id: visit.id }}
                    className="flex flex-col gap-1.5 p-4 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black">{visit.customerName}</span>
                      {getVisitStatusBadge(visit.status)}
                    </div>
                    <p className="text-xs text-neutral-600 font-mono">
                      {visit.preferredDate} @ {visit.preferredTime}
                    </p>
                    <p className="text-[10px] text-neutral-500 truncate">
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
      <Card className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
        <CardHeader className="border-b border-neutral-200 p-5 flex flex-row items-center justify-between bg-neutral-50/50">
          <div>
            <CardTitle className="font-display text-base font-extrabold text-black">Recent Store Products</CardTitle>
            <CardDescription className="text-xs text-neutral-500 font-medium">
              Recently added inventory items
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs font-semibold text-black hover:bg-neutral-100 rounded-lg">
            <Link to="/admin/products">View Store Products <ArrowRight className="ml-1 h-3.5 w-3.5 text-black" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-neutral-100 rounded-lg" />)}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-400 font-medium">No products in database yet.</div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {recentProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                      {product.primaryImage?.thumbnailUrl || product.primaryImage?.url ? (
                        <img src={product.primaryImage?.thumbnailUrl || product.primaryImage?.url} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-black" />
                      )}
                    </div>
                    <div>
                      <Link to="/admin/products/$id" params={{ id: product.id }} className="text-xs font-bold text-black hover:underline">
                        {product.name}
                      </Link>
                      <p className="text-[10px] text-neutral-500 font-mono">SKU: {product.sku || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-neutral-600 font-medium">{product.categoryName}</span>
                    <Badge variant={product.status === "published" ? "default" : "secondary"} className={cn(
                      "text-[9px] font-mono uppercase tracking-wider",
                      product.status === "published" ? "bg-black text-white" : ""
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
