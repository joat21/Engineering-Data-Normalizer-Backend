import { Route, Routes } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { RequireAuth } from "./router/RequireAuth";
import { LoginPage } from "@/pages/login";
import { ImportPage } from "@/pages/import";
import { SingleImportPage } from "@/pages/single-import";
import { CatalogImportPage } from "@/pages/catelog-import";
import { EquipmentPage } from "./pages/equipment";
import { ProjectsPage } from "./pages/projects";
import { MapColumns } from "./pages/catelog-import/ui/MapColumns";

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
            <Route
              path="map"
              element={
                <MapColumns
                  sessionId="d9a705c1-5b4d-4f41-aa17-90d4614fac16"
                  categoryId="84eb045d-ca69-4446-9d2f-8f8184c72180"
                />
              }
            />
          </Route>

          <Route path="equipment" element={<EquipmentPage />} />
          <Route path="comparison" element={<h1>Сравнение</h1>} />
          <Route path="categories" element={<h1>Категории</h1>} />
          <Route path="projects" element={<ProjectsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<h1>404 Страница не найдена</h1>} />
    </Routes>
  );
}

export default App;
