import { Route, Routes } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { RequireAuth } from "./router/RequireAuth";
import { LoginPage } from "@/pages/login";
import { ImportPage } from "@/pages/import";
import { SingleImportPage } from "@/pages/single-import";
import { CatalogImportPage } from "@/pages/catelog-import";
import { EquipmentPage } from "@/pages/equipment";
import { ProjectsPage } from "@/pages/projects";
import { CategoriesPage } from "@/pages/categories";
import { CategoryPage } from "@/pages/category";
import { ProjectDetailsPage } from "@/pages/project-details";
import { ComparisonPage } from "@/pages/comparison";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route path="/" element={<RequireAuth />}>
          <Route index element={<h1>Main</h1>} />

          <Route path="/import">
            <Route index element={<ImportPage />} />
            <Route path="catalog" element={<CatalogImportPage />} />
            <Route path="single" element={<SingleImportPage />} />
          </Route>

          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="comparison" element={<ComparisonPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:id" element={<CategoryPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<h1>404 Страница не найдена</h1>} />
    </Routes>
  );
}

export default App;
