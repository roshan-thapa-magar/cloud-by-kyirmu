"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
import { useUser } from "@/context/UserContext";
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

const Checkout: React.FC<CheckoutProps> = ({
  open,
  onOpenChange,
  onSubmit,
  orderLoading,
}) => {
  const { user } = useUser();

  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [note, setNote] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Focus first input safely
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        phoneRef.current?.focus();
      }, 100);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!phone || !address) {
      toast.error("Phone and address required");
      return;
    }

    const success = await onSubmit(phone, paymentMethod, address, note);

    if (success) {
      onOpenChange(false);
      setPhone("");
      setAddress("");
      setNote("");
      setPaymentMethod("cash");
    }
  };

  // ✅ Memoized map (prevents re-render focus loss)
  const MapComponent = useMemo(
    () => (
      <GoogleMapComponent
        onLocationSelect={(addr) => setAddress(addr)}
        initialAddress={address}
        containerStyle={{
          width: "100%",
          height: "200px",
          borderRadius: 12,
        }}
      />
    ),
    []
  );

  const paymentOptions = [
    { value: "cash", label: "Cash" },
    { value: "card", label: "Card" },
    { value: "online", label: "Online" },
  ];

  const FormContent = (
    <div className="space-y-4">
      {MapComponent}

      {/* Phone */}
      <div>
        <label className="text-sm">Phone Number</label>
        <Input
          ref={phoneRef}
          type="tel"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Note */}
      <div>
        <label className="text-sm">Note (optional)</label>
        <Textarea
          placeholder="Add a note for your order..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="focus:outline-none focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {/* Payment */}
      <div>
        <label className="text-sm mb-2 block">Payment Method</label>
        <RadioGroup
          value={paymentMethod}
          onValueChange={setPaymentMethod}
          className="flex justify-between"
        >
          {paymentOptions.map((option) => (
            <div key={option.value} className="flex items-center gap-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <label htmlFor={option.value} className="text-sm">
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Submit */}
      <Button className="w-full" disabled={orderLoading} onClick={handleSubmit}>
        {orderLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin" />
            Submitting...
          </div>
        ) : (
          "Submit"
        )}
      </Button>
    </div>
  );

  return isMobile ? (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      modal={false} // ✅ FIX
    >
      <DrawerContent
        className="rounded-t-lg p-4 max-h-[90vh] overflow-hidden"
        onOpenAutoFocus={(e) => e.preventDefault()} // ✅ FIX
      >
        <DrawerHeader>
          <DrawerTitle>Enter Checkout Info</DrawerTitle>
        </DrawerHeader>

        {/* ✅ scroll container */}
        <div className="overflow-y-auto max-h-[70vh] pr-1">
          {FormContent}
        </div>
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Enter Checkout Info</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[70vh] pr-1">
          {FormContent}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Checkout;