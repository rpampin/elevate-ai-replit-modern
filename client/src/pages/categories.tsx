import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";

import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";

import type { SkillCategory, Scale } from "@shared/schema";

const skillCategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  criteria: z.string().optional(),
  scaleId: z.number().optional(),
});

type SkillCategoryFormData = z.infer<typeof skillCategoryFormSchema>;

export default function Categories() {
  const { t } = useLanguage();
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<SkillCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<SkillCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const form = useForm<SkillCategoryFormData>({
    resolver: zodResolver(skillCategoryFormSchema),
    defaultValues: {
      name: "",
      criteria: "",
    },
  });

  // Queries
  const { data: skillCategories = [], isLoading } = useQuery<SkillCategory[]>({
    queryKey: ["/api/skill-categories"],
  });

  const { data: scales = [] } = useQuery<Scale[]>({
    queryKey: ["/api/scales"],
  });

  // Filter and paginate categories
  const filteredCategories = skillCategories.filter((category: SkillCategory) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.criteria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + pageSize);

  // Reset page when search changes
  const handleSearchChange = (term: string) => {
    // Only reset page if search term actually changed
    if (term !== searchTerm) {
      setSearchTerm(term);
      setCurrentPage(1);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: SkillCategoryFormData) => {
      return apiRequest("POST", "/api/skill-categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-categories"] });
      setShowAddModal(false);
      form.reset();
      showToast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SkillCategoryFormData }) => {
      return apiRequest("PATCH", `/api/skill-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-categories"] });
      setShowEditModal(false);
      setCategoryToEdit(null);
      form.reset();
      showToast({
        title: "Success",
        description: "Category updated successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/skill-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-categories"] });
      setCategoryToDelete(null);
      showToast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  // Table columns
  const columns = [
    {
      key: "name",
      title: "Category Name",
      render: (value: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      ),
    },
    {
      key: "criteria",
      title: "Criteria",
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "scaleId",
      title: "Scale",
      render: (value: number) => {
        const scale = scales.find(s => s.id === value);
        return scale ? (
          <Badge variant="secondary">{scale.name}</Badge>
        ) : (
          <span className="text-gray-400 text-sm">No scale</span>
        );
      },
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, category: SkillCategory) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditCategory(category)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCategoryToDelete(category)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEditCategory = (category: SkillCategory) => {
    setCategoryToEdit(category);
    form.reset({
      name: category.name,
      criteria: category.criteria || "",
      scaleId: category.scaleId || undefined,
    });
    setShowEditModal(true);
  };

  const onSubmit = (data: SkillCategoryFormData) => {
    createCategoryMutation.mutate(data);
  };

  const onEditSubmit = (data: SkillCategoryFormData) => {
    if (categoryToEdit) {
      updateCategoryMutation.mutate({ id: categoryToEdit.id, data });
    }
  };

  return (
    <>
      <Header
        title={t("categories")}
        subtitle="Gestiona las categorías de habilidades"
        onAddClick={() => setShowAddModal(true)}
        addButtonText="Agregar Categoría"
      />

      <main className="p-6">
        <DataTable
          data={paginatedCategories}
          columns={columns}
          searchPlaceholder="Search categories..."
          onSearch={handleSearchChange}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredCategories.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            const newTotalPages = Math.ceil(filteredCategories.length / newSize);
            setPageSize(newSize);
            // Only reset to page 1 if current page would be out of bounds
            if (currentPage > newTotalPages) {
              setCurrentPage(Math.max(1, newTotalPages));
            }
          }}
          paginationLabel="categories"
          showPaginationDivider={false}
        />
      </main>

      {/* Add Category Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g. Tools, Languages, Processes"
                className={form.formState.errors.name ? "border-red-500" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="criteria">Assessment Criteria</Label>
              <Textarea
                id="criteria"
                {...form.register("criteria")}
                placeholder="How should skills in this category be assessed?"
              />
            </div>

            <div>
              <Label htmlFor="scaleId">Scale</Label>
              <Select
                value={form.watch("scaleId")?.toString()}
                onValueChange={(value) => form.setValue("scaleId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a scale (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {scales.map((scale) => (
                    <SelectItem key={scale.id} value={scale.id.toString()}>
                      {scale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input
                id="edit-name"
                {...form.register("name")}
                className={form.formState.errors.name ? "border-red-500" : ""}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-criteria">Assessment Criteria</Label>
              <Textarea
                id="edit-criteria"
                {...form.register("criteria")}
                placeholder="How should skills in this category be assessed?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-scale">Scale</Label>
              <Select
                value={form.watch("scaleId")?.toString() || ""}
                onValueChange={(value) => form.setValue("scaleId", value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a scale (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {scales.map((scale) => (
                    <SelectItem key={scale.id} value={scale.id.toString()}>
                      {scale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              Skills associated with this category will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (categoryToDelete) {
                  deleteCategoryMutation.mutate(categoryToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}