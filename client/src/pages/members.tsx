import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import Header from "@/components/layout/header";
import DataTable from "@/components/ui/data-table";
import AddMemberModal from "@/components/modals/add-member-modal";
import ViewMemberModal from "@/components/modals/view-member-modal";
import EditMemberModal from "@/components/modals/edit-member-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Eye, Edit2, Trash2 } from "lucide-react";
import { getCategoryColor, getInitials } from "@/lib/constants";
import { useAutoToast } from "@/hooks/use-auto-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MemberWithSkills } from "@shared/schema";

export default function Members() {
  const { t } = useLanguage();
  const { showToast } = useAutoToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberWithSkills | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<MemberWithSkills | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members", { name: searchTerm }],
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: number) => {
      return apiRequest("DELETE", `/api/members/${memberId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      setShowDeleteDialog(false);
      setMemberToDelete(null);
      showToast({
        title: "Success",
        description: "Techie deleted successfully",
      });
    },
    onError: () => {
      showToast({
        title: "Error",
        description: "Failed to delete techie",
        variant: "destructive",
      });
    },
  });

  const handleViewMember = (member: MemberWithSkills) => {
    setSelectedMember(member);
    setShowViewModal(true);
  };

  const handleEditMember = (member: MemberWithSkills) => {
    setSelectedMember(member);
    setShowEditModal(true);
  };

  const handleDeleteMember = (member: MemberWithSkills) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (memberToDelete) {
      deleteMemberMutation.mutate(memberToDelete.id);
    }
  };

  const columns = [
    {
      key: "fullName",
      title: t("techie"),
      render: (value: string, member: MemberWithSkills) => (
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-primary font-medium text-sm">
              {getInitials(member.fullName)}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {member.fullName}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {member.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: t("category"),
      render: (value: string) => (
        <Badge className={getCategoryColor(value)}>
          {value}
        </Badge>
      ),
    },
    {
      key: "currentClient",
      title: t("client"),
      render: (value: string) => (
        <span className={value === "Talent Pool" ? "text-yellow-600" : "text-gray-900 dark:text-white"}>
          {value || "Talent Pool"}
        </span>
      ),
    },
    {
      key: "location",
      title: t("location"),
      render: (value: string) => (
        <span className="text-gray-600 dark:text-gray-400">
          {value || "-"}
        </span>
      ),
    },
    {
      key: "skills",
      title: t("topSkills"),
      render: (skills: any[], member: MemberWithSkills) => (
        <div className="flex flex-wrap gap-1">
          {member.skills.slice(0, 3).map((skill) => (
            <Badge key={skill.id} variant="secondary" className="text-xs">
              {skill.skill.name}
            </Badge>
          ))}
          {member.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{member.skills.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "learningGoals",
      title: t("goals"),
      render: (goals: any[], member: MemberWithSkills) => (
        <div className="flex items-center">
          <Target className="w-4 h-4 text-orange-500 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {member.learningGoals?.length || 0} {t("active")}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      title: t("actions"),
      render: (_: any, member: MemberWithSkills) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewMember(member)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditMember(member)}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteMember(member)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Header
        title={t("members")}
        subtitle="Gestiona el talento de tu equipo"
        onAddClick={() => setShowAddModal(true)}
        onImportClick={() => console.log("Import Excel")}
      />

      <main className="p-6">
        <DataTable
          data={members || []}
          columns={columns}
          searchPlaceholder="Buscar miembros..."
          onSearch={setSearchTerm}
          isLoading={isLoading}
        />
      </main>

      <AddMemberModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />

      <ViewMemberModal
        open={showViewModal}
        onOpenChange={setShowViewModal}
        member={selectedMember}
      />

      <EditMemberModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        member={selectedMember}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Techie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {memberToDelete?.fullName}? This action cannot be undone and will remove all associated skills, learning goals, and profile data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMemberMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMemberMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
