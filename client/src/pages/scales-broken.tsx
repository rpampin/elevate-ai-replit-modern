import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Ruler, X, Edit2 } from "lucide-react";
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
  const [orderedValues, setOrderedValues] = useState<{value: string, order: number}[]>([]);
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

  const filteredScales = (scales || []).filter((scale: Scale) =>
    scale.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddValue = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && currentValue.trim()) {
      e.preventDefault();
      const currentValues = form.getValues("values");
      if (!currentValues.includes(currentValue.trim())) {
        form.setValue("values", [...currentValues, currentValue.trim()]);
      }
      setCurrentValue("");
    }
  };

  const handleRemoveValue = (valueToRemove: string) => {
    const currentValues = form.getValues("values");
    form.setValue("values", currentValues.filter(v => v !== valueToRemove));
  };

  const getTypeColor = (type: string) => {
    return type === "numeric" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800";
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
        // Handle both old string array format and new ordered format
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
    setOrderedValues([]);
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    form.reset({
      name: "",
      type: "numeric",
      values: [],
    });
    setCurrentValue("");
    setOrderedValues([]);
    setShowAddModal(false);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setScaleToEdit(null);
    setCurrentValue(""); // Clear the input field when closing
  };

  const handleConfirmedDelete = () => {
    if (scaleToDelete) {
      deleteScaleMutation.mutate(scaleToDelete.id);
      setScaleToDelete(null);
    }
  };

  const handleEditScale = (scale: Scale) => {
    setScaleToEdit(scale);
    // Convert ordered values back to simple strings for form
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
                    onValueChange={(value) => form.setValue("type", value as "numeric" | "qualitative")}
                  >
                    <SelectTrigger className={form.formState.errors.type ? "border-red-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="numeric">Numeric (1, 2, 3, 4, 5)</SelectItem>
                      <SelectItem value="qualitative">Qualitative (Beginner, Advanced, etc.)</SelectItem>
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
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Type each value and press Enter to add it. Add values in order from lowest to highest.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {form.watch("values").map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => handleRemoveValue(value)}
                          className="ml-1 text-primary hover:text-primary/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      onKeyDown={handleAddValue}
                      placeholder={
                        form.watch("type") === "numeric" 
                          ? "Enter value (e.g., 1, 2, 3) and press Enter" 
                          : "Enter value (e.g., Beginner, Intermediate) and press Enter"
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentValue.trim()) {
                          const currentValues = form.getValues("values");
                          if (!currentValues.includes(currentValue.trim())) {
                            form.setValue("values", [...currentValues, currentValue.trim()]);
                          }
                          setCurrentValue("");
                        }
                      }}
                      disabled={!currentValue.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.formState.errors.values && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.values.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleCloseAddModal}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createScaleMutation.isPending}>
                    {createScaleMutation.isPending ? "Saving..." : t("save")}
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
                <DialogDescription>
                  Update the scale configuration and values.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Scale Name</Label>
                  <Input
                    id="edit-name"
                    {...form.register("name")}
                    placeholder="e.g., Experience Level"
                  />
                  {form.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-type">Scale Type</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select scale type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qualitative">Qualitative (e.g., Beginner, Advanced)</SelectItem>
                      <SelectItem value="numeric">Numeric (e.g., 1, 2, 3, 4, 5)</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.type.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Scale Values</Label>
                  <div className="space-y-2">
                    {form.watch("values").map((value, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex-1">
                          {value}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveValue(value)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={currentValue}
                      onChange={(e) => setCurrentValue(e.target.value)}
                      onKeyDown={handleAddValue}
                      placeholder={
                        form.watch("type") === "numeric"
                          ? "Enter number (e.g., 1, 2, 3) and press Enter"
                          : "Enter value (e.g., Beginner, Intermediate) and press Enter"
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentValue.trim()) {
                          const currentValues = form.getValues("values");
                          if (!currentValues.includes(currentValue.trim())) {
                            form.setValue("values", [...currentValues, currentValue.trim()]);
                          }
                          setCurrentValue("");
                        }
                      }}
                      disabled={!currentValue.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.formState.errors.values && (
                    <p className="text-red-500 text-sm mt-1">
                      {form.formState.errors.values.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
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

        <DataTable
          data={filteredScales}
          columns={columns}
          searchPlaceholder="Search scales..."
          onSearch={setSearchTerm}
          isLoading={isLoading}
        />
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
