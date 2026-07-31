import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { type Product } from "@/lib/products";

export function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
  ctaType?: "enquire" | "explore";
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.55, delay: Math.min(index, 8) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/products/$slug" params={{ slug: product.slug }} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ddd1c0]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />
          {product.badge && (
            <span className="absolute left-3 top-3 border border-white/60 bg-[#261b14]/70 px-2 py-1 text-[0.55rem] uppercase tracking-[0.15em] text-white">
              {product.badge}
            </span>
          )}
        </div>
        <div className="border-b border-[#cdc4b7] py-3">
          <p className="text-[0.56rem] font-medium uppercase tracking-[0.15em] text-[#776f63]">
            {product.collection}
          </p>
          <div className="mt-1 flex items-center justify-between gap-4">
            <h3 className="text-sm font-medium tracking-[-0.025em] text-[#27221c] transition-colors group-hover:text-[#755c3b]">
              {product.name}
            </h3>
            <ArrowUpRight
              size={14}
              className="text-[#776f63] shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
