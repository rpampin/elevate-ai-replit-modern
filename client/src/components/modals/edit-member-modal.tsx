import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, User, Star, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { MemberWithSkills, InsertMember, Client } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getCurrentClientName, getClientNameFromId } from '@/lib/client-utils';

interface EditMemberModalProps {
  member: MemberWithSkills;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditMemberModal({ member, trigger, open: externalOpen, onOpenChange }: EditMemberModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Pagination state
  const [currentSkillPage, setCurrentSkillPage] = useState(1);
  const [currentAssignmentPage, setCurrentAssignmentPage] = useState(1);
  const [currentRolePage, setCurrentRolePage] = useState(1);
  const [currentAppreciationPage, setCurrentAppreciationPage] = useState(1);
  const [currentFeedbackPage, setCurrentFeedbackPage] = useState(1);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const skillsPerPage = 6;
  const itemsPerPage = 5;
  
  // Add modal states
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddAppreciationModal, setShowAddAppreciationModal] = useState(false);
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);
  const [showAddHistoryModal, setShowAddHistoryModal] = useState(false);
  
  // Edit modal states
  const [showEditSkillModal, setShowEditSkillModal] = useState(false);
  const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [showEditAppreciationModal, setShowEditAppreciationModal] = useState(false);
  const [showEditFeedbackModal, setShowEditFeedbackModal] = useState(false);
  const [showEditHistoryModal, setShowEditHistoryModal] = useState(false);
  
  // Currently editing items
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [editingAppreciation, setEditingAppreciation] = useState<any>(null);
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [editingHistory, setEditingHistory] = useState<any>(null);

  // Don't render if member is undefined
  if (!member) {
    return null;
  }

  const [formData, setFormData] = useState({
    name: member.name || '',
    email: member.email || '',
    category: member.category || '',
    stage: member.stage || '',
    status: member.status || '',
    notes: member.notes || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: Partial<InsertMember>) => {
      const response = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update member');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({ title: "Member updated successfully" });
      setOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to update member", variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateMemberMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter and sort data
  const filteredSkills = member.skills?.filter(skill => skill.skill) || [];
  const sortedAssignments = member.profile?.assignments ? [...member.profile.assignments].sort((a, b) => 
    new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime()
  ) : [];
  const sortedHistory = member.profile?.clientHistory ? [...member.profile.clientHistory].sort((a, b) => 
    new Date(b.startDate || '').getTime() - new Date(a.startDate || '').getTime()
  ) : [];

  // Pagination logic
  const totalSkillPages = Math.ceil(filteredSkills.length / skillsPerPage);
  const startSkillIndex = (currentSkillPage - 1) * skillsPerPage;
  const paginatedSkills = filteredSkills.slice(startSkillIndex, startSkillIndex + skillsPerPage);

  const totalAssignmentPages = Math.ceil(sortedAssignments.length / itemsPerPage);
  const startAssignmentIndex = (currentAssignmentPage - 1) * itemsPerPage;
  const paginatedAssignments = sortedAssignments.slice(startAssignmentIndex, startAssignmentIndex + itemsPerPage);

  const totalHistoryPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const startHistoryIndex = (currentHistoryPage - 1) * itemsPerPage;
  const paginatedHistory = sortedHistory.slice(startHistoryIndex, startHistoryIndex + itemsPerPage);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Member: {member.name}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="appreciations">Appreciations</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Frontend">Frontend</SelectItem>
                        <SelectItem value="Backend">Backend</SelectItem>
                        <SelectItem value="Fullstack">Fullstack</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Data">Data</SelectItem>
                        <SelectItem value="QA">QA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stage">Stage</Label>
                    <Select value={formData.stage} onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Junior">Junior</SelectItem>
                        <SelectItem value="Mid">Mid</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="currentClient">Current Client (Read-only)</Label>
                  <Input
                    id="currentClient"
                    value={getCurrentClientName(member, clients || [])}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Current client is derived from active work history
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Save className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Skills ({filteredSkills.length})</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddSkillModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Skill
                  </Button>
                </div>
                {paginatedSkills && paginatedSkills.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedSkills.map((memberSkill, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium">{memberSkill.skill?.name}</h4>
                              <p className="text-sm text-muted-foreground">{memberSkill.skill?.purpose}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{memberSkill.level}</Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingSkill(memberSkill);
                                setShowEditSkillModal(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalSkillPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSkillPage(Math.max(1, currentSkillPage - 1))}
                          disabled={currentSkillPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentSkillPage} of {totalSkillPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSkillPage(Math.min(totalSkillPages, currentSkillPage + 1))}
                          disabled={currentSkillPage >= totalSkillPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No skills recorded</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Assignments ({sortedAssignments.length})</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddAssignmentModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assignment
                  </Button>
                </div>
                {paginatedAssignments && paginatedAssignments.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {paginatedAssignments.map((assignment: any, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{getClientNameFromId(assignment.clientId, clients || [])}</div>
                              <div className="text-sm text-muted-foreground">{assignment.project}</div>
                              <div className="text-xs text-muted-foreground">
                                {assignment.startDate} - {assignment.endDate || 'Present'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={assignment.status === "Active" ? "default" : "secondary"}>
                                {assignment.status || "Unknown"}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingAssignment(assignment);
                                setShowEditAssignmentModal(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalAssignmentPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAssignmentPage(Math.max(1, currentAssignmentPage - 1))}
                          disabled={currentAssignmentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentAssignmentPage} of {totalAssignmentPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAssignmentPage(Math.min(totalAssignmentPages, currentAssignmentPage + 1))}
                          disabled={currentAssignmentPage >= totalAssignmentPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No assignments recorded</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Roles</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddRoleModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Role
                  </Button>
                </div>
                {member.profile?.roles && member.profile.roles.length > 0 ? (
                  <div className="space-y-2">
                    {member.profile.roles.map((role, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium">Role: {role.title}</div>
                            <div className="text-sm text-muted-foreground">{role.description}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingRole(role);
                              setShowEditRoleModal(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No roles recorded</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="appreciations" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Client Appreciations</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddAppreciationModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Appreciation
                  </Button>
                </div>
                {member.profile?.appreciations && member.profile.appreciations.length > 0 ? (
                  <div className="space-y-2">
                    {member.profile.appreciations.map((appreciation: any, index) => (
                      <div key={index} className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium">Client: {getClientNameFromId(appreciation.clientId, clients)}</div>
                          <div className="flex items-center gap-2">
                            {(appreciation.rating || (appreciation as any).rating) && (
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((starNumber) => {
                                  const rating = appreciation.rating || (appreciation as any).rating || 0;
                                  const filled = starNumber <= rating;
                                  return (
                                    <Star 
                                      key={starNumber} 
                                      className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                  );
                                })}
                              </div>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingAppreciation(appreciation);
                              setShowEditAppreciationModal(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm">{(appreciation as any).text || (appreciation as any).message}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(appreciation.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No appreciations recorded</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Feedback Comments</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddFeedbackModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Feedback
                  </Button>
                </div>
                {member.profile?.feedbackComments && member.profile.feedbackComments.length > 0 ? (
                  <div className="space-y-2">
                    {member.profile.feedbackComments.map((feedback: any, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                From: {feedback.author || feedback.from || 'Team Lead'}
                              </span>
                            </div>
                            <p className="text-sm">{(feedback as any).text || feedback.comment}</p>
                            <div className="text-xs text-muted-foreground mt-2">
                              {new Date(feedback.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setEditingFeedback(feedback);
                              setShowEditFeedbackModal(true);
                            }}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No feedback recorded</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Client History ({sortedHistory.length})</h3>
                  <Button variant="outline" size="sm" onClick={() => setShowAddHistoryModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add History
                  </Button>
                </div>
                {paginatedHistory && paginatedHistory.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      {paginatedHistory.map((history: any, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{getClientNameFromId(history.clientId, clients)}</div>
                              <div className="text-sm text-muted-foreground">{history.role || 'Role not specified'}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {history.startDate} - {history.endDate || 'Present'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={history.status === "Active" ? "default" : "secondary"}>
                                {history.status || (history.endDate ? "Completed" : "Active")}
                              </Badge>
                              <Button variant="ghost" size="sm" onClick={() => {
                                setEditingHistory(history);
                                setShowEditHistoryModal(true);
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {totalHistoryPages > 1 && (
                      <div className="flex justify-center items-center gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentHistoryPage(Math.max(1, currentHistoryPage - 1))}
                          disabled={currentHistoryPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentHistoryPage} of {totalHistoryPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentHistoryPage(Math.min(totalHistoryPages, currentHistoryPage + 1))}
                          disabled={currentHistoryPage >= totalHistoryPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">No client history recorded</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Skill Modal */}
      <AddSkillDialog 
        open={showAddSkillModal}
        onOpenChange={setShowAddSkillModal}
        memberId={member.id}
        onSuccess={() => {
          setShowAddSkillModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
        }}
      />

      {/* Add Assignment Modal */}
      <AddAssignmentDialog 
        open={showAddAssignmentModal}
        onOpenChange={setShowAddAssignmentModal}
        memberId={member.id}
        onSuccess={() => {
          setShowAddAssignmentModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
        }}
      />

      {/* Add Role Modal */}
      <AddRoleDialog 
        open={showAddRoleModal}
        onOpenChange={setShowAddRoleModal}
        memberId={member.id}
        onSuccess={() => {
          setShowAddRoleModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
        }}
      />

      {/* Add Appreciation Modal */}
      <AddAppreciationDialog 
        open={showAddAppreciationModal}
        onOpenChange={setShowAddAppreciationModal}
        memberId={member.id}
        onSuccess={() => {
          setShowAddAppreciationModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
        }}
      />

      {/* Add Feedback Modal */}
      <AddFeedbackDialog 
        open={showAddFeedbackModal}
        onOpenChange={setShowAddFeedbackModal}
        memberId={member.id}
        onSuccess={() => {
          setShowAddFeedbackModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
        }}
      />

      {/* Add History Modal */}
      <AddHistoryDialog 
        open={showAddHistoryModal}
        onOpenChange={setShowAddHistoryModal}
        memberId={member.id}
        onSuccess={() => {
          setShowAddHistoryModal(false);
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
        }}
      />

      {/* Edit Modals */}
      {editingSkill && (
        <EditSkillDialog 
          open={showEditSkillModal}
          onOpenChange={setShowEditSkillModal}
          memberId={member.id}
          skill={editingSkill}
          onSuccess={() => {
            setShowEditSkillModal(false);
            setEditingSkill(null);
            queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          }}
        />
      )}

      {editingAssignment && (
        <EditAssignmentDialog 
          open={showEditAssignmentModal}
          onOpenChange={setShowEditAssignmentModal}
          memberId={member.id}
          assignment={editingAssignment}
          onSuccess={() => {
            setShowEditAssignmentModal(false);
            setEditingAssignment(null);
            queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          }}
        />
      )}

      {editingRole && (
        <EditRoleDialog 
          open={showEditRoleModal}
          onOpenChange={setShowEditRoleModal}
          memberId={member.id}
          role={editingRole}
          onSuccess={() => {
            setShowEditRoleModal(false);
            setEditingRole(null);
            queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          }}
        />
      )}

      {editingAppreciation && (
        <EditAppreciationDialog 
          open={showEditAppreciationModal}
          onOpenChange={setShowEditAppreciationModal}
          memberId={member.id}
          appreciation={editingAppreciation}
          onSuccess={() => {
            setShowEditAppreciationModal(false);
            setEditingAppreciation(null);
            queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          }}
        />
      )}

      {editingFeedback && (
        <EditFeedbackDialog 
          open={showEditFeedbackModal}
          onOpenChange={setShowEditFeedbackModal}
          memberId={member.id}
          feedback={editingFeedback}
          onSuccess={() => {
            setShowEditFeedbackModal(false);
            setEditingFeedback(null);
            queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          }}
        />
      )}

      {editingHistory && (
        <EditHistoryDialog 
          open={showEditHistoryModal}
          onOpenChange={setShowEditHistoryModal}
          memberId={member.id}
          history={editingHistory}
          onSuccess={() => {
            setShowEditHistoryModal(false);
            setEditingHistory(null);
            queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          }}
        />
      )}
    </>
  );
}

// Add dialogs for each form
function AddSkillDialog({ open, onOpenChange, memberId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  onSuccess: () => void;
}) {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
  });

  const addSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add skill');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setSkillId('');
      setLevel('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId || !level) return;
    
    setIsSubmitting(true);
    try {
      await addSkillMutation.mutateAsync({
        skillId: parseInt(skillId),
        level,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="skill">Skill</Label>
            <Select value={skillId} onValueChange={setSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                {skills?.map((skill: any) => (
                  <SelectItem key={skill.id} value={skill.id.toString()}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isSubmitting || !skillId || !level}>
            {isSubmitting ? 'Adding...' : 'Add Skill'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAssignmentDialog({ open, onOpenChange, memberId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [project, setProject] = useState('');
  const [status, setStatus] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const addAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add assignment');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setClientId('');
      setProject('');
      setStartDate('');
      setEndDate('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !project || !startDate) return;
    
    setIsSubmitting(true);
    try {
      await addAssignmentMutation.mutateAsync({
        clientId: parseInt(clientId),
        project,
        status,
        startDate,
        endDate: endDate || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
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
            <Label htmlFor="project">Project</Label>
            <Input
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting || !clientId || !project || !startDate}>
            {isSubmitting ? 'Adding...' : 'Add Assignment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddRoleDialog({ open, onOpenChange, memberId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add role');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setTitle('');
      setDescription('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setIsSubmitting(true);
    try {
      await addRoleMutation.mutateAsync({
        title,
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Role Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Developer, Team Lead"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role responsibilities and details"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !title || !description}>
            {isSubmitting ? 'Adding...' : 'Add Role'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddAppreciationDialog({ open, onOpenChange, memberId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const addAppreciationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/appreciations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add appreciation');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setClientId('');
      setText('');
      setRating(5);
      setDate(new Date().toISOString().split('T')[0]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !text) return;
    
    setIsSubmitting(true);
    try {
      await addAppreciationMutation.mutateAsync({
        clientId: parseInt(clientId),
        text,
        rating,
        date,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client Appreciation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
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
            <Label htmlFor="text">Appreciation Message</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Client appreciation message"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating</Label>
            <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Star{num !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !clientId || !text}>
            {isSubmitting ? 'Adding...' : 'Add Appreciation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddFeedbackDialog({ open, onOpenChange, memberId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  onSuccess: () => void;
}) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add feedback');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setText('');
      setDate(new Date().toISOString().split('T')[0]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    
    setIsSubmitting(true);
    try {
      await addFeedbackMutation.mutateAsync({
        text,
        date,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="text">Feedback Comment</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Feedback comment"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !text}>
            {isSubmitting ? 'Adding...' : 'Add Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddHistoryDialog({ open, onOpenChange, memberId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  onSuccess: () => void;
}) {
  const [clientId, setClientId] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Completed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: clients } = useQuery({
    queryKey: ['/api/clients'],
  });

  const addHistoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add history');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setClientId('');
      setRole('');
      setStartDate('');
      setEndDate('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !role || !startDate) return;
    
    setIsSubmitting(true);
    try {
      await addHistoryMutation.mutateAsync({
        clientId: parseInt(clientId),
        role,
        startDate,
        endDate: endDate || null,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
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
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role in this client engagement"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting || !clientId || !role || !startDate}>
            {isSubmitting ? 'Adding...' : 'Add History'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Skill Dialog
function EditSkillDialog({ open, onOpenChange, memberId, skill, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  skill: any;
  onSuccess: () => void;
}) {
  const [level, setLevel] = useState(skill?.level || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/skills/${skill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update skill');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!level) return;
    
    setIsSubmitting(true);
    try {
      await updateSkillMutation.mutateAsync({ level });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Skill: {skill?.skill?.name || skill?.name || 'Unknown Skill'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="level">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isSubmitting || !level}>
            {isSubmitting ? 'Updating...' : 'Update Skill'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Assignment Dialog
function EditAssignmentDialog({ open, onOpenChange, memberId, assignment, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  assignment: any;
  onSuccess: () => void;
}) {
  const [project, setProject] = useState(assignment?.title || assignment?.project || '');
  const [description, setDescription] = useState(assignment?.description || '');
  const [status, setStatus] = useState(assignment?.status || 'Active');
  const [startDate, setStartDate] = useState(assignment?.startDate || '');
  const [endDate, setEndDate] = useState(assignment?.endDate || '');

  // Update form when assignment changes
  React.useEffect(() => {
    if (assignment) {
      setProject(assignment?.title || assignment?.project || '');
      setDescription(assignment?.description || '');
      setStatus(assignment?.status || 'Active');
      setStartDate(assignment?.startDate || '');
      setEndDate(assignment?.endDate || '');
    }
  }, [assignment]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update assignment');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !startDate) return;
    
    setIsSubmitting(true);
    try {
      await updateAssignmentMutation.mutateAsync({
        title: project,
        description,
        status,
        startDate,
        endDate: endDate || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Assignment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project">Project Title</Label>
            <Input
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting || !project || !startDate}>
            {isSubmitting ? 'Updating...' : 'Update Assignment'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Role Dialog
function EditRoleDialog({ open, onOpenChange, memberId, role, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  role: any;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState(role?.title || '');
  const [description, setDescription] = useState(role?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/roles/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update role');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setIsSubmitting(true);
    try {
      await updateRoleMutation.mutateAsync({
        title,
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Role Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Developer, Team Lead"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Role responsibilities and details"
              rows={3}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !title || !description}>
            {isSubmitting ? 'Updating...' : 'Update Role'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Appreciation Dialog
function EditAppreciationDialog({ open, onOpenChange, memberId, appreciation, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  appreciation: any;
  onSuccess: () => void;
}) {
  const [text, setText] = useState(appreciation?.text || appreciation?.message || '');
  const [rating, setRating] = useState(appreciation?.rating || 5);
  const [date, setDate] = useState(appreciation?.date ? new Date(appreciation.date).toISOString().split('T')[0] : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateAppreciationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/appreciations/${appreciation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update appreciation');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    
    setIsSubmitting(true);
    try {
      await updateAppreciationMutation.mutateAsync({
        text,
        rating,
        date,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client Appreciation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="text">Appreciation Message</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Client appreciation message"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="rating">Rating</Label>
            <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Star{num !== 1 ? 's' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !text}>
            {isSubmitting ? 'Updating...' : 'Update Appreciation'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Feedback Dialog
function EditFeedbackDialog({ open, onOpenChange, memberId, feedback, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  feedback: any;
  onSuccess: () => void;
}) {
  const [text, setText] = useState(feedback?.text || feedback?.comment || '');
  const [author, setAuthor] = useState(feedback?.author || feedback?.from || 'Team Lead');
  const [date, setDate] = useState(feedback?.date ? new Date(feedback.date).toISOString().split('T')[0] : '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/feedback/${feedback.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update feedback');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    
    setIsSubmitting(true);
    try {
      await updateFeedbackMutation.mutateAsync({
        text,
        author,
        date,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Feedback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="author">From</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Who provided this feedback"
            />
          </div>
          <div>
            <Label htmlFor="text">Feedback Comment</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Feedback comment"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting || !text}>
            {isSubmitting ? 'Updating...' : 'Update Feedback'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit History Dialog
function EditHistoryDialog({ open, onOpenChange, memberId, history, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  memberId: number; 
  history: any;
  onSuccess: () => void;
}) {
  const { data: clients = [] } = useQuery({ queryKey: ['/api/clients'] });
  const [role, setRole] = useState(history?.role || history?.position || '');
  const [startDate, setStartDate] = useState(history?.startDate || '');
  const [endDate, setEndDate] = useState(history?.endDate || '');
  const [status, setStatus] = useState(history?.status || (history?.endDate ? 'Completed' : 'Active'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const clientName = getClientNameFromId(history?.clientId, clients) || 'Unknown Client';

  // Update form when history changes
  React.useEffect(() => {
    if (history) {
      setRole(history?.role || history?.position || '');
      setStartDate(history?.startDate || '');
      setEndDate(history?.endDate || '');
      setStatus(history?.status || (history?.endDate ? 'Completed' : 'Active'));
    }
  }, [history]);

  const updateHistoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/members/${memberId}/history/${history.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update history');
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !startDate) return;
    
    setIsSubmitting(true);
    try {
      await updateHistoryMutation.mutateAsync({
        role,
        startDate,
        endDate: endDate || null,
        status,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Client History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Input
              id="client"
              value={clientName}
              disabled
              className="bg-gray-50 dark:bg-gray-800"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Role in this client engagement"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting || !role || !startDate}>
            {isSubmitting ? 'Updating...' : 'Update History'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}