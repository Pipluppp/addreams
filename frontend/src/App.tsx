import { type ReactNode, lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RouteLoadingFrame } from "./components/molecules/RouteLoadingFrame";
import { AppShellLayout } from "./components/layouts/AppShellLayout";

const HomeRoute = lazy(() => import("./routes/home"));
const ProductShootsRoute = lazy(() => import("./routes/studio/product-shoots"));
const AdGraphicsRoute = lazy(() => import("./routes/studio/ad-graphics"));
const NotFoundRoute = lazy(() => import("./routes/not-found"));

function withSuspense(node: ReactNode, label: string) {
  return <Suspense fallback={<RouteLoadingFrame label={label} />}>{node}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route index element={withSuspense(<HomeRoute />, "Loading homepage...")} />
          <Route
            path="product-shoots"
            element={withSuspense(<AdGraphicsRoute />, "Loading Product Shoots...")}
          />
          <Route
            path="ad-graphics"
            element={withSuspense(<ProductShootsRoute />, "Loading Ad Graphics...")}
          />
          <Route path="studio" element={<Navigate to="/product-shoots" replace />} />
          <Route path="studio/product-shoots" element={<Navigate to="/product-shoots" replace />} />
          <Route path="studio/ad-graphics" element={<Navigate to="/ad-graphics" replace />} />
          <Route path="*" element={withSuspense(<NotFoundRoute />, "Loading page...")} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
