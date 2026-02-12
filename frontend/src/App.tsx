import { type ReactNode, lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RouteLoadingFrame } from "./components/molecules/RouteLoadingFrame";
import { AppShellLayout } from "./components/layouts/AppShellLayout";
import { StudioLayout } from "./components/layouts/StudioLayout";

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
          <Route path="studio" element={<StudioLayout />}>
            <Route index element={<Navigate to="/studio/product-shoots" replace />} />
            <Route
              path="product-shoots"
              element={withSuspense(<ProductShootsRoute />, "Loading Product Shoots...")}
            />
            <Route
              path="ad-graphics"
              element={withSuspense(<AdGraphicsRoute />, "Loading Ad Graphics...")}
            />
          </Route>
          <Route path="*" element={withSuspense(<NotFoundRoute />, "Loading page...")} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
