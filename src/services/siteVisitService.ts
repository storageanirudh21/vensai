import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { SiteVisit, SiteVisitStatus } from "@/types/catalogue";

const COLLECTION_NAME = "siteVisits";

export async function getSiteVisits(statusFilter?: SiteVisitStatus): Promise<SiteVisit[]> {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    if (statusFilter) {
      q = query(collection(db, COLLECTION_NAME), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SiteVisit);
  } catch (error) {
    console.error("Error getting site visits:", error);
    throw error;
  }
}

export async function getSiteVisit(id: string): Promise<SiteVisit | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as SiteVisit;
  } catch (error) {
    console.error(`Error getting site visit ${id}:`, error);
    throw error;
  }
}

export async function createSiteVisit(data: Omit<SiteVisit, "id" | "status" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const visit: Omit<SiteVisit, "id"> = {
      ...data,
      status: "requested",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await setDoc(newDocRef, visit);
    return newDocRef.id;
  } catch (error) {
    console.error("Error creating site visit:", error);
    throw error;
  }
}

export async function updateSiteVisitStatus(id: string, status: SiteVisitStatus): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating site visit status ${id}:`, error);
    throw error;
  }
}
