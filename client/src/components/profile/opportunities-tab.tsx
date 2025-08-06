import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Target, TrendingUp, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { PaginationControls } from '@/components/ui/pagination-controls';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import { MemberWithSkills, Skill, LearningGoal } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface OpportunitiesTabProps {
  member: MemberWithSkills;
}

export default function OpportunitiesTab({ member }: OpportunitiesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deletingGoal, setDeletingGoal] = useState<any>(null);
  const [newGoal, setNewGoal] = useState({
    skillId: '',
    description: '',
    targetLevel: 'Intermediate',
    status: 'Pending'
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Helper functions for scale management
  const getSkillCategory = (skillId: number) => {
    const skill = allSkills.find((skill: any) => skill.id === skillId);
    return skillCategories.find((cat: any) => cat.id === skill?.categoryId);
  };

  const getScaleForSkill = (skillId: number) => {
    const category = getSkillCategory(skillId);
    return scales.find((scale: any) => scale.id === category?.scaleId);
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

  // Fetch learning goals for this member
  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ['/api/learning-goals'],
    select: (data) => data.filter((goal: any) => goal.memberId === member.id)
  });

  // Get skills the member can learn (either don't have or can improve)
  const memberSkills = member.skills || [];
  const availableSkills = allSkills.filter(skill => {
    const memberSkill = memberSkills.find(ms => ms.skillId === skill.id);
    return !memberSkill || memberSkill.level !== 'Expert'; // Can learn new skills or improve existing ones
  });

  // Get valid target levels for a skill based on member's current level
  const getValidTargetLevels = (skillId: number) => {
    const scale = getScaleForSkill(skillId);
    if (!scale) return [];
    
    const scaleValues = getScaleValues(scale.id);
    const memberSkill = memberSkills.find(ms => ms.skillId === skillId);
    
    if (!memberSkill) {
      // If member doesn't know the skill, can only target beginner (first level)
      return scaleValues.slice(0, 1);
    } else {
      // If member knows the skill, can target current level or next steps
      const currentIndex = scaleValues.findIndex(val => val.value === memberSkill.level);
      if (currentIndex === -1) {
        // If current level not found, allow all levels
        return scaleValues;
      }
      // Allow current level and all higher levels
      return scaleValues.slice(currentIndex);
    }
  };

  // Add learning goal mutation
  const addGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/learning-goals', {
        memberId: member.id,
        skillId: parseInt(data.skillId),
        description: data.description,
        targetLevel: data.targetLevel,
        status: data.status
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-goals'] });
      setShowAddModal(false);
      setNewGoal({ skillId: '', description: '', targetLevel: 'Intermediate', status: 'Pending' });
      toast({ title: 'Success', description: 'Learning goal added successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add learning goal', variant: 'destructive' });
    }
  });

  // Update learning goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/learning-goals/${editingGoal.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-goals'] });
      setShowEditModal(false);
      setEditingGoal(null);
      toast({ title: 'Success', description: 'Learning goal updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update learning goal', variant: 'destructive' });
    }
  });

  // Delete learning goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const response = await apiRequest('DELETE', `/api/learning-goals/${goalId}`);
      // Don't try to parse JSON from a 204 response
      if (response.status === 204) {
        return { success: true };
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-goals'] });
      toast({ title: 'Success', description: 'Learning goal removed successfully' });
    },
    onError: (error) => {
      console.error('Delete learning goal error:', error);
      toast({ title: 'Error', description: 'Failed to remove learning goal', variant: 'destructive' });
    }
  });

  const handleAddGoal = () => {
    if (!newGoal.skillId || !newGoal.description) return;
    addGoalMutation.mutate(newGoal);
  };

  const handleUpdateGoal = () => {
    if (!editingGoal) return;
    updateGoalMutation.mutate({
      id: editingGoal.id,
      memberId: editingGoal.memberId,
      skillId: editingGoal.skillId,
      description: editingGoal.description,
      targetLevel: editingGoal.targetLevel,
      status: editingGoal.status || 'Pending'
    });
  };

  const handleDeleteGoal = (goal: any) => {
    setDeletingGoal(goal);
    setShowDeleteDialog(true);
  };

  const confirmDeleteGoal = () => {
    if (deletingGoal) {
      deleteGoalMutation.mutate(deletingGoal.id);
      setShowDeleteDialog(false);
      setDeletingGoal(null);
    }
  };



  const getCurrentSkillLevel = (skillId: number) => {
    const memberSkill = memberSkills.find(ms => ms.skillId === skillId);
    return memberSkill?.level || 'None';
  };

  // Pagination helper function
  const paginate = (array: any[], page: number, size: number) => {
    const startIndex = (page - 1) * size;
    return array.slice(startIndex, startIndex + size);
  };

  // Pagination calculations
  const totalItems = learningGoals.length;
  const paginatedGoals = paginate(learningGoals, currentPage, pageSize);



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Learning Opportunities</h3>
          <p className="text-sm text-gray-600">Active learning goals: {learningGoals.length}</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Learning Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Learning Goal</DialogTitle>
              <DialogDescription>
                Set a learning goal for {member.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Skill to Learn/Improve</Label>
                <Select value={newGoal.skillId} onValueChange={(value) => {
                  const validLevels = getValidTargetLevels(parseInt(value));
                  const defaultTargetLevel = validLevels.length > 0 ? validLevels[0].value : 'Intermediate';
                  setNewGoal({...newGoal, skillId: value, targetLevel: defaultTargetLevel});
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSkills.map(skill => {
                      const currentLevel = getCurrentSkillLevel(skill.id);
                      return (
                        <SelectItem key={skill.id} value={skill.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{skill.name}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              {currentLevel}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Level</Label>
                <Select value={newGoal.targetLevel} onValueChange={(value) => setNewGoal({...newGoal, targetLevel: value})} disabled={!newGoal.skillId}>
                  <SelectTrigger>
                    <SelectValue placeholder={newGoal.skillId ? "Select target level" : "Select a skill first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {newGoal.skillId && (() => {
                      const validLevels = getValidTargetLevels(parseInt(newGoal.skillId));
                      if (validLevels.length === 0) return <SelectItem value="" disabled>No scale available</SelectItem>;
                      return validLevels.map((scaleValue: any) => (
                        <SelectItem key={scaleValue.value} value={scaleValue.value}>
                          {scaleValue.value}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={newGoal.status} onValueChange={(value) => setNewGoal({...newGoal, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Learning Plan/Description</Label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  placeholder="Describe the learning plan or goals..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddGoal} 
                  disabled={!newGoal.skillId || !newGoal.description || addGoalMutation.isPending}
                >
                  {addGoalMutation.isPending ? 'Adding...' : 'Add Goal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedGoals.map((goal: any) => (
          <Card key={goal.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-base">{goal.skill?.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>Current: <Badge variant="outline">{getCurrentSkillLevel(goal.skillId)}</Badge></span>
                    <span>→</span>
                    <span>Target: <Badge variant="outline">{goal.targetLevel}</Badge></span>
                    <span>Status: <Badge variant={goal.status === 'Complete' ? 'default' : goal.status === 'Active' ? 'secondary' : 'outline'}>{goal.status || 'Pending'}</Badge></span>
                  </div>
                  <CardDescription className="text-sm">
                    {goal.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingGoal({
                        ...goal,
                        status: goal.status || 'Pending' // Ensure status is set
                      });
                      setShowEditModal(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGoal(goal)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {learningGoals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No learning goals set yet.</p>
          <p className="text-sm">Add learning goals to track skill development opportunities.</p>
        </div>
      )}

      {/* Use the new PaginationControls component */}
      {learningGoals.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          label="learning goals"
        />
      )}

      {/* Edit Learning Goal Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Learning Goal</DialogTitle>
            <DialogDescription>
              Update learning goal for {editingGoal?.skill?.name}
            </DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4">
              <div>
                <Label>Target Level</Label>
                <Select
                  value={editingGoal.targetLevel}
                  onValueChange={(value) => setEditingGoal({...editingGoal, targetLevel: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const validLevels = getValidTargetLevels(editingGoal.skillId);
                      if (validLevels.length === 0) return <SelectItem value="" disabled>No scale available</SelectItem>;
                      return validLevels.map((scaleValue: any) => (
                        <SelectItem key={scaleValue.value} value={scaleValue.value}>
                          {scaleValue.value}
                        </SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select value={editingGoal.status || 'Pending'} onValueChange={(value) => setEditingGoal({...editingGoal, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Learning Plan/Description</Label>
                <Textarea
                  value={editingGoal.description || ''}
                  onChange={(e) => setEditingGoal({...editingGoal, description: e.target.value})}
                  placeholder="Describe the learning plan or goals..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateGoal} disabled={updateGoalMutation.isPending}>
                  {updateGoalMutation.isPending ? 'Updating...' : 'Update Goal'}
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
          setDeletingGoal(null);
        }}
        onConfirm={confirmDeleteGoal}
        title="Delete Learning Goal"
        description={`Are you sure you want to delete the learning goal for "${deletingGoal?.skill?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}