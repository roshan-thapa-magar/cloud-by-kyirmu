'use client'

import { LoginForm } from "./login-form"
import { useAuthModal } from "@/context/auth-modal-context"
import { X } from "lucide-react"

export function AuthModal() {
  const { isOpen, closeModal } = useAuthModal()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
      <div className="relative w-full max-w-md">
        <button
          onClick={closeModal}
          className="absolute right-2 top-2 z-10 rounded-full p-1 hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>

        <LoginForm />
      </div>
    </div>
  )
}
