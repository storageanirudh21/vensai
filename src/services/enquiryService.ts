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
import { Enquiry, EnquiryStatus } from "@/types/catalogue";

const COLLECTION_NAME = "enquiries";

export async function getEnquiries(statusFilter?: EnquiryStatus): Promise<Enquiry[]> {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    if (statusFilter) {
      q = query(collection(db, COLLECTION_NAME), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Enquiry);
  } catch (error) {
    console.error("Error getting enquiries:", error);
    throw error;
  }
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Enquiry;
  } catch (error) {
    console.error(`Error getting enquiry ${id}:`, error);
    throw error;
  }
}

export async function createEnquiry(data: Omit<Enquiry, "id" | "status" | "internalNotes" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const enquiry: Omit<Enquiry, "id"> = {
      ...data,
      status: "new",
      internalNotes: "",
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await setDoc(newDocRef, enquiry);
    return newDocRef.id;
  } catch (error) {
    console.error("Error creating enquiry:", error);
    throw error;
  }
}

export async function updateEnquiryStatus(id: string, status: EnquiryStatus, internalNotes?: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating enquiry status ${id}:`, error);
    throw error;
  }
}
