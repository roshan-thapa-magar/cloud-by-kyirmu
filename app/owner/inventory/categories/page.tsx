"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";

import DataTable, { ColumnDefinition } from "@/components/data-table";
import FormBuilder, { FormField } from "@/components/form-builder";
import { DeleteDialog } from "@/components/delete-dialog";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Edit, MoreHorizontal, Trash } from "lucide-react";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  Category,
  PaginatedResponse,
} from "@/services/category.api";
import { getPusherClient } from "@/lib/pusher-client";

/* ================= FORM ================= */

const categoryFields: FormField[] = [
  {
    name: "categoryName",
    label: "Category Name",
    placeholder: "Enter category name",
    type: "text",
  },
  {
    name: "image",
    label: "Category Image",
    placeholder: "Select Image",
    type: "file",
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add ref to track pending operations
  const pendingOperations = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  /* ================= FETCH WITH PAGINATION ================= */

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCategories(currentPage, rowsPerPage);
      setCategories(response.categories);
      setTotalCount(response.total);
      
      // If current page becomes empty and not first page, go to previous page
      if (response.categories.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      toast.error("Failed to load categories");
      console.error(error);
    } finally {
      setLoading(false);
      isFirstLoad.current = false;
    }
  }, [currentPage, rowsPerPage]);

  // Refetch when page, limit, or search changes
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Pusher connection for real-time updates
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe('categories');

    // Handle category creation
    const handleCategoryCreated = (newCategory: Category) => {
      
      // Check if this category was already added optimistically
      setCategories(prev => {
        // Prevent duplicate by checking if category already exists
        const exists = prev.some(cat => cat._id === newCategory._id);
        if (exists) return prev;
        
        // Only add to current page if on first page and there's space
        if (currentPage === 1 && prev.length < rowsPerPage) {
          return [newCategory, ...prev];
        }
        return prev;
      });
      
      // Only update total count if it wasn't already updated
      setTotalCount(prev => {
        // Check if this category was already counted
        const wasAdded = pendingOperations.current.has(newCategory._id);
        if (wasAdded) {
          pendingOperations.current.delete(newCategory._id);
          return prev;
        }
        return prev + 1;
      });
      
      toast.success(`New category "${newCategory.categoryName}" added`);
    };

    // Handle category update
    const handleCategoryUpdated = (updatedCategory: Category) => {
      setCategories(prev =>
        prev.map(c => (c._id === updatedCategory._id ? updatedCategory : c))
      );
      toast.info(`Category "${updatedCategory.categoryName}" updated`);
    };

    // Handle category image update
    const handleCategoryImageUpdated = (updatedCategory: Category) => {
      setCategories(prev =>
        prev.map(c => (c._id === updatedCategory._id ? updatedCategory : c))
      );
    };

    // Handle category deletion
    const handleCategoryDeleted = (data: { _id: string }) => {
      const deletedCategory = categories.find(c => c._id === data._id);
      setCategories(prev => prev.filter(c => c._id !== data._id));
      setTotalCount(prev => prev - 1);
      
      if (deletedCategory) {
        toast.info(`Category "${deletedCategory.categoryName}" deleted`);
      }
    };

    // Handle bulk category updates (if needed)
    const handleCategoriesBulkUpdate = (updatedCategories: Category[]) => {
      setCategories(updatedCategories);
      toast.info('Categories have been updated');
    };

    // Bind all Pusher events
    channel.bind('category-created', handleCategoryCreated);
    channel.bind('category-updated', handleCategoryUpdated);
    channel.bind('category-image-updated', handleCategoryImageUpdated);
    channel.bind('category-deleted', handleCategoryDeleted);
    channel.bind('categories-bulk-update', handleCategoriesBulkUpdate);

    // Cleanup
    return () => {
      channel.unbind('category-created', handleCategoryCreated);
      channel.unbind('category-updated', handleCategoryUpdated);
      channel.unbind('category-image-updated', handleCategoryImageUpdated);
      channel.unbind('category-deleted', handleCategoryDeleted);
      channel.unbind('categories-bulk-update', handleCategoriesBulkUpdate);
      pusher.unsubscribe('categories');
    };
  }, [currentPage, rowsPerPage, categories]);

  /* ================= CREATE ================= */

  const handleCreateCategory = async (values: any) => {
    try {
      const newCategory = await createCategory(values);
      
      // Add to pending operations to track
      pendingOperations.current.add(newCategory._id);
      
      // Update state with the new category
      setCategories((prev) => {
        // Check if category already exists (to prevent duplicates)
        const exists = prev.some(cat => cat._id === newCategory._id);
        if (exists) return prev;
        
        // Only add if on first page and there's space
        if (currentPage === 1 && prev.length < rowsPerPage) {
          return [newCategory, ...prev];
        }
        return prev;
      });
      
      // Update total count
      setTotalCount((prev) => prev + 1);
      
      toast.success("Category created successfully");
      setFormOpen(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || "Failed to create category";
      toast.error(msg);
    }
  };

  /* ================= UPDATE ================= */

  const handleUpdateCategory = async (values: any) => {
    if (!editingCategory) return;

    try {
      const updated = await updateCategory(
        editingCategory._id,
        values
      );

      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === editingCategory._id ? updated : cat
        )
      );

      toast.success("Category updated successfully");
      setEditingCategory(null);
      setFormOpen(false);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || error?.message || "Failed to update category";
      toast.error(msg);
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);

    try {
      await deleteCategory(selectedCategory._id);

      setCategories((prev) =>
        prev.filter((cat) => cat._id !== selectedCategory._id)
      );
      setTotalCount((prev) => prev - 1);

      toast.success("Category deleted successfully");
      setDeleteOpen(false);
      setSelectedCategory(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns: ColumnDefinition<Category>[] = useMemo(
    () => [
      { id: "categoryName", name: "Category Name" },
      {
        id: "image",
        name: "Image",
        render: (category) => (
          <Image
            src={
              category.image ||
              "/images/image.png"
            }
            alt={category.categoryName}
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
        render: (category) => (
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
                  setEditingCategory(category);
                  setFormOpen(true);
                }}
              >
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-red-500"
                onClick={() => {
                  setSelectedCategory(category);
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
    categoryName: true,
    image: true,
    action: true,
  };

  return (
    <>
      <DataTable
        data={categories}
        columns={columns}
        initialColumnVisibility={initialColumnVisibility}
        searchPlaceholder="Search category..."
        addLabel="Add Category"
        searchKey="categoryName"
        loading={loading}
        onAddClick={() => {
          setEditingCategory(null);
          setFormOpen(true);
        }}
        // Pass pagination props to DataTable
        pagination={{
          currentPage,
          rowsPerPage,
          totalCount,
          onPageChange: setCurrentPage,
          onRowsPerPageChange: (newLimit) => {
            setRowsPerPage(newLimit);
            setCurrentPage(1); // Reset to first page when changing rows per page
          },
        }}
      />

      {/* FORM */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          <FormBuilder
            title="" 
            fields={categoryFields}
            defaultValues={editingCategory || {}}
            onSubmit={
              editingCategory
                ? handleUpdateCategory
                : handleCreateCategory
            }
          />
        </DialogContent>
      </Dialog>

      {/* DELETE */}
      <DeleteDialog
        isOpen={deleteOpen}
        isLoading={isDeleting}
        title="Delete Category?"
        description={`"${selectedCategory?.categoryName}" will be permanently deleted.`}
        confirmText="Delete Category"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}