import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/admin/products/$id")({
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();

  return (
    <div className="mx-auto max-w-7xl">
      <ProductForm id={id} />
    </div>
  );
}
