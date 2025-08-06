import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save, X, Plus, Award, User, Briefcase, Star, MessageSquare, Clock, Calendar } from 'lucide-react';
import { MemberWithSkills, Skill, InsertMember, Client } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getCurrentClientName } from '@/lib/client-utils';

interface EditMemberModalProps {
  member: MemberWithSkills;
  trigger?: React.ReactNode;
}

export default function EditMemberModal({ member, trigger }: EditMemberModalProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: member.name,
    email: member.email,
    category: member.category,
    location: member.location || ''
  });
  const [showAddSkillDialog, setShowAddSkillDialog] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: allSkills = [] } = useQuery<Skill[]>({
    queryKey: ['/api/skills']
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients']
  });

  // Update member mutation
  const updateMemberMutation = useMutation({
    mutationFn: async (data: Partial<InsertMember>) => {
      return await apiRequest('PATCH', `/api/members/${member.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setOpen(false);
      toast({
        title: "Success",
        description: "Member updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive"
      });
    }
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: async (data: { memberId: number; skillId: number; level: string }) => {
      return await apiRequest('POST', `/api/members/${data.memberId}/skills`, {
        skillId: data.skillId,
        level: data.level
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setShowAddSkillDialog(false);
      setSelectedSkill("");
      setSkillLevel("");
      toast({
        title: "Success",
        description: "Skill added successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add skill",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberMutation.mutate(formData);
  };

  const handleAddSkill = () => {
    if (!selectedSkill || !skillLevel || !member) return;
    
    const skillId = parseInt(selectedSkill);
    addSkillMutation.mutate({
      memberId: member.id,
      skillId,
      level: skillLevel
    });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const skills = member.skills || [];
  
  // Filter skills based on search term
  const filteredSkills = skills.filter(memberSkill =>
    memberSkill.skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (memberSkill.skill.purpose && memberSkill.skill.purpose.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSkills = filteredSkills.slice(startIndex, startIndex + itemsPerPage);

  // Available skills for adding (excluding already assigned)
  const availableSkills = allSkills.filter(skill => 
    !skills.find(memberSkill => memberSkill.skill.id === skill.id)
  );

  // Get current client name
  const currentClientName = getCurrentClientName(member.profile, clients);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit Member: {member.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="appreciations">Appreciations</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                      <SelectItem value="Guru">Guru</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={formData.stage}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid">Mid</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, availability: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Client</Label>
                <Input value={currentClientName} disabled className="bg-muted" />
                <p className="text-sm text-muted-foreground">
                  Current client is automatically determined from work history
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMemberMutation.isPending}>
                  {updateMemberMutation.isPending ? (
                    <>Saving...</>
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
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Skills Assessment</h3>
              <Button onClick={() => setShowAddSkillDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </div>

            {/* Search input */}
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search skills..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="space-y-3">
              {paginatedSkills.length > 0 ? (
                paginatedSkills.map((memberSkill) => (
                  <div key={memberSkill.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{memberSkill.skill.name}</div>
                      {memberSkill.skill.purpose && (
                        <div className="text-sm text-gray-500">{memberSkill.skill.purpose}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{memberSkill.level}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          console.log("Edit skill level for", memberSkill.skill.name);
                        }}
                      >
                        <Award className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : skills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No skills assessed yet. Click "Add Skill" to start.
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No skills found matching "{searchTerm}".
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-3 py-2 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* Add Skill Dialog */}
            {showAddSkillDialog && (
              <Dialog open={showAddSkillDialog} onOpenChange={setShowAddSkillDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Skill Assessment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Skill</Label>
                      <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSkills.map((skill) => (
                            <SelectItem key={skill.id} value={skill.id.toString()}>
                              {skill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Level</Label>
                      <Select value={skillLevel} onValueChange={setSkillLevel}>
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
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddSkillDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddSkill} disabled={addSkillMutation.isPending}>
                        {addSkillMutation.isPending ? "Adding..." : "Add Skill"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Work History</h3>
              {member.profile?.clientHistory && member.profile.clientHistory.length > 0 ? (
                <div className="space-y-2">
                  {member.profile.clientHistory.map((assignment, index) => {
                    const client = clients.find(c => c.id === assignment.clientId);
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{client?.name || 'Unknown Client'}</div>
                            <div className="text-sm text-muted-foreground">{assignment.role}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {assignment.startDate} - {assignment.endDate || 'Present'}
                            </div>
                          </div>
                          <Badge variant={assignment.endDate ? "secondary" : "default"}>
                            {assignment.endDate ? "Completed" : "Active"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground">No work history recorded</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Roles</h3>
              {member.profile?.roles && member.profile.roles.length > 0 ? (
                <div className="space-y-2">
                  {member.profile.roles.map((role, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{role.title}</div>
                      <div className="text-sm text-muted-foreground">{role.description}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {role.skills && role.skills.length > 0 ? role.skills.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="secondary">{skill}</Badge>
                        )) : (
                          <span className="text-sm text-muted-foreground">No skills specified</span>
                        )}
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
              <h3 className="text-lg font-medium">Client Appreciations</h3>
              {member.profile?.appreciations && member.profile.appreciations.length > 0 ? (
                <div className="space-y-2">
                  {member.profile.appreciations.map((appreciation, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="font-medium">{appreciation.author}</div>
                      <div className="text-sm">{appreciation.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {appreciation.date} • Rating: {appreciation.rating || 'N/A'}/5
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
              <h3 className="text-lg font-medium">Feedback & Reviews</h3>
              {member.profile?.feedback && member.profile.feedback.length > 0 ? (
                <div className="space-y-2">
                  {member.profile.feedback.map((feedback, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{feedback.reviewer}</div>
                        <Badge variant="outline">{feedback.type}</Badge>
                      </div>
                      <div className="text-sm mb-2">{feedback.content}</div>
                      <div className="text-xs text-muted-foreground">
                        {feedback.date} • Rating: {feedback.rating}/5
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No feedback recorded</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}