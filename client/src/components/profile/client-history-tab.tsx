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
import ClientHistoryModal from '@/components/modals/client-history-modal';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import type { MemberWithSkills } from '@shared/schema';

interface ClientHistoryTabProps {
  member: MemberWithSkills;
  clients: any[];
}

export default function ClientHistoryTab({ member, clients }: ClientHistoryTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [clientHistoryPage, setClientHistoryPage] = useState(1);
  const [clientHistoryPageSize, setClientHistoryPageSize] = useState(10);
  const [isClientHistoryModalOpen, setIsClientHistoryModalOpen] = useState(false);
  const [selectedClientHistory, setSelectedClientHistory] = useState<any>(null);
  const [clientHistoryToDelete, setClientHistoryToDelete] = useState<any>(null);

  // Delete client history mutation
  const deleteClientHistoryMutation = useMutation({
    mutationFn: async (clientHistoryId: string) => {
      return apiRequest('DELETE', `/api/members/${member.id}/client-history/${clientHistoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', member.id] });
      toast({
        title: "Client history deleted",
        description: "Client history has been deleted successfully.",
      });
      setClientHistoryToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete client history. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddClientHistory = () => {
    setSelectedClientHistory(null);
    setIsClientHistoryModalOpen(true);
  };

  const handleEditClientHistory = (clientHistory: any) => {
    setSelectedClientHistory(clientHistory);
    setIsClientHistoryModalOpen(true);
  };

  const handleDeleteClientHistory = (clientHistory: any) => {
    setClientHistoryToDelete(clientHistory);
  };

  const confirmDelete = () => {
    if (clientHistoryToDelete) {
      deleteClientHistoryMutation.mutate(clientHistoryToDelete.id);
    }
  };

  // Pagination helper
  const paginate = (items: any[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Client History ({member?.profile?.clientHistory?.length || 0})</h3>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={handleAddClientHistory}
        >
          <Plus className="w-4 h-4" />
          Add Client Period
        </Button>
      </div>
      <div className="grid gap-4">
        {member?.profile?.clientHistory && member.profile.clientHistory.length > 0 ? (
          <>
            {paginate(member.profile.clientHistory, clientHistoryPage, clientHistoryPageSize).map((clientHistory: any, index: number) => (
              <Card key={index} className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          {getClientNameFromId(clientHistory.clientId, clients)}
                        </h4>
                        <Badge className={getStatusBadgeColor(clientHistory.status)}>
                          {clientHistory.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        Role: {clientHistory.role}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Start: {formatDateForDisplay(clientHistory.startDate)}</span>
                        {clientHistory.endDate && <span>End: {formatDateForDisplay(clientHistory.endDate)}</span>}
                      </div>
                      {clientHistory.projects && clientHistory.projects.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Projects: </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {clientHistory.projects.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClientHistory(clientHistory)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteClientHistory(clientHistory)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <PaginationControls
              currentPage={clientHistoryPage}
              totalItems={member.profile.clientHistory.length}
              pageSize={clientHistoryPageSize}
              onPageChange={setClientHistoryPage}
              onPageSizeChange={(size) => {
                setClientHistoryPageSize(size);
                setClientHistoryPage(1);
              }}
              label="client history entries"
            />
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No client history recorded yet
          </p>
        )}
      </div>

      {/* Client History Modal */}
      <ClientHistoryModal
        isOpen={isClientHistoryModalOpen}
        onClose={() => setIsClientHistoryModalOpen(false)}
        memberId={member.id}
        clientHistory={selectedClientHistory}
        clients={clients}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!clientHistoryToDelete}
        onClose={() => setClientHistoryToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Client History"
        description={`Are you sure you want to delete this client history period? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}