import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { AdminUser, AdminRole } from "@/types/catalogue";
import { Users, UserX, UserCheck, Shield, Key, AlertTriangle, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (currentUid?: string) => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "admins"));
      const list = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }) as AdminUser);
      setUsers(list);

      const activeUid = currentUid || auth.currentUser?.uid;
      if (activeUid) {
        const profile = list.find(u => u.uid === activeUid);
        if (profile) setCurrentAdmin(profile);
      }
    } catch (error) {
      toast.error("Failed to load administration accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadData(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleRoleChange = async (uid: string, newRole: AdminRole, name: string) => {
    if (uid === currentAdmin?.uid) {
      toast.error("You cannot edit your own role.");
      return;
    }
    
    try {
      await updateDoc(doc(db, "admins", uid), { role: "admin" });
      toast.success(`Role for ${name} updated`);
      setUsers(users.map(u => u.uid === uid ? { ...u, role: "admin" } : u));
    } catch (error) {
      toast.error("Permission denied");
    }
  };

  const handleToggleActive = async (uid: string, active: boolean, name: string) => {
    if (uid === currentAdmin?.uid) {
      toast.error("You cannot deactivate your own account.");
      return;
    }

    try {
      await updateDoc(doc(db, "admins", uid), { active });
      toast.success(`${name} has been ${active ? "activated" : "deactivated"}`);
      setUsers(users.map(u => u.uid === uid ? { ...u, active } : u));
    } catch (error) {
      toast.error("Permission denied");
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getRoleBadge = (_role: AdminRole) => {
    return <Badge className="bg-black text-white font-mono text-[9px] uppercase tracking-wider">Admin</Badge>;
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#121212] md:text-4xl">Admin Users</h1>
        <p className="text-sm text-[#776E63]">Manage console users and control site access.</p>
      </div>

      {/* Users table */}
      <Card className="rounded-lg border-[#E5E2DC] bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-[#8B7D6B]" /> System Accounts
          </CardTitle>
          <CardDescription className="font-mono text-[9px] uppercase tracking-wider text-[#776E63]">
            Console access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-neutral-50/50">
              <TableRow className="border-b border-[#E5E2DC] font-mono text-[9px] tracking-wider uppercase text-[#776E63]">
                <TableHead>Administrator Name</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active State</TableHead>
                <TableHead>Created On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <TableRow key={i} className="border-b border-[#E5E2DC]/50">
                    <TableCell><Skeleton className="h-4 w-32 bg-neutral-100" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48 bg-neutral-100" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28 bg-neutral-100" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12 bg-neutral-100" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-neutral-100" /></TableCell>
                  </TableRow>
                ))
              ) : (
                users.map((u) => {
                  const isSelf = u.uid === currentAdmin?.uid;
                  return (
                    <TableRow key={u.uid} className="border-b border-[#E5E2DC]/50 hover:bg-neutral-50/30 transition-colors">
                      <TableCell className="font-semibold text-xs text-[#121212] flex items-center gap-2 py-4">
                        {u.name} {isSelf && <span className="font-mono text-[8px] bg-neutral-100 text-neutral-500 px-1 rounded">You</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-neutral-600">{u.email}</TableCell>
                      <TableCell>
                        {getRoleBadge(u.role)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={u.active}
                            disabled={isSelf}
                            onCheckedChange={(val) => handleToggleActive(u.uid, val, u.name)}
                          />
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[#776E63] font-semibold">
                            {u.active ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
