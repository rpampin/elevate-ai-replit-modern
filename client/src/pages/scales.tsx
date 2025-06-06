import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Ruler, X, Edit2, ChevronUp, ChevronDown, GripVertical, ChevronLeft, ChevronRight } from "lucide-react";
import type { Scale } from "@shared/schema";

const scaleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["numeric", "qualitative"], {
    required_error: "Type is required",
  }),
  values: z.array(z.string()).min(1, "At least one value is required"),
});

type ScaleFormData = z.infer<typeof scaleSchema>;

export default function Scales() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [scaleToDelete, setScaleToDelete] = useState<Scale | null>(null);
  const [scaleToEdit, setScaleToEdit] = useState<Scale | null>(null);
  const [currentValue, setCurrentValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();

  const form = useForm<ScaleFormData>({
    resolver: zodResolver(scaleSchema),
    defaultValues: {
      name: "",
      type: "numeric",
      values: [],
    },
  });

  const { data: scales, isLoading } = useQuery({
    queryKey: ["/api/scales"],
  });

  const createScaleMutation = useMutation({
    mutationFn: async (data: ScaleFormData) => {
      const response = await apiRequest("POST", "/api/scales", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scales"] });
      showToast({
        title: "Success",
        description: "Scale created successfully",
      });
      setShowAddModal(false);
      form.reset();
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to create scale",
        variant: "destructive",
      });
    },
  });

  const deleteScaleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/scales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scales"] });
      showToast({
        title: "Success",
        description: "Scale deleted successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to delete scale",
        variant: "destructive",
      });
    },
  });

  const updateScaleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ScaleFormData }) => {
      return await apiRequest("PUT", `/api/scales/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scales"] });
      setShowEditModal(false);
      setScaleToEdit(null);
      form.reset();
      showToast({
        title: "Success",
        description: "Scale updated successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to update scale",
        variant: "destructive",
      });
    },
  });

  // Filter and paginate scales
  const allScales = Array.isArray(scales) ? scales as Scale[] : [];
  const filteredScales = allScales.filter((scale: Scale) =>
    scale.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredScales.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedScales = filteredScales.slice(startIndex, startIndex + pageSize);

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

  const handleAddValue = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentValue.trim()) {
      e.preventDefault();
      const currentValues = form.getValues("values");
      if (!currentValues.includes(currentValue.trim())) {
        form.setValue("values", [...currentValues, currentValue.trim()]);
        setCurrentValue("");
      }
    }
  };

  const removeValue = (index: number) => {
    const currentValues = form.getValues("values");
    form.setValue("values", currentValues.filter((_, i) => i !== index));
  };

  const moveValueUp = (index: number) => {
    if (index > 0) {
      const currentValues = form.getValues("values");
      const newValues = [...currentValues];
      [newValues[index - 1], newValues[index]] = [newValues[index], newValues[index - 1]];
      form.setValue("values", newValues);
    }
  };

  const moveValueDown = (index: number) => {
    const currentValues = form.getValues("values");
    if (index < currentValues.length - 1) {
      const newValues = [...currentValues];
      [newValues[index], newValues[index + 1]] = [newValues[index + 1], newValues[index]];
      form.setValue("values", newValues);
    }
  };

  const getTypeColor = (type: string) => {
    return type === "numeric" 
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  };

  const columns = [
    {
      key: "name",
      title: "Scale Name",
      render: (value: string, scale: Scale) => (
        <div className="flex items-center">
          <Ruler className="w-4 h-4 mr-2 text-primary" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            <div className="flex items-center mt-1">
              <Badge className={getTypeColor(scale.type)}>
                {scale.type === "numeric" ? "Numérica" : "Cualitativa"}
              </Badge>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "values",
      title: "Values",
      render: (values: string[] | {value: string, order: number}[]) => {
        const displayValues = Array.isArray(values) 
          ? values.map(v => typeof v === 'string' ? v : v.value)
          : [];
        
        return (
          <div className="flex flex-wrap gap-1">
            {displayValues.slice(0, 4).map((value, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {value}
              </Badge>
            ))}
            {displayValues.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{displayValues.length - 4} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      title: t("actions"),
      render: (_: any, scale: Scale) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditScale(scale)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setScaleToDelete(scale)}
            className="text-red-600 hover:text-red-700"
            disabled={deleteScaleMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const onSubmit = (data: ScaleFormData) => {
    createScaleMutation.mutate(data);
  };

  const handleOpenAddModal = () => {
    form.reset({
      name: "",
      type: "numeric",
      values: [],
    });
    setCurrentValue("");
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    form.reset({
      name: "",
      type: "numeric",
      values: [],
    });
    setCurrentValue("");
    setShowAddModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setScaleToEdit(null);
    setCurrentValue("");
  };

  const handleConfirmedDelete = () => {
    if (scaleToDelete) {
      deleteScaleMutation.mutate(scaleToDelete.id);
      setScaleToDelete(null);
    }
  };

  const handleEditScale = (scale: Scale) => {
    setScaleToEdit(scale);
    const simpleValues = Array.isArray(scale.values) 
      ? scale.values.map(v => typeof v === 'string' ? v : v.value)
      : [];
    
    form.reset({
      name: scale.name,
      type: scale.type as "numeric" | "qualitative",
      values: simpleValues,
    });
    setCurrentValue("");
    setShowEditModal(true);
  };

  const onEditSubmit = (data: ScaleFormData) => {
    if (scaleToEdit) {
      updateScaleMutation.mutate({ id: scaleToEdit.id, data });
    }
  };

  return (
    <>
      <Header
        title={t("scales")}
        subtitle="Gestiona las escalas de valoración"
        showActions={false}
      />

      <main className="p-6">
        <div className="mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm mb-4">
            <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">Scale Value Ordering:</div>
            <div className="text-blue-800 dark:text-blue-200">
              For qualitative scales, values are automatically ranked by order of entry: <br/>
              First added = Lowest level (e.g., "Beginner") → Last added = Highest level (e.g., "Expert")
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Las escalas definen cómo medir el nivel de habilidades (1-5, Básico-Avanzado, etc.)
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90"
              onClick={handleOpenAddModal}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Scale
            </Button>
          </div>
        </div>

        <DataTable
          data={paginatedScales}
          columns={columns}
          searchPlaceholder="Search scales..."
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
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredScales.length)} of {filteredScales.length} scales
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

        {/* Add Scale Dialog */}
        <Dialog open={showAddModal} onOpenChange={handleCloseAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Scale</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Scale Name *</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g. Skill Level, Experience Rating"
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="type">Scale Type *</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value: "numeric" | "qualitative") => form.setValue("type", value)}
                >
                  <SelectTrigger className={form.formState.errors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select scale type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">Numeric (1, 2, 3, 4, 5)</SelectItem>
                    <SelectItem value="qualitative">Qualitative (Beginner, Intermediate, Advanced)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="values">Scale Values *</Label>
                <div className="space-y-2">
                  <Input
                    id="values"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onKeyDown={handleAddValue}
                    placeholder="Enter value and press Enter"
                    className={form.formState.errors.values ? "border-red-500" : ""}
                  />
                  
                  {form.watch("type") === "qualitative" && form.watch("values").length > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      Use arrows to reorder: Top = Lowest level, Bottom = Highest level
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {form.watch("values").map((value, index) => (
                      <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm">
                        {form.watch("type") === "qualitative" && (
                          <div className="flex flex-col mr-2">
                            <button
                              type="button"
                              onClick={() => moveValueUp(index)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up (lower level)"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveValueDown(index)}
                              disabled={index === form.watch("values").length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down (higher level)"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="flex-1">{value}</span>
                        {form.watch("type") === "qualitative" && (
                          <span className="text-xs text-gray-500 mr-2">
                            {index === 0 ? "Lowest" : index === form.watch("values").length - 1 ? "Highest" : ""}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeValue(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          title="Remove value"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {form.formState.errors.values && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.values.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseAddModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createScaleMutation.isPending}>
                  {createScaleMutation.isPending ? "Creating..." : "Create Scale"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Scale Dialog */}
        <Dialog open={showEditModal} onOpenChange={handleCloseEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Scale</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Scale Name *</Label>
                <Input
                  id="edit-name"
                  {...form.register("name")}
                  placeholder="e.g. Skill Level, Experience Rating"
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-type">Scale Type *</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value: "numeric" | "qualitative") => form.setValue("type", value)}
                >
                  <SelectTrigger className={form.formState.errors.type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select scale type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="numeric">Numeric (1, 2, 3, 4, 5)</SelectItem>
                    <SelectItem value="qualitative">Qualitative (Beginner, Intermediate, Advanced)</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.type.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-values">Scale Values *</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-values"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    onKeyDown={handleAddValue}
                    placeholder="Enter value and press Enter"
                    className={form.formState.errors.values ? "border-red-500" : ""}
                  />
                  
                  {form.watch("type") === "qualitative" && form.watch("values").length > 0 && (
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      Use arrows to reorder: Top = Lowest level, Bottom = Highest level
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {form.watch("values").map((value, index) => (
                      <div key={index} className="flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm">
                        {form.watch("type") === "qualitative" && (
                          <div className="flex flex-col mr-2">
                            <button
                              type="button"
                              onClick={() => moveValueUp(index)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up (lower level)"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveValueDown(index)}
                              disabled={index === form.watch("values").length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down (higher level)"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <span className="flex-1">{value}</span>
                        {form.watch("type") === "qualitative" && (
                          <span className="text-xs text-gray-500 mr-2">
                            {index === 0 ? "Lowest" : index === form.watch("values").length - 1 ? "Highest" : ""}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeValue(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                          title="Remove value"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {form.formState.errors.values && (
                    <p className="text-red-500 text-sm">
                      {form.formState.errors.values.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseEditModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateScaleMutation.isPending}>
                  {updateScaleMutation.isPending ? "Updating..." : "Update Scale"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!scaleToDelete} onOpenChange={() => setScaleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scale</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the scale "{scaleToDelete?.name}"? 
              This action cannot be undone. Any existing member skills using this scale 
              will lose their scale reference but the skills themselves will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmedDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Scale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}