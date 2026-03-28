"use client"
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import { useEffect } from "react"
import { useUser } from "@/context/UserContext"
import { ThemeToggle } from "../theme-toggle"

const UserAvatar = () => {
  const { data: session } = useSession()
  const { user, fetchUser } = useUser()

  const userId = session?.user?._id
  const role = user?.role

  useEffect(() => {
    if (userId) {
      fetchUser(userId)
    }
  }, [userId, fetchUser])

  const profilePath =
    role === "user"
      ? "/myAccount"
      : role === "owner"
        ? "/owner/settings"
        : "/";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="w-6 h-6 cursor-pointer">
          <AvatarImage src={user?.image || "https://github.com/shadcn.png"} />
          <AvatarFallback>
            {user?.name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className={`w-52 ${role === "user" ? "hidden md:block":""}`}>
        {/* Profile */}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={profilePath}>View Profile</Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Theme Section */}
        <div className="flex justify-between items-center px-2 py-2">
          <p className="cursor-pointer">Theme</p>
          <ThemeToggle />
        </div>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          className="text-red-500 focus:text-red-500 cursor-pointer"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserAvatar