"use client";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import type { ReactNode } from "react";
import ProtectedRoute from "@/components/protectedRoute/WonerProtectedRoute";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["owner"]}>
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <SidebarInset className="flex flex-col flex-1 overflow-hidden">
              <AppHeader />
              <main className="flex-1 overflow-auto hide-scrollbar">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        </ProtectedRoute>
  );
}