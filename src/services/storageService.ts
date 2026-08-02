import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

export interface UploadedFileMetadata {
  url: string;
  storagePath: string;
  fileName: string;
  fileSize: number;
}

export interface UploadedImageGroup {
  original: UploadedFileMetadata;
  optimized: UploadedFileMetadata;
  thumbnail: UploadedFileMetadata;
}

// Client-side image resizing utility
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If running in SSR, return the file as-is (though uploading is a client-only action)
    if (typeof window === "undefined") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas conversion to Blob failed"));
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image element"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a raw file (e.g. PDF brochure) to Storage
 */
export async function uploadRawFile(
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFileMetadata> {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
  const fullPath = `${path.replace(/\/$/, "")}/${fileName}`;
  const storageRef = ref(storage, fullPath);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("Storage upload failed:", error);
        reject(error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url,
          storagePath: fullPath,
          fileName: file.name,
          fileSize: file.size,
        });
      }
    );
  });
}

/**
 * Uploads a product image and generates original, optimized, and thumbnail variants
 */
export async function uploadProductImageGroup(
  productId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedImageGroup> {
  const baseName = `${Date.now()}-${file.name.split(".")[0].replace(/\s+/g, "_")}`;
  
  // Create resized Blobs
  const originalBlob = await resizeImage(file, 1600, 1600, 0.85); // original size cap
  const optimizedBlob = await resizeImage(file, 800, 800, 0.82);   // medium
  const thumbnailBlob = await resizeImage(file, 400, 400, 0.80);   // thumbnail

  const paths = {
    original: `products/${productId}/original/${baseName}-original.webp`,
    optimized: `products/${productId}/optimized/${baseName}-optimized.webp`,
    thumbnail: `products/${productId}/thumbnails/${baseName}-thumbnail.webp`,
  };

  // Upload variants
  const uploadSingle = async (storagePath: string, blob: Blob, progressWeight: number, offset: number) => {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise<UploadedFileMetadata>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(Math.round(offset + progress * progressWeight));
          }
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url,
            storagePath,
            fileName: storagePath.split("/").pop() || "",
            fileSize: blob.size,
          });
        }
      );
    });
  };

  // Upload in sequence or concurrently. In sequence lets us track overall progress easily.
  const originalMeta = await uploadSingle(paths.original, originalBlob, 0.4, 0);
  const optimizedMeta = await uploadSingle(paths.optimized, optimizedBlob, 0.4, 40);
  const thumbnailMeta = await uploadSingle(paths.thumbnail, thumbnailBlob, 0.2, 80);

  if (onProgress) onProgress(100);

  return {
    original: originalMeta,
    optimized: optimizedMeta,
    thumbnail: thumbnailMeta,
  };
}

/**
 * Deletes a file from Firebase Storage
 */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (error) {
    console.error(`Failed to delete storage file at ${storagePath}:`, error);
    // Suppress error if the file was already deleted/not found
  }
}
