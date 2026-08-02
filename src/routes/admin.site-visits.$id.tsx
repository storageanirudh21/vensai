import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSiteVisit, updateSiteVisitStatus } from "@/services/siteVisitService";
import { SiteVisit, SiteVisitStatus } from "@/types/catalogue";
import { ArrowLeft, Calendar, Mail, Phone, User, MapPin, Clipboard, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/site-visits/$id")({
  component: EditSiteVisitPage,
});

function EditSiteVisitPage() {
  const { id } = Route.useParams();
  const [visit, setVisit] = useState<SiteVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [status, setStatus] = useState<SiteVisitStatus>("requested");

  useEffect(() => {
    async function loadVisit() {
      try {
        setLoading(true);
        const data = await getSiteVisit(id);
        if (data) {
          setVisit(data);
          setStatus(data.status);
        } else {
          toast.error("Site Visit booking not found");
        }
      } catch (error) {
        toast.error("Error loading site visit details");
      } finally {
        setLoading(false);
      }
    }
    loadVisit();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSiteVisitStatus(id, status);
      toast.success("Site Visit status updated successfully");
      if (visit) {
        setVisit({ ...visit, status });
      }
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B7D6B]" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-20 text-xs font-mono text-muted-foreground">
        Site Visit booking not found.
        <div className="mt-4">
          <Button asChild size="sm" variant="outline" className="rounded-sm border-[#E5E2DC]">
            <Link to="/admin/site-visits">Back to list</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <Link
          to="/admin/site-visits"
          className="inline-flex items-center gap-2 text-xs tracking-wider text-[#776E63] uppercase transition-colors hover:text-black font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Bookings
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#121212] mt-4 md:text-3xl">
          Review Booking: {visit.customerName}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left: Booking Details */}
        <div className="space-y-6 md:col-span-8">
          {/* Section 1: Schedule Date/Time */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="border-b border-[#FAF9F5] pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#8B7D6B]" /> Preferred Appointment Time
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-3 pt-5">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Appointment Date</span>
                <span className="text-xs font-semibold text-neutral-800">{visit.preferredDate}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Preferred Slot</span>
                <span className="text-xs font-semibold text-neutral-800">{visit.preferredTime}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Project Type</span>
                <span className="text-xs font-mono capitalize bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 inline-block">
                  {visit.projectType || "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Customer Contact & Location */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="border-b border-[#FAF9F5] pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#8B7D6B]" /> Logistics & Contact details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Customer Name</span>
                  <span className="text-xs font-medium text-neutral-800">{visit.customerName}</span>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Phone</span>
                  <a href={`tel:${visit.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="h-3 w-3 inline" /> {visit.phone}
                  </a>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Email</span>
                  <a href={`mailto:${visit.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="h-3 w-3 inline" /> {visit.email}
                  </a>
                </div>
              </div>
              
              <div className="space-y-1 border-t pt-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Site Address / Location</span>
                <span className="text-xs font-semibold text-neutral-800 leading-relaxed block">{visit.location}</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Project Notes & Product Reference */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="border-b border-[#FAF9F5] pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clipboard className="h-4 w-4 text-[#8B7D6B]" /> Booking Context & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 pt-5 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Product Reference</span>
                {visit.productName ? (
                  <span className="text-xs font-semibold text-[#8B7D6B]">{visit.productName}</span>
                ) : (
                  <span className="text-xs text-muted-foreground font-mono">No specific product reference (general visit)</span>
                )}
              </div>
              <div className="space-y-1 sm:col-span-2 border-t pt-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Customer Message / Notes</span>
                <p className="text-xs leading-relaxed text-neutral-700 bg-neutral-50 p-4 rounded border font-mono">
                  {visit.notes || "No custom visit notes provided."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Booking Logistics status controls */}
        <div className="space-y-6 md:col-span-4">
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Booking Status</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Appointment flow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-2 border-b pb-3 text-xs text-neutral-500">
                <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-neutral-400" />
                <div>
                  <span className="font-mono text-[9px] block text-[#776E63] uppercase font-semibold">Request Received</span>
                  <span className="font-mono text-[10px]">{formatDate(visit.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as SiteVisitStatus)}>
                  <SelectTrigger className="rounded-sm border-[#E5E2DC] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E2DC] rounded-sm text-xs font-mono">
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30] font-mono text-xs uppercase tracking-widest py-5"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Appointment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
