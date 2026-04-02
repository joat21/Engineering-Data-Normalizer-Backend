import { useCategories } from "@/entities/category";
import { AppLink, CategoryCard, PageLoader } from "@/shared/ui";

export const CategorySelection = () => {
  const { data: categories, isPending } = useCategories();

  if (isPending) return <PageLoader />;

  return (
    <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-350">
      <h1 className="text-3xl font-semibold">Каталог оборудования</h1>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories?.map((category) => (
          <li key={category.id} className="w-full list-none">
            <AppLink
              to={{
                pathname: "/equipment",
                search: `?categoryId=${category.id}`,
              }}
              className="w-full no-underline"
            >
              <CategoryCard categoryName={category.name} />
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
};
