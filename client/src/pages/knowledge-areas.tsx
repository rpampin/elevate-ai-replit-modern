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
import { Edit2, Trash2 } from "lucide-react";

import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";

import type { KnowledgeArea } from "@shared/schema";

const knowledgeAreaFormSchema = z.object({
  name: z.string().min(1, "Knowledge area name is required"),
  description: z.string().optional(),
});

type KnowledgeAreaFormData = z.infer<typeof knowledgeAreaFormSchema>;

export default function KnowledgeAreas() {
  const { t } = useLanguage();
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [areaToEdit, setAreaToEdit] = useState<KnowledgeArea | null>(null);
  const [areaToDelete, setAreaToDelete] = useState<KnowledgeArea | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const form = useForm<KnowledgeAreaFormData>({
    resolver: zodResolver(knowledgeAreaFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Query
  const { data: knowledgeAreas = [], isLoading } = useQuery<KnowledgeArea[]>({
    queryKey: ["/api/knowledge-areas"],
  });

  // Filter and paginate knowledge areas
  const filteredAreas = knowledgeAreas.filter((area: KnowledgeArea) =>
    area.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    area.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAreas.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAreas = filteredAreas.slice(startIndex, startIndex + pageSize);

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
  const createKnowledgeAreaMutation = useMutation({
    mutationFn: async (data: KnowledgeAreaFormData) => {
      return apiRequest("POST", "/api/knowledge-areas", data);
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
      return apiRequest("PATCH", `/api/knowledge-areas/${id}`, data);
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
      return apiRequest("DELETE", `/api/knowledge-areas/${id}`);
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

  // Table columns
  const columns = [
    {
      key: "name",
      title: "Knowledge Area",
      render: (value: string) => (
        <span className="font-medium text-gray-900 dark:text-white">{value}</span>
      ),
    },
    {
      key: "description",
      title: "Description",
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, area: KnowledgeArea) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditArea(area)}
            className="text-blue-600 hover:text-blue-700"
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

  const handleEditArea = (area: KnowledgeArea) => {
    setAreaToEdit(area);
    form.reset({
      name: area.name,
      description: area.description || "",
    });
    setShowEditModal(true);
  };

  const onSubmit = (data: KnowledgeAreaFormData) => {
    createKnowledgeAreaMutation.mutate(data);
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
        onAddClick={() => setShowAddModal(true)}
        addButtonText="Agregar Área"
      />

      <main className="p-6">
        <DataTable
          data={paginatedAreas}
          columns={columns}
          searchPlaceholder="Search knowledge areas..."
          onSearch={handleSearchChange}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredAreas.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            const newTotalPages = Math.ceil(filteredAreas.length / newSize);
            setPageSize(newSize);
            // Only reset to page 1 if current page would be out of bounds
            if (currentPage > newTotalPages) {
              setCurrentPage(Math.max(1, newTotalPages));
            }
          }}
          paginationLabel="knowledge areas"
          showPaginationDivider={false}
        />
      </main>

      {/* Add Knowledge Area Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Knowledge Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Knowledge Area Name *</Label>
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
                placeholder="Describe this knowledge area"
              />
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
                disabled={createKnowledgeAreaMutation.isPending}
              >
                {createKnowledgeAreaMutation.isPending ? "Creating..." : "Create Knowledge Area"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Knowledge Area Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Knowledge Area</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Knowledge Area Name *</Label>
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
                placeholder="Describe this knowledge area"
                rows={3}
              />
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
                disabled={updateKnowledgeAreaMutation.isPending}
              >
                {updateKnowledgeAreaMutation.isPending ? "Updating..." : "Update Knowledge Area"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!areaToDelete} onOpenChange={() => setAreaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Knowledge Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{areaToDelete?.name}"? This action cannot be undone.
              Skills associated with this knowledge area will be unlinked.
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