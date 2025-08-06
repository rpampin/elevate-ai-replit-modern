import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DateInput } from '@/components/ui/date-input';

interface AppreciationModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  appreciation?: any;
  clients?: any[];
}

export default function AppreciationModal({ isOpen, onClose, memberId, appreciation, clients = [] }: AppreciationModalProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    author: '',
    message: '',
    date: '',
    rating: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (appreciation) {
      // Handle different clientId formats - could be number or string
      let clientIdValue = '';
      if (appreciation.clientId) {
        if (typeof appreciation.clientId === 'number') {
          clientIdValue = appreciation.clientId.toString();
        } else if (typeof appreciation.clientId === 'string') {
          // Try to extract number from string like "client-1-1" or use as-is if it's already a number string
          const numericMatch = appreciation.clientId.match(/(\d+)/);
          clientIdValue = numericMatch ? numericMatch[1] : appreciation.clientId;
        }
      }
      
      setFormData({
        clientId: clientIdValue,
        author: appreciation.author || '',
        message: appreciation.message || '',
        date: appreciation.date || '',
        rating: appreciation.rating?.toString() || ''
      });
    } else {
      setFormData({
        clientId: '',
        author: '',
        message: '',
        date: '',
        rating: ''
      });
    }
  }, [appreciation, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = appreciation 
        ? `/api/members/${memberId}/appreciations/${appreciation.id}`
        : `/api/members/${memberId}/appreciations`;
      
      const method = appreciation ? 'PATCH' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', memberId] });
      toast({
        title: appreciation ? "Appreciation updated" : "Appreciation added",
        description: appreciation ? "Appreciation has been updated successfully." : "New appreciation has been added successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${appreciation ? 'update' : 'add'} appreciation. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.author.trim() || !formData.message.trim() || !formData.date) {
      toast({
        title: "Error",
        description: "Client, author, message, and date are required.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      clientId: parseInt(formData.clientId),
      author: formData.author,
      message: formData.message,
      date: formData.date,
      ...(formData.rating && { rating: parseInt(formData.rating) })
    };

    mutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{appreciation ? 'Edit Appreciation' : 'Add Appreciation'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientId">Client *</Label>
            <Select value={formData.clientId} onValueChange={(value) => setFormData({ ...formData, clientId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="Who gave this appreciation?"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Appreciation message..."
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

          <div>
            <Label htmlFor="rating">Rating (1-5)</Label>
            <Select value={formData.rating} onValueChange={(value) => setFormData({ ...formData, rating: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select rating (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Basic</SelectItem>
                <SelectItem value="2">2 - Good</SelectItem>
                <SelectItem value="3">3 - Very Good</SelectItem>
                <SelectItem value="4">4 - Excellent</SelectItem>
                <SelectItem value="5">5 - Outstanding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (appreciation ? 'Update Appreciation' : 'Add Appreciation')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}