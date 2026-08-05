import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { seedInitialAdmin } from "@/services/auth";
import { Settings, UserCheck, ShieldAlert, Sparkles, Database, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminSeeded, setIsAdminSeeded] = useState(false);
  const [checking, setChecking] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // General settings fields
  const [siteEmail, setSiteEmail] = useState("info@vensaiprime.com");
  const [sitePhone, setSitePhone] = useState("+91 98400 12345");
  const [siteAddress, setSiteAddress] = useState("No. 14, Poonamallee High Road, Kilpauk, Chennai 600010");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Load current site settings from Firestore
    async function loadSiteSettings() {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "site"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          if (data.email) setSiteEmail(data.email);
          if (data.phone) setSitePhone(data.phone);
          if (data.address) setSiteAddress(data.address);
        }
      } catch (error) {
        console.error("Error loading site settings from Firestore:", error);
      }
    }
    loadSiteSettings();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const docSnap = await getDoc(doc(db, "admins", user.uid));
          setIsAdminSeeded(docSnap.exists());
        } catch (error) {
          console.error("Error checking user:", error);
        }
      }
      setChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSeedAdmin = async () => {
    if (!currentUser) return;
    setSeeding(true);
    try {
      await seedInitialAdmin(
        currentUser.uid,
        currentUser.displayName || "Active Manager",
        currentUser.email || "manager.vensaiglobal@gmail.com",
        "admin"
      );
      setIsAdminSeeded(true);
      toast.success("Successfully registered your account as Admin in the database!");
    } catch (error) {
      toast.error("Failed to seed administrator profile. Check security rules.");
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "site"), {
        email: siteEmail,
        phone: sitePhone,
        address: siteAddress,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast.success("Global site settings updated successfully in Firestore!");
    } catch (error) {
      console.error("Error saving site settings:", error);
      toast.error("Failed to save site settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#121212] md:text-4xl">Settings</h1>
        <p className="text-sm text-[#776E63]">System configurations and site database settings.</p>
      </div>

      {/* Database Provisioning Tool */}
      <Card className="rounded-lg border-[#E5E2DC] bg-[#FAF8F5]/50 border-amber-200/50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-900">
            <ShieldAlert className="h-4 w-4 text-amber-700" /> Database Administration Bootstrapper
          </CardTitle>
          <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-amber-700">
            Seed admin credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs leading-relaxed text-amber-800 font-mono">
            To query, create, edit, or delete catalog documents, your authenticated user account must be registered in the Firestore <code>admins</code> collection.
          </p>
          
          {checking ? (
            <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
              <Loader2 className="h-4 w-4 animate-spin" /> Verifying DB registration status...
            </div>
          ) : currentUser ? (
            <div className="space-y-4">
              <div className="rounded border bg-white p-4 space-y-2 text-xs font-mono text-neutral-600">
                <div><span className="font-bold text-neutral-800">Active Firebase User:</span> {currentUser.email}</div>
                <div><span className="font-bold text-neutral-800">Auth UID:</span> {currentUser.uid}</div>
                <div>
                  <span className="font-bold text-neutral-800">DB Status:</span>{" "}
                  {isAdminSeeded ? (
                    <span className="text-emerald-600 font-bold">REGISTERED (ADMIN)</span>
                  ) : (
                    <span className="text-red-500 font-bold">UNREGISTERED (WRITE ACTIONS BLOCKED)</span>
                  )}
                </div>
              </div>

              {!isAdminSeeded && (
                <Button
                  onClick={handleSeedAdmin}
                  disabled={seeding}
                  className="rounded-sm bg-amber-700 text-white hover:bg-amber-800 font-mono text-xs uppercase tracking-wider py-4 flex items-center gap-2"
                >
                  {seeding && <Loader2 className="h-4 w-4 animate-spin" />}
                  <UserCheck className="h-4 w-4" /> Provision My Account as Admin
                </Button>
              )}
            </div>
          ) : (
            <p className="text-xs text-red-500 font-mono font-semibold">
              Please sign in with email/password to view provisioning status.
            </p>
          )}
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#8B7D6B]" /> Contact & Studio Information
          </CardTitle>
          <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
            Global website settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Contact Email</Label>
              <Input
                type="email"
                value={siteEmail}
                onChange={(e) => setSiteEmail(e.target.value)}
                className="rounded-sm border-[#E5E2DC]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Contact Telephone</Label>
              <Input
                value={sitePhone}
                onChange={(e) => setSitePhone(e.target.value)}
                className="rounded-sm border-[#E5E2DC]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-[#5B554C] font-mono">Flagship Studio Address</Label>
              <Input
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                className="rounded-sm border-[#E5E2DC]"
              />
            </div>

            <Button
              type="submit"
              disabled={savingSettings}
              className="rounded-sm bg-[#211C17] text-white font-mono text-xs uppercase tracking-widest py-5 px-6 flex items-center gap-2"
            >
              {savingSettings && <Loader2 className="h-4 w-4 animate-spin text-white" />}
              Save Settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
