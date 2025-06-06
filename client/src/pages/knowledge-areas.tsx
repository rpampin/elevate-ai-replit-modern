import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Edit2, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KnowledgeArea } from "@shared/schema";

const knowledgeAreaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type KnowledgeAreaFormData = z.infer<typeof knowledgeAreaSchema>;

export default function KnowledgeAreas() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [areaToEdit, setAreaToEdit] = useState<KnowledgeArea | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<KnowledgeArea | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();

  const form = useForm<KnowledgeAreaFormData>({
    resolver: zodResolver(knowledgeAreaSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { data: knowledgeAreas, isLoading } = useQuery({
    queryKey: ["/api/knowledge-areas"],
  });

  const createKnowledgeAreaMutation = useMutation({
    mutationFn: async (data: KnowledgeAreaFormData) => {
      const response = await apiRequest("POST", "/api/knowledge-areas", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-areas"] });
      setShowAddModal(false);
      form.reset();
      showToast({
        title: "Success",
        description: "Knowledge area created successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to create knowledge area",
        variant: "destructive",
      });
    },
  });

  const updateKnowledgeAreaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: KnowledgeAreaFormData }) => {
      return await apiRequest("PUT", `/api/knowledge-areas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-areas"] });
      setShowEditModal(false);
      setAreaToEdit(null);
      form.reset();
      showToast({
        title: "Success",
        description: "Knowledge area updated successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to update knowledge area",
        variant: "destructive",
      });
    },
  });

  const deleteKnowledgeAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/knowledge-areas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/knowledge-areas"] });
      setAreaToDelete(null);
      showToast({
        title: "Success",
        description: "Knowledge area deleted successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to delete knowledge area",
        variant: "destructive",
      });
    },
  });

  // Filter and paginate knowledge areas
  const allAreas = Array.isArray(knowledgeAreas) ? knowledgeAreas as KnowledgeArea[] : [];
  const filteredAreas = allAreas.filter((area: KnowledgeArea) =>
    area.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAreas.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAreas = filteredAreas.slice(startIndex, startIndex + pageSize);

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
      title: "Area Name",
      render: (value: string, area: KnowledgeArea) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          {area.description && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {area.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      title: t("actions"),
      render: (_: any, area: KnowledgeArea) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditArea(area)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setAreaToDelete(area)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const onSubmit = (data: KnowledgeAreaFormData) => {
    createKnowledgeAreaMutation.mutate(data);
  };

  const handleEditArea = (area: KnowledgeArea) => {
    setAreaToEdit(area);
    form.reset({
      name: area.name,
      description: area.description || "",
    });
    setShowEditModal(true);
  };

  const onEditSubmit = (data: KnowledgeAreaFormData) => {
    if (areaToEdit) {
      updateKnowledgeAreaMutation.mutate({ id: areaToEdit.id, data });
    }
  };

  return (
    <>
      <Header
        title={t("knowledgeAreas")}
        subtitle="Gestiona las áreas de conocimiento"
        showActions={false}
      />

      <main className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div></div>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  form.reset({ name: "", description: "" });
                  setShowAddModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Knowledge Area
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Knowledge Area</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Area Name *</Label>
                  <Input
                    id="name"
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Describe the types of problems, key skills, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createKnowledgeAreaMutation.isPending}>
                    {createKnowledgeAreaMutation.isPending ? "Saving..." : t("save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={paginatedAreas}
          columns={columns}
          searchPlaceholder="Search knowledge areas..."
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
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAreas.length)} of {filteredAreas.length} knowledge areas
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

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Knowledge Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Area Name *</Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                {...form.register("description")}
                placeholder="Brief description of this knowledge area"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={updateKnowledgeAreaMutation.isPending}>
                {updateKnowledgeAreaMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!areaToDelete} onOpenChange={() => setAreaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{areaToDelete?.name}"? This action cannot be undone.
              Skills assigned to this knowledge area will remain but lose their knowledge area assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (areaToDelete) {
                  deleteKnowledgeAreaMutation.mutate(areaToDelete.id);
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
