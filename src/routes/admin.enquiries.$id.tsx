import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getEnquiry, updateEnquiryStatus } from "@/services/enquiryService";
import { Enquiry, EnquiryStatus } from "@/types/catalogue";
import { ArrowLeft, Inbox, Mail, Phone, User, Calendar, MessageSquare, Clipboard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/enquiries/$id")({
  component: EditEnquiryPage,
});

function EditEnquiryPage() {
  const { id } = Route.useParams();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [status, setStatus] = useState<EnquiryStatus>("new");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadEnquiry() {
      try {
        setLoading(true);
        const data = await getEnquiry(id);
        if (data) {
          setEnquiry(data);
          setStatus(data.status);
          setNotes(data.internalNotes || "");
        } else {
          toast.error("Enquiry not found");
        }
      } catch (error) {
        toast.error("Error loading enquiry details");
      } finally {
        setLoading(false);
      }
    }
    loadEnquiry();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateEnquiryStatus(id, status, notes);
      toast.success("Enquiry status updated successfully");
      if (enquiry) {
        setEnquiry({ ...enquiry, status, internalNotes: notes });
      }
    } catch (error) {
      toast.error("Failed to update enquiry");
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

  if (!enquiry) {
    return (
      <div className="text-center py-20 text-xs font-mono text-muted-foreground">
        Enquiry data not found.
        <div className="mt-4">
          <Button asChild size="sm" variant="outline" className="rounded-sm border-[#E5E2DC]">
            <Link to="/admin/enquiries">Back to list</Link>
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
          to="/admin/enquiries"
          className="inline-flex items-center gap-2 text-xs tracking-wider text-[#776E63] uppercase transition-colors hover:text-black font-mono"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Enquiries
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#121212] mt-4 md:text-3xl">
          Review Lead: {enquiry.customer.name}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left Side: Enquiry Details */}
        <div className="space-y-6 md:col-span-8">
          {/* Section 1: Customer details */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="border-b border-[#FAF9F5] pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-[#8B7D6B]" /> Customer Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-3 pt-5">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Contact Name</span>
                <span className="text-xs font-medium text-neutral-800">{enquiry.customer.name}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Phone Number</span>
                <a href={`tel:${enquiry.customer.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Phone className="h-3 w-3 inline" /> {enquiry.customer.phone}
                </a>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Email Address</span>
                <a href={`mailto:${enquiry.customer.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <Mail className="h-3 w-3 inline" /> {enquiry.customer.email}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Product specification enquiry */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="border-b border-[#FAF9F5] pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Inbox className="h-4 w-4 text-[#8B7D6B]" /> Requested Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2 pt-5">
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Product Name</span>
                <span className="text-xs font-medium text-neutral-800">{enquiry.productName}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Finish Option</span>
                <span className="text-xs font-mono bg-neutral-100 px-2 py-0.5 rounded text-neutral-800 inline-block">
                  {enquiry.selectedFinish || "—"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Category</span>
                <span className="text-xs text-neutral-800">{enquiry.categoryName}</span>
              </div>
              <div className="space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Series</span>
                <span className="text-xs text-neutral-800">{enquiry.seriesName}</span>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <span className="font-mono text-[9px] uppercase tracking-widest text-[#776E63] font-bold block">Quantity Required</span>
                <span className="text-xs font-bold text-[#8B7D6B]">
                  {enquiry.quantity ? `${enquiry.quantity} ${enquiry.quantityUnit}` : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Customer Message */}
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader className="border-b border-[#FAF9F5] pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#8B7D6B]" /> Message from customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <p className="text-xs leading-relaxed text-neutral-700 bg-neutral-50 p-4 rounded border font-mono">
                {enquiry.message || "No custom message provided."}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Lead Management Status Panel */}
        <div className="space-y-6 md:col-span-4">
          <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Lead Management</CardTitle>
              <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
                Pipeline controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Date received info */}
              <div className="flex items-start gap-2 border-b pb-3 text-xs text-neutral-500">
                <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-neutral-400" />
                <div>
                  <span className="font-mono text-[9px] block text-[#776E63] uppercase font-semibold">Received Date</span>
                  <span className="font-mono text-[10px]">{formatDate(enquiry.createdAt)}</span>
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as EnquiryStatus)}>
                  <SelectTrigger className="rounded-sm border-[#E5E2DC] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E5E2DC] rounded-sm text-xs font-mono">
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="closed">Closed / Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Internal Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Internal Notes</Label>
                <Textarea
                  placeholder="Log communication dates, sample orders shipped, or client feedback here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-sm border-[#E5E2DC] text-xs min-h-[140px]"
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-sm bg-[#211C17] text-white hover:bg-[#4E3F30] font-mono text-xs uppercase tracking-widest py-5"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Lead status
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
