import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { Brochure } from "@/types/catalogue";

const COLLECTION_NAME = "brochures";

export async function getBrochures(includeHidden = true): Promise<Brochure[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Brochure);
    if (!includeHidden) {
      list = list.filter(b => b.status === "active" || !b.status);
    }
    return list;
  } catch (error) {
    console.error("Error getting brochures from Firebase:", error);
    return [];
  }
}

export async function createBrochure(data: Omit<Brochure, "id" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const brochure: Omit<Brochure, "id"> = {
      ...data,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await setDoc(newDocRef, brochure);
    return newDocRef.id;
  } catch (error) {
    console.error("Error creating brochure:", error);
    throw error;
  }
}

export async function deleteBrochure(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error(`Error deleting brochure ${id}:`, error);
    throw error;
  }
}
