import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import { MemberWithSkills, Skill } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface SkillsTabProps {
  member: MemberWithSkills;
}

export default function SkillsTab({ member }: SkillsTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [deletingSkill, setDeletingSkill] = useState<any>(null);
  const [newSkill, setNewSkill] = useState({
    skillId: '',
    level: '',
    scaleId: ''
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [skillsPerPage, setSkillsPerPage] = useState(10);

  // Fetch all available skills
  const { data: allSkills = [] } = useQuery<Skill[]>({
    queryKey: ['/api/skills'],
  });

  // Fetch all skill categories (to get default scales)
  const { data: skillCategories = [] } = useQuery({
    queryKey: ['/api/skill-categories'],
  });

  // Fetch all scales
  const { data: scales = [] } = useQuery({
    queryKey: ['/api/scales'],
  });

  // Get member's current skills
  const memberSkills = member.skills || [];

  // Helper functions for working with scales
  const getSkillCategory = (skillId: number) => {
    const skill = allSkills.find(s => s.id === skillId);
    return skillCategories.find(cat => cat.id === skill?.categoryId);
  };

  const getScaleForSkill = (skillId: number) => {
    const category = getSkillCategory(skillId);
    return scales.find(scale => scale.id === category?.scaleId);
  };

  const getScaleValues = (scaleId: number) => {
    const scale = scales.find((s: any) => s.id === scaleId);
    if (!scale || !scale.values) return [];
    
    // Handle both formats: array of objects {value, order} or simple array of strings
    if (Array.isArray(scale.values)) {
      if (scale.values.length > 0 && typeof scale.values[0] === 'object') {
        // Format: [{value: "Beginner", order: 1}, ...]
        return scale.values.sort((a: any, b: any) => a.order - b.order);
      } else {
        // Format: ["Beginner", "Advanced", "Expert"]
        return scale.values.map((value: string, index: number) => ({
          value,
          order: index
        }));
      }
    }
    return [];
  };

  const getScaleDisplayValue = (scaleId: number, level: string) => {
    const values = getScaleValues(scaleId);
    const scaleValue = values.find((v: any) => v.value === level);
    return scaleValue?.value || level;
  };

  // Filter skills based on search term
  const filteredSkills = memberSkills.filter(skill =>
    skill.skill?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredSkills.length;
  const totalPages = Math.ceil(totalItems / skillsPerPage);
  const startIndex = (currentPage - 1) * skillsPerPage;
  const endIndex = startIndex + skillsPerPage;
  const paginatedSkills = filteredSkills.slice(startIndex, endIndex);

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/members/${member.id}/skills`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setShowAddModal(false);
      setNewSkill({ skillId: '', level: '', scaleId: '' });
      toast({ title: 'Success', description: 'Skill added successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add skill', variant: 'destructive' });
    }
  });

  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PUT', `/api/members/${member.id}/skills/${editingSkill.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setShowEditModal(false);
      setEditingSkill(null);
      toast({ title: 'Success', description: 'Skill updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update skill', variant: 'destructive' });
    }
  });

  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest('DELETE', `/api/members/${member.id}/skills/${skillId}`);
      // Don't try to parse JSON from a 204 response
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: 'Success', description: 'Skill removed successfully' });
    },
    onError: (error) => {
      console.error('Delete skill error:', error);
      toast({ title: 'Error', description: 'Failed to remove skill', variant: 'destructive' });
    }
  });

  const handleAddSkill = () => {
    if (!newSkill.skillId || !newSkill.level) return;
    addSkillMutation.mutate({
      skillId: parseInt(newSkill.skillId),
      level: newSkill.level,
      scaleId: parseInt(newSkill.scaleId)
    });
  };

  const handleUpdateSkill = () => {
    if (!editingSkill) return;
    updateSkillMutation.mutate({
      level: editingSkill.level
    });
  };

  const handleDeleteSkill = (skill: any) => {
    setDeletingSkill(skill);
    setShowDeleteDialog(true);
  };

  const confirmDeleteSkill = () => {
    if (deletingSkill) {
      deleteSkillMutation.mutate(deletingSkill.id);
      setShowDeleteDialog(false);
      setDeletingSkill(null);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Expert': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Skills & Expertise</h3>
          <p className="text-sm text-gray-600">Total skills: {memberSkills.length}</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Skill
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Skill</DialogTitle>
              <DialogDescription>
                Add a skill to {member.name}'s profile
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Skill</Label>
                <Select 
                  value={newSkill.skillId} 
                  onValueChange={(value) => {
                    const scale = getScaleForSkill(parseInt(value));
                    setNewSkill({
                      ...newSkill, 
                      skillId: value, 
                      scaleId: scale?.id?.toString() || '',
                      level: '' // Reset level when skill changes
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSkills
                      .filter(skill => !memberSkills.some(ms => ms.skillId === skill.id))
                      .map(skill => (
                        <SelectItem key={skill.id} value={skill.id.toString()}>
                          {skill.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Proficiency Level</Label>
                <Select 
                  value={newSkill.level} 
                  onValueChange={(value) => setNewSkill({...newSkill, level: value})}
                  disabled={!newSkill.skillId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={newSkill.skillId ? "Select level" : "Select a skill first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {newSkill.skillId && (() => {
                      const scale = getScaleForSkill(parseInt(newSkill.skillId));
                      if (!scale) return <SelectItem value="" disabled>No scale available</SelectItem>;
                      const values = getScaleValues(scale.id);
                      return values.map((scaleValue: any) => (
                        <SelectItem key={scaleValue.value} value={scaleValue.value}>
                          {scaleValue.value}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSkill} disabled={!newSkill.skillId || addSkillMutation.isPending}>
                  {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedSkills.map((memberSkill) => (
          <Card key={memberSkill.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{memberSkill.skill?.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {memberSkill.skill?.purpose}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSkill(memberSkill);
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSkill(memberSkill)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge className={getLevelColor(memberSkill.level)}>
                  {memberSkill.scaleId 
                    ? getScaleDisplayValue(memberSkill.scaleId, memberSkill.level)
                    : memberSkill.level
                  }
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No skills found matching your search.' : 'No skills assigned yet.'}
        </div>
      )}

      {filteredSkills.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredSkills.length}
          pageSize={skillsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setSkillsPerPage(size);
            setCurrentPage(1);
          }}
          label="skills"
        />
      )}

      {/* Edit Skill Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update {editingSkill?.skill?.name} for {member.name}
            </DialogDescription>
          </DialogHeader>
          {editingSkill && (
            <div className="space-y-4">
              <div>
                <Label>Proficiency Level</Label>
                <Select
                  value={editingSkill.level}
                  onValueChange={(value) => setEditingSkill({...editingSkill, level: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const scale = getScaleForSkill(editingSkill.skillId);
                      if (!scale) return <SelectItem value="" disabled>No scale available</SelectItem>;
                      const values = getScaleValues(scale.id);
                      return values.map((scaleValue: any) => (
                        <SelectItem key={scaleValue.value} value={scaleValue.value}>
                          {scaleValue.value}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSkill} disabled={updateSkillMutation.isPending}>
                  {updateSkillMutation.isPending ? 'Updating...' : 'Update Skill'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingSkill(null);
        }}
        onConfirm={confirmDeleteSkill}
        title="Remove Skill"
        description={`Are you sure you want to remove "${deletingSkill?.skill?.name}" from ${member.name}'s profile? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}