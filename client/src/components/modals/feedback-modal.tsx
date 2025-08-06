import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DateInput } from '@/components/ui/date-input';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  feedback?: any;
}

export default function FeedbackModal({ isOpen, onClose, memberId, feedback }: FeedbackModalProps) {
  const [formData, setFormData] = useState({
    author: '',
    comment: '',
    date: '',
    type: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (feedback) {
      setFormData({
        author: feedback.author || '',
        comment: feedback.comment || '',
        date: feedback.date || '',
        type: feedback.type || ''
      });
    } else {
      setFormData({
        author: '',
        comment: '',
        date: '',
        type: ''
      });
    }
  }, [feedback, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = feedback 
        ? `/api/members/${memberId}/feedback/${feedback.id}`
        : `/api/members/${memberId}/feedback`;
      
      const method = feedback ? 'PATCH' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', memberId] });
      toast({
        title: feedback ? "Feedback updated" : "Feedback added",
        description: feedback ? "Feedback has been updated successfully." : "New feedback has been added successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${feedback ? 'update' : 'add'} feedback. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.author.trim() || !formData.comment.trim() || !formData.date || !formData.type) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      author: formData.author,
      comment: formData.comment,
      date: formData.date,
      type: formData.type
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{feedback ? 'Edit Feedback' : 'Add Feedback'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Who provided this feedback?"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Feedback Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select feedback type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Performance Review">Performance Review</SelectItem>
                <SelectItem value="Project Feedback">Project Feedback</SelectItem>
                <SelectItem value="Peer Review">Peer Review</SelectItem>
                <SelectItem value="Client Feedback">Client Feedback</SelectItem>
                <SelectItem value="360 Review">360 Review</SelectItem>
                <SelectItem value="One-on-One">One-on-One</SelectItem>
                <SelectItem value="Improvement">Improvement</SelectItem>
                <SelectItem value="Recognition">Recognition</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comment">Comment *</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              placeholder="Feedback details..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date *</Label>
            <DateInput
              id="date"
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              placeholder="DD/MM/YYYY"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (feedback ? 'Update Feedback' : 'Add Feedback')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}