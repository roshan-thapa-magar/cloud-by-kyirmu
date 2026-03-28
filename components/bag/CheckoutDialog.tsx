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
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle body scroll and viewport issues
  useEffect(() => {
    if (open && isMobile) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.position = '';
        document.body.style.width = '';
      };
    }
  }, [open, isMobile]);

  // Scroll to top when drawer opens
  useEffect(() => {
    if (open && contentRef.current) {
      setTimeout(() => {
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!phone || !address) return toast.error("Phone and address required");

    const success = await onSubmit(phone, paymentMethod, address, note);

    if (success) {
      onOpenChange(false);
      setPhone(""); 
      setAddress(""); 
      setNote(""); 
      setPaymentMethod("cash");
    }
  };

  const paymentOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "online", label: "online" },
  ];

  const FormContent = (
    <div className="space-y-4 mt-2">
      <GoogleMapComponent
        onLocationSelect={(addr) => setAddress(addr)}
        initialAddress={address}
        containerStyle={{ 
          width: "100%", 
          height: isMobile ? "150px" : "200px", 
          borderRadius: 12 
        }}
      />
      
      <div>
        <label className="text-sm">Phone Number</label>
        <Input
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      
      <div>
        <label className="text-sm">Note (optional)</label>
        <Textarea
          placeholder="Add a note for your order..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>
      
      <div>
        <label className="text-sm mb-2 block">Payment Method</label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={setPaymentMethod}
          className="flex justify-between items-center"
        >
          {paymentOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value} className="text-sm">
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Button className="w-full" disabled={orderLoading} onClick={handleSubmit}>
        {orderLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin mr-2" /> Submitting...
          </div>
        ) : "Submit"}
      </Button>
    </div>
  );

  return isMobile ? (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-lg p-4">
        <DrawerHeader>
          <DrawerTitle>Enter Checkout Info</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>
        <div 
          ref={contentRef}
          className="overflow-y-auto"
          style={{
            maxHeight: 'calc(80vh - 80px)',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
          {FormContent}
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Checkout Info</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[60vh]">
          {FormContent}
        </div>
        <DialogClose className="sr-only" />
      </DialogContent>
    </Dialog>
  );
};

export default Checkout;