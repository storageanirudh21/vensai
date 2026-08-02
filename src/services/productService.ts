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
  limit,
  startAfter,
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch,
  DocumentSnapshot
} from "firebase/firestore";
import { Product } from "@/types/catalogue";

const COLLECTION_NAME = "products";

interface GetProductsOptions {
  categoryId?: string;
  seriesId?: string;
  status?: "draft" | "published" | "hidden";
  featured?: boolean;
  search?: string; // name or SKU prefix
  pageSize?: number;
  lastDoc?: DocumentSnapshot;
}

export async function getProducts(options: GetProductsOptions = {}): Promise<{
  products: Product[];
  lastDoc: DocumentSnapshot | null;
}> {
  try {
    const { categoryId, seriesId, status, featured, search, pageSize = 24, lastDoc } = options;
    
    let q = query(collection(db, COLLECTION_NAME));

    // Apply filters
    if (categoryId) {
      q = query(q, where("categoryId", "==", categoryId));
    }
    if (seriesId) {
      q = query(q, where("seriesId", "==", seriesId));
    }
    if (status) {
      q = query(q, where("status", "==", status));
    }
    if (featured !== undefined) {
      q = query(q, where("featured", "==", featured));
    }
    
    // Prefix search on name or SKU
    if (search) {
      const cleanSearch = search.trim().toLowerCase();
      // To support lowercase prefix search on name, we search against nameLower
      // We will make sure products have a nameLower field
      q = query(q, where("searchName", ">=", cleanSearch), where("searchName", "<=", cleanSearch + "\uf8ff"));
    } else {
      // Order by display order then update time
      q = query(q, orderBy("order", "asc"), orderBy("updatedAt", "desc"));
    }

    // Apply pagination
    q = query(q, limit(pageSize));
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snap = await getDocs(q);
    const products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
    const nextLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

    return {
      products,
      lastDoc: nextLastDoc
    };
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as Product;
  } catch (error) {
    console.error(`Error getting product ${id}:`, error);
    throw error;
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("slug", "==", slug), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Product;
  } catch (error) {
    console.error(`Error getting product by slug ${slug}:`, error);
    throw error;
  }
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt" | "publishedAt">): Promise<string> {
  try {
    // 1. Verify slug uniqueness
    const slugQuery = query(collection(db, COLLECTION_NAME), where("slug", "==", data.slug));
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) {
      throw new Error(`Product with slug "${data.slug}" already exists.`);
    }

    const newDocRef = doc(collection(db, COLLECTION_NAME));
    const productId = newDocRef.id;

    // Use transaction to set product and increment productCount in Category & Series
    await runTransaction(db, async (transaction) => {
      const categoryDocRef = doc(db, "categories", data.categoryId);
      const seriesDocRef = doc(db, "series", data.seriesId);

      const productPayload = {
        ...data,
        searchName: data.name.toLowerCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: data.status === "published" ? serverTimestamp() : null
      };

      transaction.set(newDocRef, productPayload);
      transaction.update(categoryDocRef, {
        productCount: increment(1),
        updatedAt: serverTimestamp()
      });
      transaction.update(seriesDocRef, {
        productCount: increment(1),
        updatedAt: serverTimestamp()
      });
    });

    return productId;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) throw new Error("Product does not exist.");
    
    const oldProduct = docSnap.data() as Product;

    // Verify slug uniqueness if changed
    if (data.slug && data.slug !== oldProduct.slug) {
      const slugQuery = query(collection(db, COLLECTION_NAME), where("slug", "==", data.slug));
      const slugSnap = await getDocs(slugQuery);
      const otherDocs = slugSnap.docs.filter(d => d.id !== id);
      if (otherDocs.length > 0) {
        throw new Error(`Product with slug "${data.slug}" already exists.`);
      }
    }

    const categoryChanged = data.categoryId && data.categoryId !== oldProduct.categoryId;
    const seriesChanged = data.seriesId && data.seriesId !== oldProduct.seriesId;

    await runTransaction(db, async (transaction) => {
      const updatePayload: any = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      if (data.name) {
        updatePayload.searchName = data.name.toLowerCase();
      }

      if (data.status === "published" && oldProduct.status !== "published") {
        updatePayload.publishedAt = serverTimestamp();
      } else if (data.status && data.status !== "published") {
        updatePayload.publishedAt = null;
      }

      // Safe update
      delete updatePayload.createdAt;

      transaction.update(docRef, updatePayload);

      // Handle category count updates if category changed
      if (categoryChanged) {
        const oldCategoryRef = doc(db, "categories", oldProduct.categoryId);
        const newCategoryRef = doc(db, "categories", data.categoryId!);
        transaction.update(oldCategoryRef, {
          productCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        transaction.update(newCategoryRef, {
          productCount: increment(1),
          updatedAt: serverTimestamp()
        });
      }

      // Handle series count updates if series changed
      if (seriesChanged) {
        const oldSeriesRef = doc(db, "series", oldProduct.seriesId);
        const newSeriesRef = doc(db, "series", data.seriesId!);
        transaction.update(oldSeriesRef, {
          productCount: increment(-1),
          updatedAt: serverTimestamp()
        });
        transaction.update(newSeriesRef, {
          productCount: increment(1),
          updatedAt: serverTimestamp()
        });
      }
    });
  } catch (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return;
    
    const product = docSnap.data() as Product;

    // Use transaction to delete and decrement productCount in Category & Series
    await runTransaction(db, async (transaction) => {
      const categoryDocRef = doc(db, "categories", product.categoryId);
      const seriesDocRef = doc(db, "series", product.seriesId);

      transaction.delete(docRef);
      transaction.update(categoryDocRef, {
        productCount: increment(-1),
        updatedAt: serverTimestamp()
      });
      transaction.update(seriesDocRef, {
        productCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

export async function duplicateProduct(id: string): Promise<string> {
  try {
    const srcProduct = await getProduct(id);
    if (!srcProduct) throw new Error("Source product not found.");

    // Generate unique slug
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newSlug = `${srcProduct.slug}-dup-${rand}`;

    const newProductData: Omit<Product, "id" | "createdAt" | "updatedAt" | "publishedAt"> = {
      name: `${srcProduct.name} (Copy)`,
      slug: newSlug,
      sku: "", // Clear SKU for duplicate to prevent conflicts
      categoryId: srcProduct.categoryId,
      categoryName: srcProduct.categoryName,
      seriesId: srcProduct.seriesId,
      seriesName: srcProduct.seriesName,
      shortDescription: srcProduct.shortDescription,
      description: srcProduct.description,
      primaryImage: srcProduct.primaryImage,
      images: srcProduct.images.map(img => ({ ...img, finishId: undefined })), // Clear specific finish attachments if they refer to src finishes
      finishes: srcProduct.finishes.map(f => ({
        ...f,
        id: doc(collection(db, "temp")).id, // Assign new unique finish ids
        isDefault: f.isDefault,
      })),
      specifications: srcProduct.specifications,
      filterData: srcProduct.filterData,
      brochure: srcProduct.brochure,
      featured: false,
      status: "draft", // Save as draft initially
      order: srcProduct.order + 1,
      seo: {
        title: `${srcProduct.name} (Copy) | Vensai Prime`,
        description: srcProduct.seo.description,
        keywords: [...srcProduct.seo.keywords]
      }
    };

    return await createProduct(newProductData);
  } catch (error) {
    console.error(`Error duplicating product ${id}:`, error);
    throw error;
  }
}
