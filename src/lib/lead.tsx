import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type LeadContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  product: string;
  openQuery: (product?: string) => void;
  visitOpen: boolean;
  setVisitOpen: (v: boolean) => void;
  visitProduct: string;
  openVisit: (product?: string) => void;
};

const LeadContext = createContext<LeadContextValue | null>(null);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState("");
  
  const [visitOpen, setVisitOpen] = useState(false);
  const [visitProduct, setVisitProduct] = useState("");

  const openQuery = useCallback((p?: string) => {
    setProduct(p ?? "");
    setOpen(true);
  }, []);

  const openVisit = useCallback((p?: string) => {
    setVisitProduct(p ?? "");
    setVisitOpen(true);
  }, []);

  const value = useMemo<LeadContextValue>(
    () => ({ open, setOpen, product, openQuery, visitOpen, setVisitOpen, visitProduct, openVisit }),
    [open, product, openQuery, visitOpen, visitProduct, openVisit],
  );

  return <LeadContext.Provider value={value}>{children}</LeadContext.Provider>;
}

export function useLead() {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error("useLead must be used inside LeadProvider");
  return ctx;
}
