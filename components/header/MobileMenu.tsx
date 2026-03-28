"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu as MenuIcon, Tag, User, Power } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useAuthModal } from "@/context/auth-modal-context"
import { MapButton } from "./MapButton"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ThemeToggle } from "../theme-toggle"

const MobileMenu = () => {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const { data: session, status } = useSession()
  const { closeModal, openModal } = useAuthModal()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    setOpen(false)
    signOut({ callbackUrl: "/" })
  }

  const handleLogIn = () => {
    setOpen(false)
    openModal()
  }

  if (!mounted) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger */}
      <SheetTrigger asChild>
        <button aria-label="Open menu">
          <MenuIcon />
        </button>
      </SheetTrigger>

      {/* Sheet */}
      <SheetContent side="left" className="w-80 flex flex-col">
        {/* Header */}
        <SheetHeader>
          <SheetTitle className="text-3xl font-extrabold">
            KYIRMU
          </SheetTitle>
        </SheetHeader>

        {/* Menu Items */}
        <div className="space-y-6 px-4 mt-6">
          {/* My Account */}
          {status === "authenticated" ? (
            <Link
              href="/myAccount"
              onClick={() => setOpen(false)}
              className="flex items-center gap-4 font-medium"
            >
              <User className="h-5 w-5" />
              My Account
            </Link>
          ) : (
            <button
              onClick={handleLogIn}
              className="flex items-center gap-4 font-medium"
            >
              <User className="h-5 w-5" />
              My Account
            </button>
          )}

          <MapButton />

          {/* Theme */}
          <div className="flex items-center justify-between w-full font-medium">
            <div className="flex items-center gap-4">
              <Tag className="h-5 w-5" />
              <p>Theme</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Logout */}
        <div className="mt-auto pb-6 px-4">
          <button
            onClick={status === "authenticated" ? handleLogout : handleLogIn}
            className="flex items-center gap-4 text-muted-foreground hover:text-red-600 transition"
          >
            <Power className="h-5 w-5" />
            {status === "authenticated" ? "Log Out" : "Log In"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default MobileMenu