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

import type { SkillWithDetails, SkillCategory, KnowledgeArea } from "@shared/schema";

const skillFormSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  purpose: z.string().optional(),
  categoryId: z.number().optional(),
  knowledgeAreaId: z.number().optional(),
  strategicPriority: z.boolean().default(false),
});

type SkillFormData = z.infer<typeof skillFormSchema>;

export default function Skills() {
  const { t } = useLanguage();
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillWithDetails | null>(null);
  const [skillToDelete, setSkillToDelete] = useState<SkillWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillFormSchema),
    defaultValues: {
      name: "",
      purpose: "",
      strategicPriority: false,
    },
  });

  // Queries
  const { data: skills = [], isLoading } = useQuery<SkillWithDetails[]>({
    queryKey: ["/api/skills"],
  });

  // Filter and paginate skills
  const filteredSkills = skills.filter((skill: SkillWithDetails) =>
    skill.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    skill.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredSkills.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedSkills = filteredSkills.slice(startIndex, startIndex + pageSize);

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

  const { data: skillCategories = [] } = useQuery<SkillCategory[]>({
    queryKey: ["/api/skill-categories"],
  });

  const { data: knowledgeAreas = [] } = useQuery<KnowledgeArea[]>({
    queryKey: ["/api/knowledge-areas"],
  });

  // Mutations
  const createSkillMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      return apiRequest("POST", "/api/skills", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setShowAddModal(false);
      form.reset();
      showToast({
        title: "Success",
        description: "Skill created successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to create skill",
        variant: "destructive",
      });
    },
  });

  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SkillFormData }) => {
      return apiRequest("PATCH", `/api/skills/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setShowEditModal(false);
      setEditingSkill(null);
      form.reset();
      showToast({
        title: "Success",
        description: "Skill updated successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to update skill",
        variant: "destructive",
      });
    },
  });

  const deleteSkillMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setSkillToDelete(null);
      showToast({
        title: "Success",
        description: "Skill deleted successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to delete skill",
        variant: "destructive",
      });
    },
  });

  // Table columns
  const columns = [
    {
      key: "name",
      title: "Skill Name",
      render: (value: string, skill: SkillWithDetails) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{value}</span>
          {skill.strategicPriority && (
            <Badge variant="default" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Strategic
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "purpose",
      title: "Purpose",
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (category: SkillCategory | undefined) => (
        <Badge variant="secondary">
          {category?.name || "Uncategorized"}
        </Badge>
      ),
    },
    {
      key: "knowledgeArea",
      title: "Knowledge Area",
      render: (knowledgeArea: KnowledgeArea | undefined) => (
        <Badge variant="outline">
          {knowledgeArea?.name || "None"}
        </Badge>
      ),
    },
    {
      key: "actions",
      title: "Actions",
      render: (_: any, skill: SkillWithDetails) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditSkill(skill)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSkillToDelete(skill)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleEditSkill = (skill: SkillWithDetails) => {
    setEditingSkill(skill);
    form.reset({
      name: skill.name,
      purpose: skill.purpose || "",
      categoryId: skill.categoryId || undefined,
      knowledgeAreaId: skill.knowledgeAreaId || undefined,
      strategicPriority: skill.strategicPriority || false,
    });
    setShowEditModal(true);
  };

  const onSubmit = (data: SkillFormData) => {
    createSkillMutation.mutate(data);
  };

  const onEditSubmit = (data: SkillFormData) => {
    if (editingSkill) {
      updateSkillMutation.mutate({ id: editingSkill.id, data });
    }
  };

  return (
    <>
      <Header
        title={t("skills")}
        subtitle="Gestiona las habilidades del equipo"
        onAddClick={() => setShowAddModal(true)}
        addButtonText="Agregar Habilidad"
      />

      <main className="p-6">
        <DataTable
          data={paginatedSkills}
          columns={columns}
          searchPlaceholder="Search skills..."
          onSearch={handleSearchChange}
          isLoading={isLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredSkills.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            const newTotalPages = Math.ceil(filteredSkills.length / newSize);
            setPageSize(newSize);
            // Only reset to page 1 if current page would be out of bounds
            if (currentPage > newTotalPages) {
              setCurrentPage(Math.max(1, newTotalPages));
            }
          }}
          paginationLabel="skills"
          showPaginationDivider={false}
        />
      </main>

      {/* Add Skill Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Skill Name *</Label>
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
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                {...form.register("purpose")}
                placeholder="What is this skill used for?"
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={form.watch("categoryId")?.toString()}
                onValueChange={(value) => form.setValue("categoryId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="knowledgeAreaId">Knowledge Area</Label>
              <Select
                value={form.watch("knowledgeAreaId")?.toString()}
                onValueChange={(value) => form.setValue("knowledgeAreaId", parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select knowledge area" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="strategicPriority"
                {...form.register("strategicPriority")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="strategicPriority" className="text-sm font-medium">
                Strategic Priority
                <span className="text-gray-500 text-xs block">Mark this skill as important for company development</span>
              </Label>
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
                disabled={createSkillMutation.isPending}
              >
                {createSkillMutation.isPending ? "Creating..." : "Create Skill"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Skill Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Skill Name *</Label>
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
              <Label htmlFor="edit-purpose">Purpose</Label>
              <Textarea
                id="edit-purpose"
                {...form.register("purpose")}
                placeholder="Describe the purpose of this skill"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={form.watch("categoryId")?.toString() || ""}
                onValueChange={(value) => form.setValue("categoryId", value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-knowledgeArea">Knowledge Area</Label>
              <Select
                value={form.watch("knowledgeAreaId")?.toString() || ""}
                onValueChange={(value) => form.setValue("knowledgeAreaId", value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a knowledge area" />
                </SelectTrigger>
                <SelectContent>
                  {knowledgeAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-strategicPriority"
                {...form.register("strategicPriority")}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-strategicPriority" className="text-sm font-medium">
                Strategic Priority
                <span className="text-gray-500 text-xs block">Mark this skill as important for company development</span>
              </Label>
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
                disabled={updateSkillMutation.isPending}
              >
                {updateSkillMutation.isPending ? "Updating..." : "Update Skill"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!skillToDelete} onOpenChange={() => setSkillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{skillToDelete?.name}"? This action cannot be undone.
              Member skill assessments using this skill will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (skillToDelete) {
                  deleteSkillMutation.mutate(skillToDelete.id);
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