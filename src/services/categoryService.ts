import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { Category, FilterField, SpecField } from "@/types/catalogue";

const COLLECTION_NAME = "categories";

export async function getCategories(includeHidden = true): Promise<Category[]> {
  try {
    let q = query(collection(db, COLLECTION_NAME), orderBy("order", "asc"));
    if (!includeHidden) {
      q = query(collection(db, COLLECTION_NAME), where("status", "==", "active"), orderBy("order", "asc"));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Category);
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
}

export async function getCategory(id: string): Promise<Category | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Category;
  } catch (error) {
    console.error(`Error getting category ${id}:`, error);
    throw error;
  }
}

export async function createCategory(data: Omit<Category, "id" | "seriesCount" | "productCount" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // Check if slug is unique
    const slugQuery = query(collection(db, COLLECTION_NAME), where("slug", "==", data.slug));
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      throw new Error(`Category with slug "${data.slug}" already exists.`);
    }

    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const category: Omit<Category, "id"> = {
      ...data,
      seriesCount: 0,
      productCount: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
    };
    await setDoc(newDocRef, category);
    return newDocRef.id;
  } catch (error) {
    console.error("Error creating category:", error);
    throw error;
  }
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  try {
    // Check if slug is unique (excluding this category)
    if (data.slug) {
      const slugQuery = query(collection(db, COLLECTION_NAME), where("slug", "==", data.slug));
      const slugSnap = await getDocs(slugQuery);
      const otherDocs = slugSnap.docs.filter(d => d.id !== id);
      if (otherDocs.length > 0) {
        throw new Error(`Category with slug "${data.slug}" already exists.`);
      }
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    // Don't overwrite counts or timestamps via generic update
    delete (updateData as any).createdAt;
    delete (updateData as any).seriesCount;
    delete (updateData as any).productCount;
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating category ${id}:`, error);
    throw error;
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    // 1. Check for dependent series
    const seriesQuery = query(collection(db, "series"), where("categoryId", "==", id));
    const seriesSnap = await getDocs(seriesQuery);
    
    // 2. Check for dependent products
    const productsQuery = query(collection(db, "products"), where("categoryId", "==", id));
    const productsSnap = await getDocs(productsQuery);
    
    if (!seriesSnap.empty || !productsSnap.empty) {
      throw new Error(`This category contains ${seriesSnap.size} series and ${productsSnap.size} products. Please reassign or delete them first.`);
    }
    
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error);
    throw error;
  }
}

export async function updateCategoryOrder(orders: { id: string; order: number }[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orders.forEach(({ id, order }) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.update(docRef, { order, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating categories order:", error);
    throw error;
  }
}
