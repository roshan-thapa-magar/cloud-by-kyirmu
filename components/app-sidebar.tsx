"use client";
import {
  Calendar,
  Home,
  Settings,
  User2,
  ChevronUp,
  ChevronDown,
  CreditCard,
  LogOut,
  Crown,
  Users,
  ChefHat,
  HandHelping,
  Package,
  Tags,
  Ruler,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ReceiptIcon as CashRegister,
  Folder,
  Boxes,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSession, signOut } from "next-auth/react";

const mainItems = [
  { title: "Dashboard", url: "/owner", icon: Home },
  { title: "Cashier", url: "/owner/cashier", icon: CashRegister },
  // { title: "Kitchen", url: "/owner/kitchen", icon: ChefHat },
];

const inventoryItems = [
  // { title: "Cuisines", url: "/owner/inventory", icon: Folder },
  { title: "Categories", url: "/owner/inventory/categories", icon: Tags },
  // { title: "Units", url: "/owner/inventory/units", icon: Ruler },
  { title: "Stock", url: "/owner/inventory/stocks", icon: Boxes },
];

const reportItems = [
  { title: "Sales", url: "/owner/report/sales", icon: TrendingUp },
  { title: "Purchase", url: "/owner/report/purchase", icon: TrendingDown },
];

const tableItems = [
  { title: "Tables", url: "/owner/tables", icon: Calendar },
  { title: "Department", url: "/owner/tables/department", icon: TrendingDown },
];

const staffDetails = [
  { title: "Staff Details", url: "/owner/staffs", icon: Users },
  { title: "Attendance", url: "/owner/staffs/attendance", icon: TrendingUp },
];

// You can change these static filtered items as needed to simulate different user roles
const filteredMainItems = mainItems;
const filteredInventoryItems = inventoryItems;
const filteredReportItems = reportItems;
const filteredTableItems = tableItems;
const filteredStaffDetails = staffDetails;

const fallbackUser = {
  name: "Guest",
  email: "N/A",
  avatar: "https://github.com/evilrabbit.png",
};

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const { data: session, status } = useSession()
  const role = session?.user?.role;
  // Static user for UI demo
  const user = {
    name: fallbackUser.name,
    email: fallbackUser.email,
    avatar: fallbackUser.avatar,
  };

  const handleMenuItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{session?.user?.role}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} onClick={handleMenuItemClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {/* {filteredTableItems.length > 0 && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <BarChart3 />
                        <span>View Tables</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredTableItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link
                                href={item.url}
                                onClick={handleMenuItemClick}
                              >
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )} */}
              {filteredInventoryItems.length > 0 && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <ShoppingCart />
                        <span>Inventory</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredInventoryItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link
                                href={item.url}
                                onClick={handleMenuItemClick}
                              >
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              {/* {filteredStaffDetails.length > 0 && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <Users />
                        <span>Staff Management</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredStaffDetails.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link
                                href={item.url}
                                onClick={handleMenuItemClick}
                              >
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )} */}
              {filteredReportItems.length > 0 && (
                <Collapsible className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="w-full">
                        <BarChart3 />
                        <span>View Reports</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {filteredReportItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === item.url}
                            >
                              <Link
                                href={item.url}
                                onClick={handleMenuItemClick}
                              >
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="flex items-center border gap-3 hover:bg-muted focus:bg-muted data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  aria-label="Open user menu"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user.name.charAt(0) || "G"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 rounded-lg w-(--radix-dropdown-menu-trigger-width)"
                side="bottom"
                align="start"
                sideOffset={4}
              >
                <div className="flex items-center gap-3 p-3 border-b">
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user.name.charAt(0) || "G"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm leading-tight">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground block">
                      {user.email}
                    </span>
                  </div>
                </div>
                <DropdownMenuItem>
                  <User2 className="mr-2 h-4 w-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />{" "}
                  <Link href={"/owner/settings"}>Settings & Privacy</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <div className="flex justify-between items-center">
                    <span>Theme</span>
                    <ThemeToggle />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <Link href={"/login"}>Log out</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
  );
}