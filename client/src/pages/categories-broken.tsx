import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Tags, Edit2, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SkillCategory } from "@shared/schema";

const skillCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  criteria: z.string().optional(),
  scaleId: z.number().min(1, "Scale is required"),
});

type SkillCategoryFormData = z.infer<typeof skillCategorySchema>;

export default function Categories() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<SkillCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<SkillCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();

  const form = useForm<SkillCategoryFormData>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: {
      name: "",
      criteria: "",
    },
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ["/api/skill-categories"],
  });

  const { data: scales } = useQuery({
    queryKey: ["/api/scales"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: SkillCategoryFormData) => {
      console.log("Sending to API:", data);
      const response = await apiRequest("POST", "/api/skill-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-categories"] });
      showToast({
        title: "Success",
        description: "Skill category created successfully",
      });
      setShowAddModal(false);
      form.reset({
        name: "",
        criteria: "",
      });
    },
    onError: (error) => {
      console.error("Create category error:", error);
      showToast({
        title: "Error",
        description: "Failed to create skill category",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SkillCategoryFormData }) => {
      return await apiRequest("PUT", `/api/skill-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-categories"] });
      setShowEditModal(false);
      setCategoryToEdit(null);
      form.reset();
      showToast({
        title: "Success",
        description: "Skill category updated successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to update skill category",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/skill-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skill-categories"] });
      setCategoryToDelete(null);
      showToast({
        title: "Success",
        description: "Skill category deleted successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to delete skill category",
        variant: "destructive",
      });
    },
  });

  // Filter and paginate categories
  const allCategories = Array.isArray(categories) ? categories as SkillCategory[] : [];
  const filteredCategories = allCategories.filter((category: SkillCategory) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + pageSize);

  // Reset page when search changes
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize));
    setCurrentPage(1);
  };

  const columns = [
    {
      key: "name",
      title: "Category Name",
      render: (value: string, category: SkillCategory) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white flex items-center">
            <Tags className="w-4 h-4 mr-2 text-primary" />
            {value}
          </div>
          {category.criteria && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {category.criteria}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "scale",
      title: "Scale",
      render: (_: any, category: any) => {
        const scale = scales?.find((s: any) => s.id === category.scaleId);
        return scale ? (
          <Badge variant="secondary" className="text-xs">
            {scale.name}
          </Badge>
        ) : (
          <span className="text-gray-400 text-sm">No scale</span>
        );
      },
    },
    {
      key: "actions",
      title: t("actions"),
      render: (_: any, category: SkillCategory) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditCategory(category)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setCategoryToDelete(category)}
            className="text-red-600 hover:text-red-700"
            disabled={deleteCategoryMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const onSubmit = (data: SkillCategoryFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    createCategoryMutation.mutate(data);
  };

  const handleEditCategory = (category: SkillCategory) => {
    setCategoryToEdit(category);
    form.reset({
      name: category.name,
      criteria: category.criteria || "",
      scaleId: (category as any).scaleId || undefined,
    });
    setShowEditModal(true);
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
        showActions={false}
      />

      <main className="p-6">
        <DataTable
          data={skillCategories}
          columns={columns}
          searchPlaceholder="Search categories..."
          isLoading={isLoading}
        />
      </main>

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
                  <Label htmlFor="criteria">Criteria</Label>
                  <Textarea
                    id="criteria"
                    {...form.register("criteria")}
                    placeholder="What are the characteristics that group skills in this category?"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="scaleId">Scale *</Label>
                  <Controller
                    name="scaleId"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a scale for this category" />
                        </SelectTrigger>
                        <SelectContent>
                          {scales?.map((scale: any) => (
                            <SelectItem key={scale.id} value={scale.id.toString()}>
                              {scale.name} ({scale.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.scaleId && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.scaleId.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createCategoryMutation.isPending}>
                    {createCategoryMutation.isPending ? "Saving..." : t("save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={paginatedCategories}
          columns={columns}
          searchPlaceholder="Search categories..."
          onSearch={handleSearchChange}
          isLoading={isLoading}
        />
        
        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Items per page</p>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {currentPage} of {totalPages}
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredCategories.length)} of {filteredCategories.length} categories
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
          </main>
        </div>
      </div>

      {/* Edit Modal */}
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
              <Label htmlFor="edit-criteria">Criteria</Label>
              <Textarea
                id="edit-criteria"
                {...form.register("criteria")}
                placeholder="What are the characteristics that group skills in this category?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-scale">Scale *</Label>
              <Controller
                name="scaleId"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString() || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a scale" />
                    </SelectTrigger>
                    <SelectContent>
                      {scales?.map((scale: any) => (
                        <SelectItem key={scale.id} value={scale.id.toString()}>
                          {scale.name} ({scale.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.scaleId && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.scaleId.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={updateCategoryMutation.isPending}>
                {updateCategoryMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!categoryToDelete} onOpenChange={() => setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
              Skills assigned to this category will remain but lose their category assignment.
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
