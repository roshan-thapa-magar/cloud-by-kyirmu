"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserDetailsDialogProps {
  isOpen: boolean;
  user: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    image?: string;
  } | null;
  onClose: () => void;
}

export function UserDetailsDialog({ isOpen, user, onClose }: UserDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 mt-2">
          {user ? (
            <>
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-xl">{user.name[0]}</span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.phone && <p className="text-sm">📞 {user.phone}</p>}
                {user.address && <p className="text-sm">🏠 {user.address}</p>}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading user details...</p>
          )}

          <Button variant="outline" onClick={onClose} className="mt-2">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}