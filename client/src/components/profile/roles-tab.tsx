import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDisplay } from '@/lib/utils';
import { getClientNameFromId } from '@/lib/client-utils';
import { PaginationControls } from '@/components/ui/pagination-controls';
import type { MemberWithSkills } from '@shared/schema';
import RoleModal from '@/components/modals/role-modal';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface RolesTabProps {
  member: MemberWithSkills;
  clients: any[];
}

export default function RolesTab({ member, clients }: RolesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rolesPage, setRolesPage] = useState(1);
  const [rolesPageSize, setRolesPageSize] = useState(10);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [roleToDelete, setRoleToDelete] = useState<any>(null);

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest('DELETE', `/api/members/${member.id}/roles/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', member.id] });
      toast({
        title: "Role deleted",
        description: "Role has been deleted successfully.",
      });
      setRoleToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddRole = () => {
    setSelectedRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (role: any) => {
    setRoleToDelete(role);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  // Pagination helper
  const paginate = (items: any[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };



  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Roles & Responsibilities ({member?.profile?.roles?.length || 0})</h3>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={handleAddRole}
        >
          <Plus className="w-4 h-4" />
          Add Role
        </Button>
      </div>
      <div className="grid gap-4">
        {member?.profile?.roles && member.profile.roles.length > 0 ? (
          <>
            {paginate(member.profile.roles, rolesPage, rolesPageSize).map((role: any, index: number) => (
              <Card key={index} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-green-900 dark:text-green-100">
                        {role.title}
                      </h4>
                      {role.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {role.description}
                        </p>
                      )}
                      {role.skills && role.skills.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Skills:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {role.skills.map((skill: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRole(role)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <PaginationControls
              currentPage={rolesPage}
              totalItems={member.profile.roles.length}
              pageSize={rolesPageSize}
              onPageChange={setRolesPage}
              onPageSizeChange={(size) => {
                setRolesPageSize(size);
                setRolesPage(1);
              }}
              label="roles"
            />
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No roles defined yet
          </p>
        )}
      </div>

      {/* Role Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        memberId={member.id}
        role={selectedRole}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Role"
        description={`Are you sure you want to delete the role "${roleToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteRoleMutation.isPending}
      />
    </div>
  );
}