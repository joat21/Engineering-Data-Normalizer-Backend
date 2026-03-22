import { Route, Routes } from "react-router";
import { LoginPage } from "./pages/login";
import { MainLayout } from "./layouts/MainLayout";
import { RequireAuth } from "./router/RequireAuth";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/" element={<RequireAuth />}>
          <Route index element={<h1>Main</h1>} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
