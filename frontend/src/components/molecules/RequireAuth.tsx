import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";
import { useSession } from "../../lib/auth-client";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <section className="container-shell flex min-h-[60vh] items-center justify-center py-10">
        <Spinner size="lg" />
      </section>
    );
  }

  if (!session) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}
