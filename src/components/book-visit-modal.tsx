import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLead } from "@/lib/lead";

const showrooms = [
  "Bengaluru (Koramangala)",
  "Bengaluru (Indiranagar)",
  "Chennai (Adyar)",
  "Hyderabad (Banjara Hills)",
  "Mumbai (Andheri)",
];

const timeSlots = [
  "Morning (10:00 AM - 1:00 PM)",
  "Afternoon (1:00 PM - 4:00 PM)",
  "Evening (4:00 PM - 7:00 PM)",
];

export function BookVisitModal() {
  const { visitOpen, setVisitOpen, visitProduct } = useLead();
  const [sending, setSending] = useState(false);

  return (
    <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
      <DialogContent className="w-full max-w-md gap-0 overflow-hidden rounded-3xl border border-[#E5E2DA] p-0 shadow-2xl bg-[#F5F3EE]">
        <div className="bg-[#121212] px-6 py-5 text-white relative">
          <DialogTitle className="font-display text-2xl font-bold uppercase tracking-wider text-white">
            Book a Site Visit
          </DialogTitle>
          <p className="mt-1 text-xs text-white/70">
            Experience our architectural surfaces in person at a nearby showroom.
          </p>
        </div>

        <form
          className="grid gap-4 px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              setVisitOpen(false);
              toast.success("Visit requested!", {
                description: "We will confirm your showroom time slot shortly.",
              });
            }, 700);
          }}
        >
          {visitProduct && (
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-[#121212]">Interested Product</Label>
              <Input value={visitProduct} disabled className="rounded-xl border-[#D8D4C9] bg-white/70 text-[#121212]" />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="visit-name" className="text-xs font-semibold text-[#121212]">Full Name *</Label>
              <Input id="visit-name" required placeholder="Enter full name" className="rounded-xl border-[#D8D4C9] bg-white" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="visit-phone" className="text-xs font-semibold text-[#121212]">Phone Number *</Label>
              <Input id="visit-phone" required type="tel" placeholder="+91 98765 43210" className="rounded-xl border-[#D8D4C9] bg-white" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="visit-showroom" className="text-xs font-semibold text-[#121212]">Nearby Showroom *</Label>
            <Select required>
              <SelectTrigger id="visit-showroom" className="rounded-xl border-[#D8D4C9] bg-white">
                <SelectValue placeholder="Select a showroom" />
              </SelectTrigger>
              <SelectContent>
                {showrooms.map((showroom) => (
                  <SelectItem key={showroom} value={showroom}>
                    {showroom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="visit-time" className="text-xs font-semibold text-[#121212]">Preferred Time Slot *</Label>
            <Select required>
              <SelectTrigger id="visit-time" className="rounded-xl border-[#D8D4C9] bg-white">
                <SelectValue placeholder="Select a time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-1/3 rounded-full border-[#D8D4C9] text-[#121212] hover:bg-white cursor-pointer"
              onClick={() => setVisitOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={sending}
              className="w-2/3 rounded-full bg-[#121212] text-white hover:bg-black cursor-pointer"
            >
              {sending ? "Sending..." : "Request Visit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
