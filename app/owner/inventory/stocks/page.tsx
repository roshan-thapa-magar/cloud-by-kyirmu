// app/(admin)/items/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import DataTable, { ColumnDefinition } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { DeleteDialog } from "@/components/delete-dialog";
import { ItemForm } from "@/components/Item/itemForm";
import { createItem, deleteItem, getItems, updateItem } from "@/services/items.api";
import { toast } from "sonner";
import { getCategories } from "@/services/category.api";
import { getPusherClient } from "@/lib/pusher-client";

interface ToppingItem {
  title: string;
  price: number;
}

interface Topping {
  toppingTitle: string;
  selectionType: "single" | "multiple";
  required: boolean;
  items: ToppingItem[];
}

interface Item {
  _id: string;
  itemType: "combo" | "single";
  itemName: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  toppings?: Topping[];
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [categories, setCategories] = useState<
    { _id: string; categoryName: string }[]
  >([]);

  // Add ref to track pending operations and pagination state
  const pendingOperations = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const currentPageRef = useRef(currentPage);
  const rowsPerPageRef = useRef(rowsPerPage);

  // Update refs when state changes
  useEffect(() => {
    currentPageRef.current = currentPage;
    rowsPerPageRef.current = rowsPerPage;
  }, [currentPage, rowsPerPage]);

  /* ================= FETCH ITEMS WITH PAGINATION ================= */
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getItems({
        page: currentPage,
        limit: rowsPerPage,
      });
      setItems(response.items);
      setTotalCount(response.pagination.total);

      // If current page becomes empty and not first page, go to previous page
      if (response.items.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error("Failed to load items");
      console.error(error);
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, [currentPage, rowsPerPage]);

  /* ================= FETCH CATEGORIES ================= */
  const fetchCategories = async () => {
    try {
      const data = await getCategories(1, 100);
      const categoriesData = Array.isArray(data) ? data : data.categories || [];
      setCategories(categoriesData);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems]);

  // Pusher connection for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('items');

    // Handle item creation
    const handleItemCreated = (newItem: Item) => {
      // Check if this item was already added optimistically
      setItems(prev => {
        // Prevent duplicate by checking if item already exists
        const exists = prev.some(item => item._id === newItem._id);
        if (exists) return prev;

        // Check if we're on the first page
        if (currentPageRef.current === 1) {
          // If we have space on the current page, add it
          if (prev.length < rowsPerPageRef.current) {
            return [newItem, ...prev];
          }
          // If no space, remove the last item and add the new one at the top
          else {
            return [newItem, ...prev.slice(0, -1)];
          }
        }
        // If not on first page, don't add to current view, but update total count
        return prev;
      });

      // Update total count
      setTotalCount(prev => {
        // Check if this item was already counted from optimistic update
        const wasAdded = pendingOperations.current.has(newItem._id);
        if (wasAdded) {
          pendingOperations.current.delete(newItem._id);
          return prev;
        }
        return prev + 1;
      });

      // toast.success(`New item "${newItem.itemName}" added`);
    };

    // Handle item update
    const handleItemUpdated = (updatedItem: Item) => {
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
      toast.info(`Item "${updatedItem.itemName}" updated`);
    };

    // Handle item image update
    const handleItemImageUpdated = (updatedItem: Item) => {
      setItems(prev =>
        prev.map(item =>
          item._id === updatedItem._id ? updatedItem : item
        )
      );
    };

    // Handle item deletion
    const handleItemDeleted = (data: { _id: string }) => {
      // Find the deleted item before removing it
      let deletedItemName = '';
      setItems(prev => {
        const deleted = prev.find(item => item._id === data._id);
        if (deleted) {
          deletedItemName = deleted.itemName;
        }
        return prev.filter(item => item._id !== data._id);
      });
      setTotalCount(prev => prev - 1);

      if (deletedItemName) {
        toast.info(`Item "${deletedItemName}" deleted`);
      }
    };

    // Handle bulk item updates (if needed)
    const handleItemsBulkUpdate = (updatedItems: Item[]) => {
      setItems(updatedItems);
      toast.info('Items have been updated');
    };

    // Bind all Pusher events
    channel.bind('item-created', handleItemCreated);
    channel.bind('item-updated', handleItemUpdated);
    channel.bind('item-image-updated', handleItemImageUpdated);
    channel.bind('item-deleted', handleItemDeleted);
    channel.bind('items-bulk-update', handleItemsBulkUpdate);

    // Cleanup
    return () => {
      channel.unbind('item-created', handleItemCreated);
      channel.unbind('item-updated', handleItemUpdated);
      channel.unbind('item-image-updated', handleItemImageUpdated);
      channel.unbind('item-deleted', handleItemDeleted);
      channel.unbind('items-bulk-update', handleItemsBulkUpdate);
      pusher.unsubscribe('items');
    };
  }, []); // Empty dependency array - only subscribe once

  /* ================= CREATE / UPDATE ================= */
  const handleSubmitItem = async (values: any) => {
    try {
      if (editingItem) {
        const updatedItem = await updateItem(editingItem._id, values);

        // Update state optimistically
        setItems(prev =>
          prev.map(item =>
            item._id === editingItem._id ? updatedItem : item
          )
        );

        // toast.success("Item updated successfully");
      } else {
        const newItem = await createItem(values);

        // Add to pending operations to track
        pendingOperations.current.add(newItem._id);

        // Update state with the new item
        setItems(prev => {
          // Check if item already exists (to prevent duplicates)
          const exists = prev.some(item => item._id === newItem._id);
          if (exists) return prev;

          // Only add if on first page
          if (currentPage === 1) {
            // If we have space on the current page, add it
            if (prev.length < rowsPerPage) {
              return [newItem, ...prev];
            }
            // If no space, remove the last item and add the new one at the top
            else {
              return [newItem, ...prev.slice(0, -1)];
            }
          }
          return prev;
        });

        // Update total count
        setTotalCount(prev => prev + 1);

        // toast.success("Item created successfully");

        // If not on first page, show a notification that the item was added
        const message =
          currentPage !== 1
            ? `Item "${newItem.itemName}" added and moved to page 1`
            : `Item "${newItem.itemName}" added successfully`;

        if (currentPage !== 1) {
          toast.info(message, {
            action: {
              label: "Go to page 1",
              onClick: () => setCurrentPage(1),
            },
          });
        } else {
          toast.info(message);
        }
      }

      setFormOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Failed to save item";
      toast.error(msg);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async () => {
    if (!selectedItem) return;

    setIsDeleting(true);
    try {
      await deleteItem(selectedItem._id);

      // Update state optimistically
      setItems(prev => prev.filter(item => item._id !== selectedItem._id));
      setTotalCount(prev => prev - 1);

      // toast.success("Item deleted successfully");
      setDeleteOpen(false);
      setSelectedItem(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */
  const columns: ColumnDefinition<Item>[] = useMemo(
    () => [
      { id: "itemName", name: "Item Name" },
      { id: "itemType", name: "Type" },
      { id: "category", name: "Category" },
      { id: "price", name: "Price", render: (item) => `Rs. ${item.price}` },
      { id: "description", name: "Description" },
      {
        id: "toppings",
        name: "Toppings",
        render: (item) => item.toppings?.map((t) => t.toppingTitle).join(", ") || "-",
      },
      {
        id: "image",
        name: "Image",
        render: (item) => (
          <Image
            src={item.image || "/images/image.png"}
            alt={item.itemName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        ),
      },
      {
        id: "action",
        name: "Action",
        align: "center",
        render: (item) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => {
                  setEditingItem(item);
                  setFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-500"
                onClick={() => {
                  setSelectedItem(item);
                  setDeleteOpen(true);
                }}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const initialColumnVisibility = {
    itemName: true,
    itemType: true,
    category: true,
    price: true,
    description: false,
    toppings: true,
    image: true,
    action: true,
  };

  return (
    <>
      <DataTable
        data={items}
        columns={columns}
        initialColumnVisibility={initialColumnVisibility}
        searchPlaceholder="Search item..."
        addLabel="Add Item"
        searchKey="itemName"
        loading={loading}
        onAddClick={() => {
          setEditingItem(null);
          setFormOpen(true);
        }}
        pagination={{
          currentPage,
          rowsPerPage,
          totalCount,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: (newLimit) => {
            setRowsPerPage(newLimit);
            setCurrentPage(1);
          },
        }}
      />

      {formOpen && (
        <ItemForm
          title={editingItem ? "Edit Item" : "Add Item"}
          onSubmit={handleSubmitItem}
          onClose={() => {
            setFormOpen(false);
            setEditingItem(null);
          }}
          defaultValues={editingItem || undefined}
          categories={categories}
        />
      )}

      <DeleteDialog
        isOpen={deleteOpen}
        isLoading={isDeleting}
        title="Delete Item?"
        description={`"${selectedItem?.itemName}" will be permanently deleted.`}
        confirmText="Delete Item"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}