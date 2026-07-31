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
      <DialogContent className="sm:max-w-md">
        <DialogTitle className="font-display text-2xl font-semibold">Book a site visit</DialogTitle>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Experience our surfaces in person. Schedule a visit to a nearby showroom.
        </p>
        
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              setVisitOpen(false);
              toast.success("Visit requested! We will confirm your time slot shortly.");
            }, 1000);
          }}
          className="space-y-4"
        >
          {visitProduct && (
            <div className="space-y-2">
              <Label>Interested In</Label>
              <Input value={visitProduct} disabled className="bg-muted text-muted-foreground" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit-name">Full Name *</Label>
              <Input id="visit-name" required placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-phone">Phone Number *</Label>
              <Input id="visit-phone" required type="tel" placeholder="+91 98765 43210" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visit-showroom">Nearby Showroom *</Label>
            <Select required>
              <SelectTrigger id="visit-showroom">
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

          <div className="space-y-2">
            <Label htmlFor="visit-time">Preferred Time Slot *</Label>
            <Select required>
              <SelectTrigger id="visit-time">
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

          <Button type="submit" className="w-full mt-4" disabled={sending}>
            {sending ? "Sending Request..." : "Request Visit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
