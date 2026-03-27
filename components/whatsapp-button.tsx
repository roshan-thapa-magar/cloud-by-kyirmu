import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import { useUser } from "@/context/UserContext";

interface WhatsAppButtonProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WhatsAppButton({ className = "", size = "lg" }: WhatsAppButtonProps) {
  const { user } = useUser();

  const phoneNumber = user?.phone;
  const message = "Hello! I'd like to inquire about your services.";

  if (!phoneNumber) return null; // Don't render if no phone

  const sizeClasses = {
    sm: "w-8 h-8 text-xl",
    md: "w-12 h-12 text-2xl",
    lg: "w-14 h-14 text-3xl",
  };

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
      <button
        className={`md:hidden fixed bottom-6 right-6 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-colors duration-200 z-50 ${sizeClasses[size]} ${className}`}
        aria-label="Contact us on WhatsApp"
      >
        <FaWhatsapp  className="w-3/4 h-3/4"/>
      </button>
    </Link>
  );
}