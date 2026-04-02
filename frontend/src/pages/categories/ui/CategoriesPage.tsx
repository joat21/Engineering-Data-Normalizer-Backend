import { Button, useOverlayState } from "@heroui/react";
import { useCategories } from "@/entities/category";
import { CreateCategoryModal } from "@/features/create-category";
import { AppLink, CategoryCard, PageLoader } from "@/shared/ui";

export const CategoriesPage = () => {
  const createCategoryModal = useOverlayState();

  const { data: categories, isPending } = useCategories();

  if (isPending) return <PageLoader />;

  return (
    <>
      <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-350">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">Управление категориями</h1>
            <p>
              Выберите категорию, чтобы перейти к созданию и редактированию
              атрибутов
            </p>
          </div>
          <Button onPress={createCategoryModal.open}>
            + Создать категорию
          </Button>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories?.map((category) => (
            <li key={category.id} className="w-full list-none">
              <AppLink to={category.id} className="w-full no-underline">
                <CategoryCard categoryName={category.name} />
              </AppLink>
            </li>
          ))}
        </ul>
      </div>
      <CreateCategoryModal
        onClose={createCategoryModal.close}
        isOpen={createCategoryModal.isOpen}
      />
    </>
  );
};
