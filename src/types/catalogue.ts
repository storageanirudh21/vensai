import { Timestamp } from "firebase/firestore";

export type AdminRole = "super_admin" | "catalogue_manager" | "sales";

export interface AdminUser {
  uid: string;
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  createdAt: Timestamp;
}

export interface ImageMetadata {
  url: string;
  thumbnailUrl?: string;
  storagePath: string;
  alt: string;
  width?: number;
  height?: number;
  finishId?: string; // Associated with a specific finish
}

export interface SpecField {
  label: string;
  key: string;
  type: "text" | "number" | "select" | "multi-select" | "boolean";
  unit?: string;
  required: boolean;
  order: number;
}

export interface FilterField {
  key: string;
  label: string;
  type: "select" | "multi-select" | "number" | "boolean";
  source: "product" | "finish" | "series";
  unit?: string;
  order: number;
  enabled: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  coverImage: ImageMetadata | null;
  featured: boolean;
  status: "active" | "hidden";
  order: number;
  seriesCount: number;
  productCount: number;
  filterConfig: FilterField[];
  specificationTemplate: SpecField[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Series {
  id: string;
  name: string;
  slug: string;
  code: string;
  categoryId: string;
  categoryName: string; // Denormalized for display
  description: string;
  image: ImageMetadata | null;
  order: number;
  productCount: number;
  status: "active" | "hidden";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProductFinish {
  id: string;
  name: string;
  slug: string;
  code: string;
  swatch: string | null; // Color hex or small swatch img URL
  image: ImageMetadata | null;
  available: boolean;
  isDefault: boolean;
  order: number;
}

export interface ProductSpecification {
  key: string;
  label: string;
  value: string;
  unit?: string;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string; // Denormalized
  seriesId: string;
  seriesName: string; // Denormalized
  shortDescription: string;
  description: string;
  primaryImage: ImageMetadata | null;
  images: ImageMetadata[];
  finishes: ProductFinish[];
  specifications: ProductSpecification[];
  filterData: Record<string, any>; // Key-value filters, e.g. { thickness: 12, application: ['Feature Wall'] }
  brochure: {
    id: string;
    title: string;
    fileUrl: string;
  } | null;
  featured: boolean;
  status: "draft" | "published" | "hidden";
  order: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt: Timestamp | null;
}

export interface Brochure {
  id: string;
  title: string;
  categoryId: string | null;
  categoryName?: string | null;
  fileName: string;
  fileUrl: string;
  pdfUrl?: string;
  storagePath: string;
  fileSize: number;
  status: "active" | "hidden";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type EnquiryStatus = "new" | "contacted" | "qualified" | "closed";

export interface Enquiry {
  id: string;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  seriesId: string;
  seriesName: string;
  selectedFinish: string;
  quantity: number | null;
  quantityUnit: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  message: string;
  status: EnquiryStatus;
  internalNotes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type SiteVisitStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface SiteVisit {
  id: string;
  productId: string | null;
  productName: string | null;
  customerName: string;
  phone: string;
  email: string;
  preferredDate: string;
  preferredTime: string;
  projectType: string;
  location: string;
  notes: string;
  status: SiteVisitStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
