"use client";
import { usePathname } from "next/navigation";
import { Bell, Globe } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle"
import UserAvatar from "./header/UserAvatar";

const routeNames: Record<string, string> = {
  "/owner": "Dashboard",
  "/owner/tables": "Tables",
  "/owner/tables/department": "Department",
  "/owner/cashier": "Cashier",
  "/owner/kitchen": "Kitchen",
  "/owner/manual-order": "Manual Order",
  "/owner/staffs": "Staff Details",
  "/owner/staffs/attendance": "Staff Attendance", // Corrected path here
  "/owner/inventory": "Cuisines",
  "/owner/inventory/categories": "Categories",
  "/owner/inventory/units": "Units",
  "/owner/inventory/stocks": "Stocks",
  "/owner/report/sales": "Sales Report",
  "/owner/report/purchase": "Purchase Report",
  "/owner/settings": "Settings",
};

export function AppHeader() {
  const pathname = usePathname();
  const currentPage = routeNames[pathname] || "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-2">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Restaurant Management</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentPage}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* Right-side icons */}
      <div className="flex items-center gap-2">
        {/* <ThemeToggle /> */}
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        {/* <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
        </Button> */}
        <UserAvatar />
        {/* <ToggleTheme /> */}
      </div>
    </header>
  );
}