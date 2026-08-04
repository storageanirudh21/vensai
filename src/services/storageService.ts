import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

// Configure pdf.js worker for client-side execution
if (typeof window !== "undefined") {
  const v = pdfjsLib.version || "4.10.38";
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.mjs`;
}

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

/**
 * Compresses an image file without perceptible quality loss using browser-image-compression,
 * with automatic fallback to canvas-based WebP conversion.
 */
export async function compressImage(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (file.size < 150 * 1024) return file; // Skip compression for small files (<150KB)

  try {
    const options = {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.82,
      fileType: "image/webp",
    };

    const compressedBlob = await imageCompression(file, options);
    if (compressedBlob && compressedBlob.size < file.size) {
      const ext = compressedBlob.type === "image/webp" ? "webp" : file.name.split(".").pop() || "jpg";
      const newName = `${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
      const compressedFile = new File([compressedBlob], newName, {
        type: compressedBlob.type || "image/webp",
        lastModified: Date.now(),
      });
      console.log(`[Storage] Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
      return compressedFile;
    }
  } catch (error) {
    console.warn("[Storage] Image compression library fallback to canvas:", error);
    try {
      const fallbackBlob = await resizeImage(file, 1920, 1920, 0.82);
      if (fallbackBlob.size < file.size) {
        return new File([fallbackBlob], `${file.name.replace(/\.[^/.]+$/, "")}.webp`, {
          type: "image/webp",
          lastModified: Date.now(),
        });
      }
    } catch (e) {
      // Fall through to returning original file
    }
  }

  return file;
}

/**
 * Deep compresses heavy PDFs containing large embedded high-res images
 * by rendering page canvases and re-encoding at optimized JPEG quality.
 */
export async function compressHeavyPdf(file: File): Promise<File> {
  if (typeof window === "undefined") return file;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (numPages === 0) return file;

    const newPdf = await PDFDocument.create();

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 }); // ~150 DPI target resolution

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

      // Convert page canvas to compressed JPEG blob
      const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.78);
      const imageBytes = await fetch(jpegDataUrl).then((res) => res.arrayBuffer());
      const embeddedImage = await newPdf.embedJpg(imageBytes);

      // Create new page with original dimensions
      const originalViewport = page.getViewport({ scale: 1.0 });
      const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });
    }

    const compressedBytes = await newPdf.save({ useObjectStreams: true });
    if (compressedBytes.byteLength < file.size) {
      const compressedBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const compressedFile = new File([compressedBlob], file.name, {
        type: "application/pdf",
        lastModified: Date.now(),
      });
      console.log(`[Storage] Deep PDF compression: ${(file.size / (1024 * 1024)).toFixed(2)}MB -> ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      return compressedFile;
    }
  } catch (error) {
    console.warn("[Storage] Deep PDF compression fallback:", error);
  }

  return file;
}

/**
 * Compresses a PDF file using stream object compression, and automatically triggers
 * deep image raster compression for heavy PDFs (>3MB) to reduce file size by 70–95%.
 */
export async function compressPdf(file: File): Promise<File> {
  if (typeof window === "undefined") return file;
  if (file.size < 100 * 1024) return file; // Skip tiny PDFs (<100KB)

  let processedFile = file;

  // Pass 1: Fast stream object compression with pdf-lib
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
    });

    if (compressedBytes.byteLength < file.size) {
      const compressedBlob = new Blob([compressedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      processedFile = new File([compressedBlob], file.name, {
        type: "application/pdf",
        lastModified: Date.now(),
      });
    }
  } catch (error) {
    console.warn("[Storage] PDF stream compression skipped:", error);
  }

  // Pass 2: Heavy PDF Rasterization Pass for large image-based PDFs (>3MB)
  const reductionPercentage = ((file.size - processedFile.size) / file.size) * 100;
  if (file.size > 3 * 1024 * 1024 && reductionPercentage < 15) {
    console.log(`[Storage] Running deep image raster compression for heavy PDF (${(file.size / (1024 * 1024)).toFixed(1)}MB)...`);
    processedFile = await compressHeavyPdf(file);
  }

  return processedFile;
}

// Client-side image resizing utility using Canvas
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
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
 * Uploads a raw file (e.g. PDF brochure, cover photo) to Storage with automatic image/PDF compression
 */
export async function uploadRawFile(
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadedFileMetadata> {
  let fileToUpload = file;

  // Compress file before uploading
  if (file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name)) {
    fileToUpload = await compressImage(file);
  } else if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    fileToUpload = await compressPdf(file);
  }

  const fileName = `${Date.now()}-${fileToUpload.name.replace(/\s+/g, "_")}`;
  const fullPath = `${path.replace(/\/$/, "")}/${fileName}`;
  const storageRef = ref(storage, fullPath);

  const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

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
          fileName: fileToUpload.name,
          fileSize: fileToUpload.size,
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
  // Compress input image first without quality loss
  const compressedInput = await compressImage(file);

  const baseName = `${Date.now()}-${compressedInput.name.split(".")[0].replace(/\s+/g, "_")}`;
  
  // Create resized Blobs
  const originalBlob = await resizeImage(compressedInput, 1600, 1600, 0.85); // original cap
  const optimizedBlob = await resizeImage(compressedInput, 800, 800, 0.82);   // medium
  const thumbnailBlob = await resizeImage(compressedInput, 400, 400, 0.80);   // thumbnail

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

  // Upload variants sequentially
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
  }
}
