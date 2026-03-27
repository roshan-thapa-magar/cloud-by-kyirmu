"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Phone, MousePointer2, User } from "lucide-react"
import SearchBar from "./SearchBar"
import UserAvatar from "./UserAvatar"
import Notifications from "./Notifications"
import ShoppingBagIcon from "./Bag"
import MobileMenu from "./MobileMenu"
import { useAuthModal } from "@/context/auth-modal-context"
import { useUser } from "@/context/UserContext"
import { MapButton } from "./MapButton"; // adjust path
import Image from "next/image"

const Header = () => {
  const { openModal } = useAuthModal()
  const { data: session, status } = useSession()
  const { user } = useUser()

  const phoneNumber = user?.phone
  const message = "Hello! I'd like to inquire about your services."

  return (
    <header className="w-full shadow-sm">
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-6 flex items-center justify-between">
        {/* Left: Mobile Menu + Logo */}
        <div className="flex items-center gap-2">
          <div className="md:hidden flex items-center">
            <MobileMenu />
          </div>
          <Link href="/" className="flex items-center cursor-pointer">
            {/* Logo container */}
            <div className="relative w-20 h-20 -ml-6 hidden md:flex">
              <Image
                src="/images/logo2.png"
                alt="KYIRMU logo"
                fill
                sizes="80px"
                className="object-contain"
                priority
              />
            </div>
            <h1
              className="text-2xl md:text-3xl font-extrabold m-0"
            >
              KYIRMU
            </h1>
          </Link>
        </div>

        {/* Center / Right: Search + Icons */}
        <div className="flex items-center gap-4 ">
          <SearchBar />
          {/* Phone / WhatsApp Contact */}
          {phoneNumber && (
            <div className="flex items-center gap-2 hidden md:flex cursor-pointer">
              <Phone className="w-6 h-6 text-foreground flex-shrink-0" />
              <Link
                href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col leading-none"
              >
                <span className="text-xs text-gray-500">CONTACT US</span>
                <span className="font-bold text-sm">{phoneNumber}</span>
              </Link>
            </div>
          )}

          {/* Theme toggle */}
          <div className="hidden md:flex items-center gap-6">
            <MapButton />
          </div>


          {/* Offers Icon */}
          {/* <div className="hidden md:flex items-center gap-6">
            <MousePointer2
              onClick={() => router.push("/allOffers")}
              className="w-5 h-5 cursor-pointer"
            />
          </div> */}

          {/* Notifications and Bag */}
          {status === "authenticated" && session?.user?.role == "user" ? (
            <Notifications userId={user?._id || ""} />
          ) : ""}

          <ShoppingBagIcon />

          {/* User Avatar / Login */}
          <div className="hidden md:flex">
            {status === "authenticated" && session?.user?.role == "user" ? (
              <UserAvatar />
            ) : (
              <div onClick={openModal} className="cursor-pointer">
                <User />
              </div>
            )}
          </div>
        </div>
      </div>
    </header >
  )
}

export default Header