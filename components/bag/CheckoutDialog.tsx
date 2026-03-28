"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { useUser } from "@/context/UserContext"
import { Loader2 } from "lucide-react";
import GoogleMapComponent from "@/components/google-map-component";


interface CheckoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Return true if successful, false otherwise
  orderLoading?: boolean;
  onSubmit: (
    phone: string,
    paymentMethod: string,
    address: string,
    note: string
  ) => Promise<boolean>;
}

const Checkout: React.FC<CheckoutProps> = ({ open, onOpenChange, onSubmit, orderLoading }) => {
  const { user } = useUser()
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [note, setNote] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // Refs for inputs to handle scrolling
  const phoneRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Detect mobile screens
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle keyboard visibility for mobile
  useEffect(() => {
    if (!isMobile || !open) return;

    const handleResize = () => {
      // Detect if keyboard is open by checking viewport height
      const isKeyboard = window.innerHeight < window.screen.height * 0.75;
      setIsKeyboardOpen(isKeyboard);
      
      if (isKeyboard && contentRef.current) {
        // Scroll the active input into view
        const activeElement = document.activeElement;
        if (activeElement && contentRef.current.contains(activeElement)) {
          setTimeout(() => {
            activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, open]);

  // Reset form when dialog/drawer closes
  useEffect(() => {
    if (!open) {
      // Don't reset immediately, give time for animation
      const timer = setTimeout(() => {
        if (!open) {
          setPhone(user?.phone || "");
          setAddress(user?.address || "");
          setNote("");
          setPaymentMethod("cash");
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, user?.phone, user?.address]);

  const handleSubmit = async () => {
    if (!phone || !address) return toast.error("Phone and address required");

    const success = await onSubmit(phone, paymentMethod, address, note);

    if (success) {
      onOpenChange(false);
    }
  };

  // Payment options
  const paymentOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "online", label: "Online" },
  ];

  const FormContent = (
    <div 
      ref={contentRef}
      className="space-y-4 mt-2"
      style={{
        paddingBottom: isKeyboardOpen ? "20px" : "0"
      }}
    >
      <GoogleMapComponent
        onLocationSelect={(addr) => setAddress(addr)}
        initialAddress={address}
        containerStyle={{ width: "100%", height: "200px", borderRadius: 12 }}
      />
      
      {/* Phone Number */}
      <div>
        <label className="text-sm font-medium block mb-2">Phone Number</label>
        <Input
          ref={phoneRef}
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-11"
        />
      </div>
      
      {/* Note */}
      <div>
        <label className="text-sm font-medium block mb-2">Note (optional)</label>
        <Textarea
          ref={noteRef}
          placeholder="Add a note for your order..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>
      
      {/* Payment Method */}
      <div>
        <label className="text-sm font-medium block mb-2">Payment Method</label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={setPaymentMethod}
          className="flex justify-between items-center gap-4"
        >
          {paymentOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value} className="text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Submit Button */}
      <Button 
        className="w-full h-11 mt-4" 
        disabled={orderLoading} 
        onClick={handleSubmit}
      >
        {orderLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" /> 
            Submitting...
          </div>
        ) : (
          "Submit Order"
        )}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="rounded-t-lg max-h-[90vh] overflow-hidden">
          <DrawerHeader className="sticky top-0 bg-background z-10 border-b">
            <DrawerTitle>Enter Checkout Info</DrawerTitle>
            <DrawerClose />
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4 pt-0">
            {FormContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Enter Checkout Info</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-1">
          {FormContent}
        </div>
        <DialogClose className="sr-only" />
      </DialogContent>
    </Dialog>
  );
};

export default Checkout;