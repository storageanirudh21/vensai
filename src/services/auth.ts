import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { AdminUser, AdminRole } from "@/types/catalogue";

export async function loginAdmin(email: string, pass: string): Promise<AdminUser> {
  const creds = await signInWithEmailAndPassword(auth, email, pass);
  const adminDoc = await getDoc(doc(db, "admins", creds.user.uid));
  
  if (!adminDoc.exists()) {
    // Check if it's the very first login and we want to auto-provision an admin
    // For convenience when they first deploy: if no admins exist or if we want to seed:
    // Let's sign them out and show unauthorized.
    await fbSignOut(auth);
    throw new Error("Access denied: You do not have admin permissions in the database.");
  }
  
  const data = adminDoc.data();
  if (!data.active) {
    await fbSignOut(auth);
    throw new Error("Access denied: Your account is inactive.");
  }
  
  return {
    uid: creds.user.uid,
    name: data.name,
    email: data.email,
    role: data.role,
    active: data.active,
    createdAt: data.createdAt,
  } as AdminUser;
}

export async function logoutAdmin(): Promise<void> {
  await fbSignOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getAdminProfile(uid: string): Promise<AdminUser | null> {
  try {
    const adminDoc = await getDoc(doc(db, "admins", uid));
    if (!adminDoc.exists()) return null;
    const data = adminDoc.data();
    if (!data.active) return null;
    return { uid, ...data } as AdminUser;
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return null;
  }
}

// Simple utility to seed the first admin if needed. Admin can trigger this or we can call it.
export async function seedInitialAdmin(uid: string, name: string, email: string, role: AdminRole = "admin"): Promise<void> {
  await setDoc(doc(db, "admins", uid), {
    name,
    email,
    role,
    active: true,
    createdAt: serverTimestamp(),
  });
}
