import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInput } from '@/components/ui/date-input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  clientHistory?: any;
  clients: any[];
}

export default function ClientHistoryModal({ 
  isOpen, 
  onClose, 
  memberId, 
  clientHistory, 
  clients 
}: ClientHistoryModalProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    role: '',
    startDate: '',
    endDate: '',
    status: 'Active',
    projects: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (clientHistory) {
      // Handle different clientId formats - could be number or string
      let clientIdValue = '';
      if (clientHistory.clientId) {
        if (typeof clientHistory.clientId === 'number') {
          clientIdValue = clientHistory.clientId.toString();
        } else if (typeof clientHistory.clientId === 'string') {
          // Try to extract number from string like "client-1-1" or use as-is if it's already a number string
          const numericMatch = clientHistory.clientId.match(/(\d+)/);
          clientIdValue = numericMatch ? numericMatch[1] : clientHistory.clientId;
        }
      }
      
      setFormData({
        clientId: clientIdValue,
        role: clientHistory.role || '',
        startDate: clientHistory.startDate || '',
        endDate: clientHistory.endDate || '',
        status: clientHistory.status || 'Active',
        projects: clientHistory.projects?.join(', ') || ''
      });
    } else {
      setFormData({
        clientId: '',
        role: '',
        startDate: '',
        endDate: '',
        status: 'Active',
        projects: ''
      });
    }
  }, [clientHistory, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = clientHistory 
        ? `/api/members/${memberId}/client-history/${clientHistory.id}`
        : `/api/members/${memberId}/client-history`;
      const method = clientHistory ? 'PATCH' : 'POST';
      
      const payload = {
        ...data,
        clientId: parseInt(data.clientId),
        projects: data.projects ? data.projects.split(',').map((p: string) => p.trim()).filter(Boolean) : []
      };

      return apiRequest(method, endpoint, payload);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: clientHistory ? 'Client history updated successfully' : 'Client history added successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', memberId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save client history',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.role || !formData.startDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    mutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {clientHistory ? 'Edit Client History' : 'Add Client History'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select 
              value={formData.clientId} 
              onValueChange={(value) => handleInputChange('clientId', value)}
            >
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

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              placeholder="e.g., Frontend Developer, Project Manager"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <DateInput
                id="startDate"
                value={formData.startDate}
                onChange={(value) => handleInputChange('startDate', value)}
                placeholder="Start date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <DateInput
                id="endDate"
                value={formData.endDate}
                onChange={(value) => handleInputChange('endDate', value)}
                placeholder="End date (optional)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projects">Projects</Label>
            <Input
              id="projects"
              value={formData.projects}
              onChange={(e) => handleInputChange('projects', e.target.value)}
              placeholder="Project names (comma separated)"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending ? 'Saving...' : clientHistory ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}