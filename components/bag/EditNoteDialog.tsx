"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface EditNoteDialogProps {
  open: boolean;
  note?: string;
  loading?: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
}

const EditNoteDialog = ({
  open,
  note,
  loading,
  onClose,
  onSave,
}: EditNoteDialogProps) => {
  const [noteValue, setNoteValue] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Detect mobile screens
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set note value when opening
  useEffect(() => {
    if (open) {
      setNoteValue(note || "");

      // ✅ smooth focus (no conflict with Drawer)
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, note]);

  const handleSave = async () => {
    await onSave(noteValue);
  };

  const handleClose = () => {
    setNoteValue("");
    onClose();
  };

  const FormContent = (
    <div className="space-y-4">
      <textarea
        ref={textareaRef}
        value={noteValue}
        onChange={(e) => setNoteValue(e.target.value)}
        placeholder="Add special instructions..."
        className="w-full min-h-[100px] border rounded-md p-2 text-sm resize-y 
                   outline-none focus:outline-none focus:ring-0"
        rows={4}
        style={{ fontSize: "16px" }} // ✅ prevents zoom on iOS
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Save Note"
          )}
        </Button>
      </div>
    </div>
  );

  return isMobile ? (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      modal={false} // ✅ FIX: disable focus lock
    >
      <DrawerContent
        className="rounded-t-lg p-4 overflow-y-auto max-h-[calc(100vh-4rem)]"
        onOpenAutoFocus={(e) => e.preventDefault()} // ✅ FIX: prevent focus conflict
      >
        <DrawerHeader>
          <DrawerTitle>Edit Note</DrawerTitle>
        </DrawerHeader>
        {FormContent}
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditNoteDialog;