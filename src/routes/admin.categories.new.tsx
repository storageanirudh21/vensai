import { createFileRoute } from "@tanstack/react-router";
import { CategoryForm } from "@/components/admin/category-form";

export const Route = createFileRoute("/admin/categories/new")({
  validateSearch: (search: Record<string, unknown>): { duplicateId?: string } => {
    return {
      duplicateId: typeof search.duplicateId === "string" ? search.duplicateId : undefined,
    };
  },
  component: NewCategoryPage,
});

function NewCategoryPage() {
  const { duplicateId } = Route.useSearch();
  
  return (
    <div className="mx-auto max-w-5xl">
      <CategoryForm duplicateId={duplicateId} />
    </div>
  );
}
