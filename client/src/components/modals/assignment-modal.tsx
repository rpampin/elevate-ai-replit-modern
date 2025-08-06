import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInput } from '@/components/ui/date-input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  assignment?: any;
  clients: any[];
}

export default function AssignmentModal({ isOpen, onClose, memberId, assignment, clients }: AssignmentModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    startDate: '',
    endDate: '',
    status: 'Active'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (assignment) {
      // Debug log to see assignment structure
      console.log('Assignment data in modal:', assignment);
      
      // Handle different clientId formats - could be number or string
      let clientIdValue = '';
      if (assignment.clientId) {
        if (typeof assignment.clientId === 'number') {
          clientIdValue = assignment.clientId.toString();
        } else if (typeof assignment.clientId === 'string') {
          // Try to extract number from string like "client-1-1" or use as-is if it's already a number string
          const numericMatch = assignment.clientId.match(/(\d+)/);
          clientIdValue = numericMatch ? numericMatch[1] : assignment.clientId;
        }
      }
      
      setFormData({
        title: assignment.title || assignment.project || assignment.name || '',
        description: assignment.description || assignment.details || '',
        clientId: clientIdValue,
        startDate: assignment.startDate || '',
        endDate: assignment.endDate || '',
        status: assignment.status === 'completed' ? 'Completed' : 
                assignment.status === 'active' ? 'Active' : 
                assignment.status === 'on-hold' ? 'On Hold' : 
                assignment.status || 'Active'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        clientId: '',
        startDate: '',
        endDate: '',
        status: 'Active'
      });
    }
  }, [assignment, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = assignment 
        ? `/api/members/${memberId}/assignments/${assignment.id}`
        : `/api/members/${memberId}/assignments`;
      const method = assignment ? 'PATCH' : 'POST';
      
      return apiRequest(method, endpoint, {
        ...data,
        clientId: parseInt(data.clientId)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: assignment ? 'Assignment updated successfully' : 'Assignment added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save assignment',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Title is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.clientId) {
      toast({
        title: 'Error',
        description: 'Client is required',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.startDate) {
      toast({
        title: 'Error',
        description: 'Start date is required',
        variant: 'destructive'
      });
      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{assignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Assignment title"
            />
          </div>

          <div>
            <Label htmlFor="client">Client *</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Assignment description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <DateInput
                id="startDate"
                value={formData.startDate}
                onChange={(value) => setFormData({...formData, startDate: value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <DateInput
                id="endDate"
                value={formData.endDate}
                onChange={(value) => setFormData({...formData, endDate: value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (assignment ? 'Update' : 'Add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}