import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDisplay } from '@/lib/utils';
import type { MemberWithSkills } from '@shared/schema';
import FeedbackModal from '@/components/modals/feedback-modal';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface FeedbackTabProps {
  member: MemberWithSkills;
  clients: any[];
}

export default function FeedbackTab({ member, clients }: FeedbackTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(10);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<any>(null);

  // Delete feedback mutation
  const deleteFeedbackMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      return apiRequest('DELETE', `/api/members/${member.id}/feedback/${feedbackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', member.id] });
      toast({
        title: "Feedback deleted",
        description: "Feedback has been deleted successfully.",
      });
      setFeedbackToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddFeedback = () => {
    setSelectedFeedback(null);
    setIsFeedbackModalOpen(true);
  };

  const handleEditFeedback = (feedback: any) => {
    setSelectedFeedback(feedback);
    setIsFeedbackModalOpen(true);
  };

  const handleDeleteFeedback = (feedback: any) => {
    setFeedbackToDelete(feedback);
  };

  const confirmDelete = () => {
    if (feedbackToDelete) {
      deleteFeedbackMutation.mutate(feedbackToDelete.id);
    }
  };

  // Pagination helper
  const paginate = (items: any[], page: number, pageSize: number) => {
    const startIndex = (page - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'constructive':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'improvement':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Team Feedback ({member?.profile?.feedbackComments?.length || 0})</h3>
        <Button
          size="sm"
          className="flex items-center gap-2"
          onClick={handleAddFeedback}
        >
          <Plus className="w-4 h-4" />
          Add Feedback
        </Button>
      </div>
      <div className="grid gap-4">
        {member?.profile?.feedbackComments && member.profile.feedbackComments.length > 0 ? (
          <>
            {paginate(member.profile.feedbackComments, feedbackPage, feedbackPageSize).map((feedback: any, index: number) => (
              <Card key={index} className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-orange-900 dark:text-orange-100">
                          {feedback.author}
                        </h4>
                        <Badge className={getTypeBadgeColor(feedback.type)}>
                          {feedback.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {feedback.comment}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDateForDisplay(feedback.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditFeedback(feedback)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteFeedback(feedback)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <PaginationControls
              currentPage={feedbackPage}
              totalItems={member.profile.feedbackComments.length}
              pageSize={feedbackPageSize}
              onPageChange={setFeedbackPage}
              onPageSizeChange={(size) => {
                setFeedbackPageSize(size);
                setFeedbackPage(1);
              }}
              label="feedback entries"
            />
          </>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No team feedback recorded yet
          </p>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        memberId={member.id}
        feedback={selectedFeedback}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!feedbackToDelete}
        onClose={() => setFeedbackToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Feedback"
        description={`Are you sure you want to delete this feedback from "${feedbackToDelete?.author}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}