import { Route, Routes } from "react-router";
import { MainLayout } from "./layouts/MainLayout";
import { RequireAuth } from "./router/RequireAuth";
import { LoginPage } from "@/pages/login";
import { ImportPage } from "@/pages/import";
import { SingleImportPage } from "@/pages/single-import";
import { CatalogImportPage } from "@/pages/catelog-import";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<RequireAuth />}>
          <Route index element={<h1>Main</h1>} />

          <Route path="/import">
            <Route index element={<ImportPage />} />
            <Route path="catalog" element={<CatalogImportPage />} />
            <Route path="single" index element={<SingleImportPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
