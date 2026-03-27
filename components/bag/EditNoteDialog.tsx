"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
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
  DrawerClose,
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

  // Detect mobile screens
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update noteValue when the note prop changes or dialog opens
  useEffect(() => {
    if (open) {
      setNoteValue(note || "");
    }
  }, [note, open]);

  const handleSave = async () => {
    await onSave(noteValue);
  };

  const handleClose = () => {
    setNoteValue(""); // Reset when closing
    onClose();
  };

  const FormContent = (
    <div className="space-y-4">
      <textarea
        value={noteValue}
        onChange={(e) => setNoteValue(e.target.value)}
        placeholder="Add special instructions..."
        className="w-full min-h-[100px] border rounded-md p-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring"
        rows={4}
        autoFocus
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
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Note"}
        </Button>
      </div>
    </div>
  );

  return isMobile ? (
    <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
      <DrawerContent className="rounded-t-lg p-4 overflow-auto max-h-[calc(100vh-4rem)]">
        <DrawerHeader>
          <DrawerTitle>Edit Note</DrawerTitle>
          <DrawerClose />
        </DrawerHeader>
        {FormContent}
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md overflow-auto max-h-[calc(100vh-4rem)]">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditNoteDialog;