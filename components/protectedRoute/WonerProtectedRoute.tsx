"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (!session) {
    redirect("/login");
  }

  const role = session?.user?.role;

  if (!allowedRoles.includes(role)) {
    redirect("/");
  }

  return <>{children}</>;
}