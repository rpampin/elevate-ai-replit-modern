import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Star } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDisplay } from '@/lib/utils';
import { getClientNameFromId } from '@/lib/client-utils';
import type { MemberWithSkills } from '@shared/schema';
import AppreciationModal from '@/components/modals/appreciation-modal';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AppreciationsTabProps {
  member: MemberWithSkills;
  clients: any[];
}

export default function AppreciationsTab({ member, clients }: AppreciationsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [appreciationsPage, setAppreciationsPage] = useState(1);
  const [appreciationsPageSize, setAppreciationsPageSize] = useState(10);
  const [isAppreciationModalOpen, setIsAppreciationModalOpen] = useState(false);
  const [selectedAppreciation, setSelectedAppreciation] = useState<any>(null);
  const [appreciationToDelete, setAppreciationToDelete] = useState<any>(null);

  // Delete appreciation mutation
  const deleteAppreciationMutation = useMutation({
    mutationFn: async (appreciationId: string) => {
      return apiRequest('DELETE', `/api/members/${member.id}/appreciations/${appreciationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', member.id] });
      toast({
        title: "Appreciation deleted",
        description: "Appreciation has been deleted successfully.",
      });
      setAppreciationToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete appreciation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddAppreciation = () => {
    setSelectedAppreciation(null);
    setIsAppreciationModalOpen(true);
  };

  const handleEditAppreciation = (appreciation: any) => {
    setSelectedAppreciation(appreciation);
    setIsAppreciationModalOpen(true);
  };

  const handleDeleteAppreciation = (appreciation: any) => {
    setAppreciationToDelete(appreciation);
  };

  const confirmDelete = () => {
    if (appreciationToDelete) {
      deleteAppreciationMutation.mutate(appreciationToDelete.id);
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
        <h3 className="text-lg font-medium">Client Appreciations ({member?.profile?.appreciations?.length || 0})</h3>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={handleAddAppreciation}
        >
          <Plus className="w-4 h-4" />
          Add Appreciation
        </Button>
      </div>
      <div className="grid gap-4">
        {member?.profile?.appreciations && member.profile.appreciations.length > 0 ? (
          <>
            {paginate(member.profile.appreciations, appreciationsPage, appreciationsPageSize).map((appreciation: any, index: number) => (
              <Card key={index} className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-green-900 dark:text-green-100">
                          {appreciation.author}
                        </h4>
                        {appreciation.rating && (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < appreciation.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {appreciation.message}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Client: {getClientNameFromId(appreciation.clientId, clients)}</span>
                        <span>{formatDateForDisplay(appreciation.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAppreciation(appreciation)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAppreciation(appreciation)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <PaginationControls
              currentPage={appreciationsPage}
              totalItems={member.profile.appreciations.length}
              pageSize={appreciationsPageSize}
              onPageChange={setAppreciationsPage}
              onPageSizeChange={(size) => {
                setAppreciationsPageSize(size);
                setAppreciationsPage(1);
              }}
              label="appreciations"
            />
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No client appreciations recorded yet
          </p>
        )}
      </div>

      {/* Appreciation Modal */}
      <AppreciationModal
        isOpen={isAppreciationModalOpen}
        onClose={() => setIsAppreciationModalOpen(false)}
        memberId={member.id}
        appreciation={selectedAppreciation}
        clients={clients}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!appreciationToDelete}
        onClose={() => setAppreciationToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Appreciation"
        description={`Are you sure you want to delete this appreciation from "${appreciationToDelete?.author}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}