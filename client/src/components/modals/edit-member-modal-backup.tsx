import { useState } from 'react';
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

// Forward declare form components
function AddSkillForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
  });

  const addSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/members/${memberId}/skills`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      onSuccess();
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
  );
}

function AddAssignmentForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
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
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignments: data
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !project || !startDate) return;
    
    setIsSubmitting(true);
    try {
      const newAssignment = {
        clientId: parseInt(clientId),
        project,
        status,
        startDate,
        endDate: endDate || null,
      };
      
      await addAssignmentMutation.mutateAsync([newAssignment]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

function AddRoleForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          roles: data
        }),
      });
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
      const newRole = {
        title,
        description,
      };
      
      await addRoleMutation.mutateAsync([newRole]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

function AddAppreciationForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
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
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          appreciations: data
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !text) return;
    
    setIsSubmitting(true);
    try {
      const newAppreciation = {
        clientId: parseInt(clientId),
        text,
        rating,
        date,
      };
      
      await addAppreciationMutation.mutateAsync([newAppreciation]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

function AddFeedbackForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackComments: data
        }),
      });
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
      const newFeedback = {
        text,
        date,
      };
      
      await addFeedbackMutation.mutateAsync([newFeedback]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

function AddHistoryForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
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
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          clientHistory: data
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !role || !startDate) return;
    
    setIsSubmitting(true);
    try {
      const newHistory = {
        clientId: parseInt(clientId),
        role,
        startDate,
        endDate: endDate || null,
        status,
      };
      
      await addHistoryMutation.mutateAsync([newHistory]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

interface EditMemberModalProps {
  member: MemberWithSkills;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function EditMemberModal({ member, trigger, open: externalOpen, onOpenChange }: EditMemberModalProps) {
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
  // Don't render if member is undefined
  if (!member) {
    return null;
  }

  const [formData, setFormData] = useState({
    name: member.name || '',
    email: member.email || '',
    category: member.category || '',
    location: member.location || ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients data
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ['/api/clients']
  });

  // Pagination logic with descending sort
  const filteredSkills = member.skills?.filter(skill => 
    skill.skill?.name?.toLowerCase().includes('')
  ) || [];
  const totalSkillPages = Math.ceil(filteredSkills.length / skillsPerPage);
  const skillStartIndex = (currentSkillPage - 1) * skillsPerPage;
  const paginatedSkills = filteredSkills.slice(skillStartIndex, skillStartIndex + skillsPerPage);

  // Sort and paginate assignments by newest first
  const sortedAssignments = (member.profile?.assignments || [])
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const totalAssignmentPages = Math.ceil(sortedAssignments.length / itemsPerPage);
  const assignmentStartIndex = (currentAssignmentPage - 1) * itemsPerPage;
  const paginatedAssignments = sortedAssignments.slice(assignmentStartIndex, assignmentStartIndex + itemsPerPage);

  // Sort and paginate roles by title
  const sortedRoles = (member.profile?.roles || [])
    .sort((a, b) => (b.title || '').localeCompare(a.title || ''));
  const totalRolePages = Math.ceil(sortedRoles.length / itemsPerPage);
  const roleStartIndex = (currentRolePage - 1) * itemsPerPage;
  const paginatedRoles = sortedRoles.slice(roleStartIndex, roleStartIndex + itemsPerPage);

  // Sort and paginate appreciations by newest first
  const sortedAppreciations = (member.profile?.appreciations || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalAppreciationPages = Math.ceil(sortedAppreciations.length / itemsPerPage);
  const appreciationStartIndex = (currentAppreciationPage - 1) * itemsPerPage;
  const paginatedAppreciations = sortedAppreciations.slice(appreciationStartIndex, appreciationStartIndex + itemsPerPage);

  // Sort and paginate feedback by newest first
  const sortedFeedback = (member.profile?.feedbackComments || [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalFeedbackPages = Math.ceil(sortedFeedback.length / itemsPerPage);
  const feedbackStartIndex = (currentFeedbackPage - 1) * itemsPerPage;
  const paginatedFeedback = sortedFeedback.slice(feedbackStartIndex, feedbackStartIndex + itemsPerPage);

  // Sort and paginate history by newest first
  const sortedHistory = (member.profile?.clientHistory || [])
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const totalHistoryPages = Math.ceil(sortedHistory.length / itemsPerPage);
  const historyStartIndex = (currentHistoryPage - 1) * itemsPerPage;
  const paginatedHistory = sortedHistory.slice(historyStartIndex, historyStartIndex + itemsPerPage);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberMutation.mutate(formData);
  };

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
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="appreciations">Appreciations</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
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
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
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
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalSkillPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {skillStartIndex + 1} to {Math.min(skillStartIndex + skillsPerPage, filteredSkills.length)} of {filteredSkills.length} skills
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentSkillPage(Math.max(1, currentSkillPage - 1))}
                          disabled={currentSkillPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
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
                          <div>
                            <div className="font-medium">{assignment.title || 'Untitled Assignment'}</div>
                            <div className="text-sm text-muted-foreground">{assignment.description || 'No description'}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Client: {getClientNameFromId(assignment.clientId, clients)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assignment.startDate} - {assignment.endDate || 'Present'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={assignment.status === "Active" ? "default" : "secondary"}>
                              {assignment.status || "Unknown"}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalAssignmentPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {assignmentStartIndex + 1} to {Math.min(assignmentStartIndex + itemsPerPage, sortedAssignments.length)} of {sortedAssignments.length} assignments
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentAssignmentPage(Math.max(1, currentAssignmentPage - 1))}
                          disabled={currentAssignmentPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
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
                          {((appreciation as any).rating || appreciation.rating) && (
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < ((appreciation as any).rating || appreciation.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                  fill={i < ((appreciation as any).rating || appreciation.rating || 0) ? 'currentColor' : 'none'}
                                />
                              ))}
                            </div>
                          )}
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
                          <p className="text-sm">{(feedback as any).text || feedback.comment}</p>
                          <div className="text-xs text-muted-foreground mt-2">
                            {new Date(feedback.date).toLocaleDateString()}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalHistoryPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        Showing {historyStartIndex + 1} to {Math.min(historyStartIndex + itemsPerPage, sortedHistory.length)} of {sortedHistory.length} history
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentHistoryPage(Math.max(1, currentHistoryPage - 1))}
                          disabled={currentHistoryPage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium">
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
      
      {/* Add Skill Modal */}
      <Dialog open={showAddSkillModal} onOpenChange={setShowAddSkillModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill to {member.name}</DialogTitle>
          </DialogHeader>
          <AddSkillForm 
            memberId={member.id} 
            onSuccess={() => {
              setShowAddSkillModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/members'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Assignment Modal */}
      <Dialog open={showAddAssignmentModal} onOpenChange={setShowAddAssignmentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Assignment to {member.name}</DialogTitle>
          </DialogHeader>
          <AddAssignmentForm 
            memberId={member.id} 
            onSuccess={() => {
              setShowAddAssignmentModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/members'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Role Modal */}
      <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role to {member.name}</DialogTitle>
          </DialogHeader>
          <AddRoleForm 
            memberId={member.id} 
            onSuccess={() => {
              setShowAddRoleModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/members'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Appreciation Modal */}
      <Dialog open={showAddAppreciationModal} onOpenChange={setShowAddAppreciationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client Appreciation for {member.name}</DialogTitle>
          </DialogHeader>
          <AddAppreciationForm 
            memberId={member.id} 
            onSuccess={() => {
              setShowAddAppreciationModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/members'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add Feedback Modal */}
      <Dialog open={showAddFeedbackModal} onOpenChange={setShowAddFeedbackModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback for {member.name}</DialogTitle>
          </DialogHeader>
          <AddFeedbackForm 
            memberId={member.id} 
            onSuccess={() => {
              setShowAddFeedbackModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/members'] });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Add History Modal */}
      <Dialog open={showAddHistoryModal} onOpenChange={setShowAddHistoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client History for {member.name}</DialogTitle>
          </DialogHeader>
          <AddHistoryForm 
            memberId={member.id} 
            onSuccess={() => {
              setShowAddHistoryModal(false);
              queryClient.invalidateQueries({ queryKey: ['/api/members'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Add Skill Form Component
function AddSkillForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
  const [skillId, setSkillId] = useState('');
  const [level, setLevel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: skills } = useQuery({
    queryKey: ['/api/skills'],
  });

  const addSkillMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/members/${memberId}/skills`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      onSuccess();
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
  );
}

// Add Assignment Form Component
function AddAssignmentForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
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
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          assignments: data
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !project || !startDate) return;
    
    setIsSubmitting(true);
    try {
      const newAssignment = {
        clientId: parseInt(clientId),
        project,
        status,
        startDate,
        endDate: endDate || null,
      };
      
      await addAssignmentMutation.mutateAsync([newAssignment]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

// Add Role Form Component
function AddRoleForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addRoleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          roles: data
        }),
      });
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
      const newRole = {
        title,
        description,
      };
      
      await addRoleMutation.mutateAsync([newRole]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

// Add Appreciation Form Component
function AddAppreciationForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
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
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          appreciations: data
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !text) return;
    
    setIsSubmitting(true);
    try {
      const newAppreciation = {
        clientId: parseInt(clientId),
        text,
        rating,
        date,
      };
      
      await addAppreciationMutation.mutateAsync([newAppreciation]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

// Add Feedback Form Component
function AddFeedbackForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          feedbackComments: data
        }),
      });
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
      const newFeedback = {
        text,
        date,
      };
      
      await addFeedbackMutation.mutateAsync([newFeedback]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}

// Add History Form Component
function AddHistoryForm({ memberId, onSuccess }: { memberId: number; onSuccess: () => void }) {
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
      return apiRequest(`/api/members/${memberId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify({
          clientHistory: data
        }),
      });
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !role || !startDate) return;
    
    setIsSubmitting(true);
    try {
      const newHistory = {
        clientId: parseInt(clientId),
        role,
        startDate,
        endDate: endDate || null,
        status,
      };
      
      await addHistoryMutation.mutateAsync([newHistory]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
  );
}