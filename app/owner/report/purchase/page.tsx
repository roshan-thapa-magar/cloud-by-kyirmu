"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import DataTable, { type ColumnDefinition } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AddEditPurchaseDialog } from "@/components/AddEditPurchaseDialog";
import { DeleteDialog } from "@/components/delete-dialog";
import moment from "moment";
import { toast } from "sonner";
import { getPusherClient } from "@/lib/pusher-client";

import {
  fetchPurchases,
  addPurchase,
  updatePurchase,
  deletePurchase,
  Purchase,
} from "@/services/purchase";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Load purchases
  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchPurchases({
        page: currentPage,
        limit: rowsPerPage,
        search: searchTerm,
      });
      setPurchases(response.purchases);
      setTotalCount(response.pagination.totalPurchases);

      // Go to previous page if current becomes empty
      if (response.purchases.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Failed to load purchases", error);
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  }, [currentPage, rowsPerPage, searchTerm]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  // Pusher real-time updates (single subscription)
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe("purchases");

    const handlePurchaseCreated = (data: Purchase) => {
      setPurchases(prev => {
        if (currentPage === 1 && prev.length < rowsPerPage) {
          return [data, ...prev];
        }
        return prev;
      });
      setTotalCount(prev => prev + 1);
      toast.success(`New purchase added: ${data.item}`);
    };

    const handlePurchaseUpdated = (data: Purchase) => {
      setPurchases(prev => prev.map(p => (p._id === data._id ? data : p)));
      toast.info(`Purchase updated: ${data.item}`);
    };

    const handlePurchaseDeleted = ({ _id }: { _id: string }) => {
      setPurchases(prev => prev.filter(p => p._id !== _id));
      setTotalCount(prev => prev - 1);
      toast.info(`Purchase deleted`);
    };

    const handlePurchaseImageUpdated = (data: Purchase) => {
      setPurchases(prev => prev.map(p => (p._id === data._id ? data : p)));
      toast.success(`Bill image uploaded for: ${data.item}`);
    };

    channel.bind("purchase-created", handlePurchaseCreated);
    channel.bind("purchase-updated", handlePurchaseUpdated);
    channel.bind("purchase-deleted", handlePurchaseDeleted);
    channel.bind("purchase-image-updated", handlePurchaseImageUpdated);

    return () => {
      channel.unbind("purchase-created", handlePurchaseCreated);
      channel.unbind("purchase-updated", handlePurchaseUpdated);
      channel.unbind("purchase-deleted", handlePurchaseDeleted);
      channel.unbind("purchase-image-updated", handlePurchaseImageUpdated);
      pusher.unsubscribe("purchases");
    };
  }, [currentPage, rowsPerPage]);

  // Add/Edit purchase
  const handleAddEdit = async (formData: FormData, isEdit?: boolean) => {
    setLoading(true);
    try {
      if (isEdit && selectedPurchase?._id) {
        await updatePurchase(selectedPurchase._id, formData);
      } else {
        await addPurchase(formData);
      }
      await loadPurchases();
      setIsDialogOpen(false);
      setSelectedPurchase(null);
    } catch (error) {
      console.error("Error saving purchase", error);
      toast.error("Failed to save purchase");
    } finally {
      setLoading(false);
    }
  };

  // Delete purchase
  const handleDelete = async () => {
    if (!selectedPurchase?._id) return;
    setLoading(true);
    try {
      await deletePurchase(selectedPurchase._id);
      await loadPurchases();
      setIsDeleteOpen(false);
      setSelectedPurchase(null);
    } catch (error) {
      console.error("Error deleting purchase", error);
      toast.error("Failed to delete purchase");
    } finally {
      setLoading(false);
    }
  };

  // Table columns
  const columns: ColumnDefinition<Purchase>[] = useMemo(
    () => [
      { id: "date", name: "Date", render: p => moment(p.date).format("YYYY-MM-DD") },
      { id: "supplier", name: "Supplier" },
      { id: "item", name: "Item" },
      { id: "category", name: "Category" },
      { id: "quantity", name: "Quantity" },
      { id: "unitPrice", name: "Unit Price", render: p => `Rs. ${p.unitPrice.toFixed(2)}` },
      { id: "totalPrice", name: "Total Price", render: p => `Rs. ${p.totalPrice.toFixed(2)}` },
      { id: "paymentMethod", name: "Payment Method" },
      {
        id: "billImage",
        name: "Bill Image",
        render: p => (
          <div className="relative w-8 h-8">
            <Image
              src={p.billImage || "/images/image.png"}
              alt={p.item}
              fill
              className="rounded-full object-cover"
            />
          </div>
        ),
      },
      {
        id: "action",
        name: "Action",
        align: "center",
        render: p => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={() => {
                  setSelectedPurchase(p);
                  setIsDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center gap-2 text-red-500 focus:text-red-500"
                onClick={() => {
                  setSelectedPurchase(p);
                  setIsDeleteOpen(true);
                }}
              >
                <Trash className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const initialColumnVisibility = {
    date: true,
    supplier: true,
    item: true,
    category: true,
    quantity: true,
    unitPrice: true,
    totalPrice: true,
    paymentMethod: true,
    billImage: true,
    action: true,
  };

  return (
    <>
      <DataTable
        data={purchases}
        columns={columns}
        initialColumnVisibility={initialColumnVisibility}
        searchPlaceholder="Search by item, supplier, or category..."
        searchKey="item"
        addLabel="Add Purchase"
        onAddClick={() => {
          setSelectedPurchase(null);
          setIsDialogOpen(true);
        }}
        loading={loading}
        pagination={{
          currentPage,
          rowsPerPage,
          totalCount,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: newLimit => {
            setRowsPerPage(newLimit);
            setCurrentPage(1);
          },
        }}
      />

      <AddEditPurchaseDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedPurchase(null);
        }}
        onSave={handleAddEdit}
        purchase={selectedPurchase || undefined}
        loading={loading}
      />

      <DeleteDialog
        isOpen={isDeleteOpen}
        isLoading={loading}
        title="Delete this purchase?"
        description="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => {
          setIsDeleteOpen(false);
          setSelectedPurchase(null);
        }}
      />
    </>
  );
}