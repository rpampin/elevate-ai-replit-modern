import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Trash2, Edit2 } from "lucide-react";
import type { SkillWithDetails, KnowledgeArea, SkillCategory } from "@shared/schema";

const skillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  purpose: z.string().optional(),
  categoryId: z.number().optional(),
  knowledgeAreaId: z.number().optional(),
});

type SkillFormData = z.infer<typeof skillSchema>;

export default function Skills() {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [skillToDelete, setSkillToDelete] = useState<SkillWithDetails | null>(null);
  const [editingSkill, setEditingSkill] = useState<SkillWithDetails | null>(null);
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();

  const form = useForm<SkillFormData>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      purpose: "",
    },
  });

  // Fetch data
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ["/api/skills"],
  });

  const { data: knowledgeAreas } = useQuery({
    queryKey: ["/api/knowledge-areas"],
  });

  const { data: skillCategories } = useQuery({
    queryKey: ["/api/skill-categories"],
  });

  const createSkillMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      const response = await apiRequest("POST", "/api/skills", data);
      return response.json();
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
      const response = await apiRequest("PATCH", `/api/skills/${id}`, data);
      return response.json();
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
      await apiRequest("DELETE", `/api/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      setSkillToDelete(null);
      showToast({
        title: "Success",
        description: "Skill deleted successfully",
      });
    },
  });

  const filteredSkills = skills?.filter((skill: SkillWithDetails) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const columns = [
    {
      key: "name",
      title: "Skill Name",
      render: (value: string, skill: SkillWithDetails) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{value}</div>
          {skill.purpose && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {skill.purpose}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      title: "Category",
      render: (category: SkillCategory) => (
        category ? (
          <Badge variant="secondary">{category.name}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: "knowledgeArea",
      title: "Knowledge Area",
      render: (knowledgeArea: KnowledgeArea) => (
        knowledgeArea ? (
          <Badge variant="outline">{knowledgeArea.name}</Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      ),
    },
    {
      key: "actions",
      title: t("actions"),
      render: (_: any, skill: SkillWithDetails) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditSkill(skill)}
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
                  form.reset({ name: "", purpose: "" });
                  setShowAddModal(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </DialogTrigger>
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
                      {skillCategories?.map((category: SkillCategory) => (
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
                      {knowledgeAreas?.map((area: KnowledgeArea) => (
                        <SelectItem key={area.id} value={area.id.toString()}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    {t("cancel")}
                  </Button>
                  <Button type="submit" disabled={createSkillMutation.isPending}>
                    {createSkillMutation.isPending ? "Saving..." : t("save")}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable
          data={filteredSkills}
          columns={columns}
          searchPlaceholder="Search skills..."
          onSearch={setSearchTerm}
          isLoading={skillsLoading}
        />
      </main>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={(open) => {
        setShowEditModal(open);
        if (!open) {
          setEditingSkill(null);
          form.reset();
        }
      }}>
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
                  {skillCategories?.map((category: SkillCategory) => (
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
                  {knowledgeAreas?.map((area: KnowledgeArea) => (
                    <SelectItem key={area.id} value={area.id.toString()}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={updateSkillMutation.isPending}>
                {updateSkillMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
