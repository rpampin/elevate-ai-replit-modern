import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDateForDisplay } from '@/lib/utils';
import { getClientNameFromId } from '@/lib/client-utils';
import { apiRequest } from '@/lib/queryClient';
import AssignmentModal from '@/components/modals/assignment-modal';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import type { MemberWithSkills } from '@shared/schema';

interface AssignmentsTabProps {
  member: MemberWithSkills;
  clients: any[];
}

export default function AssignmentsTab({ member, clients }: AssignmentsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsPageSize, setAssignmentsPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);

  const deleteMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return apiRequest('DELETE', `/api/members/${member.id}/assignments/${assignmentId}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Assignment deleted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setIsConfirmOpen(false);
      setAssignmentToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete assignment',
        variant: 'destructive'
      });
    }
  });

  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setIsModalOpen(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleDeleteAssignment = (assignment: any) => {
    setAssignmentToDelete(assignment);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (assignmentToDelete) {
      deleteMutation.mutate(assignmentToDelete.id);
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
        <h3 className="text-lg font-medium">Assignments ({member?.profile?.assignments?.length || 0})</h3>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={handleAddAssignment}
        >
          <Plus className="w-4 h-4" />
          Add Assignment
        </Button>
      </div>
      <div className="grid gap-4">
        {member?.profile?.assignments && member.profile.assignments.length > 0 ? (
          <>
            {paginate(member.profile.assignments, assignmentsPage, assignmentsPageSize).map((assignment: any, index: number) => (
              <Card key={index} className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100">
                      {assignment.title || assignment.project}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Client: {getClientNameFromId(assignment.clientId, clients)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDateForDisplay(assignment.startDate)} - {assignment.endDate ? formatDateForDisplay(assignment.endDate) : 'Present'}
                    </p>
                    <Badge variant={assignment.status === 'Active' ? 'default' : 'secondary'} className="mt-2">
                      {assignment.status}
                    </Badge>
                    {assignment.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {assignment.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteAssignment(assignment)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <PaginationControls
              currentPage={assignmentsPage}
              totalItems={member.profile.assignments.length}
              pageSize={assignmentsPageSize}
              onPageChange={setAssignmentsPage}
              onPageSizeChange={(size) => {
                setAssignmentsPageSize(size);
                setAssignmentsPage(1);
              }}
              label="assignments"
            />
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No assignments recorded yet
          </p>
        )}
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        memberId={member.id}
        assignment={selectedAssignment}
        clients={clients}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Assignment"
        description={`Are you sure you want to delete the assignment "${assignmentToDelete?.title || assignmentToDelete?.project}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}