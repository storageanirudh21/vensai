import { createFileRoute } from "@tanstack/react-router";
import { CategoryForm } from "@/components/admin/category-form";

export const Route = createFileRoute("/admin/categories/$id")({
  component: EditCategoryPage,
});

function EditCategoryPage() {
  const { id } = Route.useParams();

  return (
    <div className="mx-auto max-w-5xl">
      <CategoryForm id={id} />
    </div>
  );
}
