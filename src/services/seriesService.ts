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
  writeBatch,
  increment,
  runTransaction,
  onSnapshot
} from "firebase/firestore";
import { Series } from "@/types/catalogue";

const COLLECTION_NAME = "series";

export function subscribeToSeries(
  onUpdate: (seriesList: Series[]) => void,
  includeHidden = false
): () => void {
  try {
    const q = query(collection(db, COLLECTION_NAME));
    return onSnapshot(
      q,
      (snap) => {
        let list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Series);
        if (!includeHidden) {
          list = list.filter((s) => !s.status || s.status === "active");
        }
        list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        onUpdate(list);
      },
      (error) => {
        console.error("Error subscribing to series:", error);
      }
    );
  } catch (error) {
    console.error("Error setting up series subscription:", error);
    return () => {};
  }
}

export async function getSeriesByCategory(categoryId: string, includeHidden = true): Promise<Series[]> {
  if (!categoryId) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("categoryId", "==", categoryId)
    );
    const snap = await getDocs(q);
    let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Series);

    if (!includeHidden) {
      list = list.filter(s => s.status === "active");
    }

    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error(`Error getting series for category ${categoryId}:`, error);
    return [];
  }
}

export async function getAllSeries(includeHidden = true): Promise<Series[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Series);

    if (!includeHidden) {
      list = list.filter(s => s.status === "active");
    }

    return list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Error getting all series:", error);
    return [];
  }
}

export async function createSeries(data: Omit<Series, "id" | "productCount" | "createdAt" | "updatedAt">): Promise<string> {
  try {
    // 1. Verify slug uniqueness globally or within category
    const slugQuery = query(
      collection(db, COLLECTION_NAME),
      where("categoryId", "==", data.categoryId),
      where("slug", "==", data.slug)
    );
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      throw new Error(`Series with slug "${data.slug}" already exists in this category.`);
    }

    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const seriesId = newDocRef.id;

    // Use a transaction to create series and increment category seriesCount
    await runTransaction(db, async (transaction) => {
      const categoryDocRef = doc(db, "categories", data.categoryId);
      const categoryDoc = await transaction.get(categoryDocRef);
      if (!categoryDoc.exists()) {
        throw new Error("Parent category does not exist.");
      }

      transaction.set(newDocRef, {
        ...data,
        productCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      transaction.update(categoryDocRef, {
        seriesCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    });

    return seriesId;
  } catch (error) {
    console.error("Error creating series:", error);
    throw error;
  }
}

export async function createSeriesBulk(
  categoryId: string,
  categoryName: string,
  seriesList: Omit<Series, "id" | "categoryId" | "categoryName" | "productCount" | "createdAt" | "updatedAt">[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Fetch current series in category to avoid duplicates
    const existingSeries = await getSeriesByCategory(categoryId);
    const existingSlugs = new Set(existingSeries.map(s => s.slug));
    const existingCodes = new Set(existingSeries.map(s => s.code.toLowerCase()));

    let addedCount = 0;

    for (const item of seriesList) {
      if (existingSlugs.has(item.slug)) {
        console.warn(`Skipping duplicate series slug: ${item.slug}`);
        continue;
      }
      if (item.code && existingCodes.has(item.code.toLowerCase())) {
        console.warn(`Skipping duplicate series code: ${item.code}`);
        continue;
      }

      const newDocRef = doc(collection(db, COLLECTION_NAME));
      batch.set(newDocRef, {
        ...item,
        categoryId,
        categoryName,
        productCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addedCount++;
    }

    if (addedCount > 0) {
      // Increment category seriesCount
      const categoryDocRef = doc(db, "categories", categoryId);
      batch.update(categoryDocRef, {
        seriesCount: increment(addedCount),
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
    }
  } catch (error) {
    console.error("Error creating bulk series:", error);
    throw error;
  }
}

export async function updateSeries(id: string, data: Partial<Series>): Promise<void> {
  try {
    if (data.slug && data.categoryId) {
      const slugQuery = query(
        collection(db, COLLECTION_NAME),
        where("categoryId", "==", data.categoryId),
        where("slug", "==", data.slug)
      );
      const slugSnap = await getDocs(slugQuery);
      const otherDocs = slugSnap.docs.filter(d => d.id !== id);
      if (otherDocs.length > 0) {
        throw new Error(`Series with slug "${data.slug}" already exists in this category.`);
      }
    }

    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };
    delete (updateData as any).createdAt;
    delete (updateData as any).productCount;
    delete (updateData as any).categoryId; // Prevent moving categories this way to keep counters safe
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error(`Error updating series ${id}:`, error);
    throw error;
  }
}

export async function deleteSeries(id: string, force = false): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    
    const seriesData = docSnap.data() as Series;

    // Check for dependent products
    const productsQuery = query(collection(db, "products"), where("seriesId", "==", id));
    const productsSnap = await getDocs(productsQuery);

    if (!productsSnap.empty && !force) {
      throw new Error(`This series contains ${productsSnap.size} product(s) and cannot be safely deleted.`);
    }

    // Run transaction to delete series and decrement category seriesCount
    await runTransaction(db, async (transaction) => {
      if (!productsSnap.empty && force) {
        productsSnap.docs.forEach((pDoc) => {
          transaction.delete(pDoc.ref);
        });
      }

      const categoryDocRef = doc(db, "categories", seriesData.categoryId);
      
      transaction.delete(docRef);
      transaction.update(categoryDocRef, {
        seriesCount: increment(-1),
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error(`Error deleting series ${id}:`, error);
    throw error;
  }
}

export async function updateSeriesOrder(orders: { id: string; order: number }[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    orders.forEach(({ id, order }) => {
      const docRef = doc(db, COLLECTION_NAME, id);
      batch.update(docRef, { order, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating series order:", error);
    throw error;
  }
}
