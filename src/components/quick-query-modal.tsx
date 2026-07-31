import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLead } from "@/lib/lead";

const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
];

export function QuickQueryModal() {
  const { open, setOpen, product } = useLead();
  const [sending, setSending] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-full max-w-md gap-0 overflow-hidden rounded-3xl border border-[#E5E2DA] p-0 shadow-2xl bg-[#F5F3EE]">
        <div className="bg-[#121212] px-6 py-5 text-white relative">
          <DialogTitle className="font-display text-2xl font-bold uppercase tracking-wider text-white">
            Quick Query
          </DialogTitle>
          <p className="mt-1 text-xs text-white/70">
            Leave your details — a specifier will call you back.
          </p>
        </div>

        <form
          className="grid gap-4 px-6 py-6"
          onSubmit={(e) => {
            e.preventDefault();
            setSending(true);
            setTimeout(() => {
              setSending(false);
              setOpen(false);
              (e.target as HTMLFormElement).reset();
              toast.success("Enquiry received", {
                description: "Our team will call you back within one business day.",
              });
            }, 700);
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="qq-name" className="text-xs font-semibold text-[#121212]">Full name</Label>
            <Input id="qq-name" name="name" required className="rounded-xl border-[#D8D4C9] bg-white" placeholder="Enter your full name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qq-email" className="text-xs font-semibold text-[#121212]">Email</Label>
            <Input
              id="qq-email"
              name="email"
              type="email"
              required
              className="rounded-xl border-[#D8D4C9] bg-white"
              placeholder="Enter your e-mail id"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qq-mobile" className="text-xs font-semibold text-[#121212]">Mobile number</Label>
            <Input
              id="qq-mobile"
              name="mobile"
              type="tel"
              required
              className="rounded-xl border-[#D8D4C9] bg-white"
              placeholder="Enter your mobile number"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="qq-state" className="text-xs font-semibold text-[#121212]">State</Label>
              <Select name="state" required>
                <SelectTrigger id="qq-state" className="rounded-xl border-[#D8D4C9] bg-white">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {indianStates.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="qq-city" className="text-xs font-semibold text-[#121212]">City</Label>
              <Input id="qq-city" name="city" className="rounded-xl border-[#D8D4C9] bg-white" placeholder="Enter your city" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="qq-product" className="text-xs font-semibold text-[#121212]">Products you are looking for</Label>
            <Input
              id="qq-product"
              name="product"
              defaultValue={product}
              key={product}
              className="rounded-xl border-[#D8D4C9] bg-white"
              placeholder="e.g. WPC panels, ceiling baffles…"
            />
          </div>
          
          <div className="mt-3 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-1/3 rounded-full border-[#D8D4C9] text-[#121212] hover:bg-white"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={sending}
              className="w-2/3 rounded-full bg-[#121212] text-white hover:bg-black"
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
