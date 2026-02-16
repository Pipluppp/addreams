import { type ReactNode, lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RouteLoadingFrame } from "./components/molecules/RouteLoadingFrame";
import { RequireAuth } from "./components/molecules/RequireAuth";
import { AppShellLayout } from "./components/layouts/AppShellLayout";

const HomeRoute = lazy(() => import("./routes/home"));
const ProductShootsRoute = lazy(() => import("./routes/studio/product-shoots"));
const AdGraphicsRoute = lazy(() => import("./routes/studio/ad-graphics"));
const LoginRoute = lazy(() => import("./routes/login"));
const ProfileRoute = lazy(() => import("./routes/profile"));
const NotFoundRoute = lazy(() => import("./routes/not-found"));

function withSuspense(node: ReactNode, label: string) {
  return <Suspense fallback={<RouteLoadingFrame label={label} />}>{node}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShellLayout />}>
          <Route index element={withSuspense(<HomeRoute />, "Loading homepage…")} />
          <Route
            path="product-shoots"
            element={withSuspense(<ProductShootsRoute />, "Loading Product Shoots…")}
          />
          <Route
            path="ad-graphics"
            element={withSuspense(<AdGraphicsRoute />, "Loading Ad Graphics…")}
          />
          <Route path="login" element={withSuspense(<LoginRoute />, "Loading…")} />
          <Route
            path="profile"
            element={withSuspense(
              <RequireAuth>
                <ProfileRoute />
              </RequireAuth>,
              "Loading profile…",
            )}
          />
          <Route path="studio" element={<Navigate to="/product-shoots" replace />} />
          <Route path="studio/product-shoots" element={<Navigate to="/product-shoots" replace />} />
          <Route path="studio/ad-graphics" element={<Navigate to="/ad-graphics" replace />} />
          <Route path="*" element={withSuspense(<NotFoundRoute />, "Loading page…")} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
