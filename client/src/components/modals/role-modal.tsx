import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DateInput } from '@/components/ui/date-input';
import { Plus, X } from 'lucide-react';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: number;
  role?: any;
}

export default function RoleModal({ isOpen, onClose, memberId, role }: RoleModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skills: [] as string[],
    newSkill: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (role) {
      setFormData({
        title: role.title || '',
        description: role.description || '',
        skills: role.skills || [],
        newSkill: ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        skills: [],
        newSkill: ''
      });
    }
  }, [role, isOpen]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const endpoint = role 
        ? `/api/members/${memberId}/roles/${role.id}`
        : `/api/members/${memberId}/roles`;
      
      const method = role ? 'PATCH' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/members', memberId] });
      toast({
        title: role ? "Role updated" : "Role added",
        description: role ? "Role has been updated successfully." : "New role has been added successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${role ? 'update' : 'add'} role. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Role title is required.",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      title: formData.title,
      description: formData.description,
      skills: formData.skills
    });
  };

  const addSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Role Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Senior Developer, Team Lead"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Role responsibilities and achievements..."
              rows={3}
            />
          </div>

          <div>
            <Label>Skills & Technologies</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={formData.newSkill}
                onChange={(e) => setFormData({ ...formData, newSkill: e.target.value })}
                onKeyPress={handleKeyPress}
                placeholder="Add a skill..."
              />
              <Button type="button" onClick={addSkill} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : (role ? 'Update Role' : 'Add Role')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}