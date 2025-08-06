import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { DateInput } from '@/components/ui/date-input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ProfilePictureUpload } from '@/components/ui/profile-picture-upload';
import { ChevronLeft, User, MapPin, Calendar, Briefcase, Mail, Edit, Save, Camera, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/modals/confirm-dialog';
import { MemberWithSkills } from '@shared/schema';
import { getCurrentClientName } from '@/lib/client-utils';
import { formatDateForDisplay } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/constants';

// Profile tab components
import AssignmentsTab from '@/components/profile/assignments-tab';
import RolesTab from '@/components/profile/roles-tab';
import AppreciationsTab from '@/components/profile/appreciations-tab';
import FeedbackTab from '@/components/profile/feedback-tab';
import ClientHistoryTab from '@/components/profile/client-history-tab';
import SkillsTab from '@/components/profile/skills-tab';
import OpportunitiesTab from '@/components/profile/opportunities-tab';

export default function MemberView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMember, setEditedMember] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All queries must be at the top level
  const { data: members, isLoading } = useQuery({
    queryKey: ['/api/members'],
  });

  const { data: clients = [] } = useQuery({ queryKey: ['/api/clients'] });
  const { data: categories = [] } = useQuery({ queryKey: ['/api/categories'] });
  const { data: locations = [] } = useQuery({ queryKey: ['/api/locations'] });

  // Find the specific member from the members list
  const allMembers = Array.isArray(members) ? members as MemberWithSkills[] : [];
  const member = allMembers.find((m: MemberWithSkills) => m.id === parseInt(id || '0'));

  // Mutation for updating member data
  const updateMemberMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const response = await apiRequest('PATCH', `/api/members/${id}`, updatedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setIsEditing(false);
      setEditedMember(null);
      toast({
        title: 'Success',
        description: 'Member profile updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member profile',
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting member
  const deleteMemberMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analytics/stats'] });
      toast({
        title: 'Success',
        description: 'Member deleted successfully',
      });
      setLocation('/members');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete member',
        variant: 'destructive',
      });
    },
  });

  // Initialize edited member data when entering edit mode
  const startEditing = () => {
    setEditedMember({
      name: member?.name || '',
      email: member?.email || '',
      hireDate: member?.hireDate || '',
      categoryId: member?.categoryId || null,
      locationId: member?.locationId || null,
      profilePicture: member?.profilePicture || null,
    });
    setIsEditing(true);
  };

  // Handle form submission
  const handleUpdate = () => {
    if (!editedMember) return;
    updateMemberMutation.mutate(editedMember);
  };

  // Handle creating new category
  const handleCreateCategory = async (name: string): Promise<{ id: number; name: string }> => {
    try {
      const response = await apiRequest('POST', '/api/categories', { name, description: `${name} category` });
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      return { id: data.id, name: data.name };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Handle creating new location
  const handleCreateLocation = async (name: string): Promise<{ id: number; name: string }> => {
    try {
      const response = await apiRequest('POST', '/api/locations', { name, description: `${name} location` });
      const data = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
      return { id: data.id, name: data.name };
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create location',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Early returns after all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading member details...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-500">Member not found</div>
      </div>
    );
  }

  // Use member data directly since it includes profile information
  const memberProfile = member?.profile;
  
  // Get active client from client history
  const getActiveClient = () => {
    if (!memberProfile?.clientHistory || !Array.isArray(memberProfile.clientHistory)) {
      return 'Not assigned';
    }
    
    const activeHistory = memberProfile.clientHistory.find((history: any) => 
      history.status === 'Active' || (!history.endDate && history.startDate)
    );
    
    if (!activeHistory) return 'Not assigned';
    
    const client = Array.isArray(clients) ? clients.find((c: any) => c.id === activeHistory.clientId) : null;
    return client?.name || 'Unknown Client';
  };
  
  const currentClient = getActiveClient();
  const categoryName = Array.isArray(categories) ? categories.find((c: any) => c.id === member.categoryId)?.name || 'Not assigned' : 'Not assigned';
  const locationName = Array.isArray(locations) ? locations.find((l: any) => l.id === member.locationId)?.name || 'Not assigned' : 'Not assigned';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/members')}
          className="mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Members
        </Button>

        {/* Editable Profile Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Member Profile</CardTitle>
              {!isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={startEditing} variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button 
                    onClick={() => setShowDeleteDialog(true)} 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:border-red-700 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleUpdate} 
                    size="sm"
                    disabled={updateMemberMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateMemberMutation.isPending ? 'Updating...' : 'Update'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedMember(null);
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-20 h-20 flex-shrink-0">
                  <AvatarImage 
                    src={isEditing ? (editedMember?.profilePicture || member.profilePicture) : member.profilePicture || undefined} 
                    alt={member.name || 'Profile'} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-semibold">
                    {getInitials(member.name || '')}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          alert('Please select an image file');
                          return;
                        }
                        
                        // Validate file size (max 2MB)
                        if (file.size > 2 * 1024 * 1024) {
                          alert('Image size must be less than 2MB');
                          return;
                        }
                        
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          setEditedMember({...editedMember, profilePicture: base64});
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                      id="profile-picture-input"
                    />
                    <Label 
                      htmlFor="profile-picture-input"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Change Photo
                    </Label>
                  </div>
                )}
              </div>
              <div className="flex-1">
                {!isEditing ? (
                  <>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {member.name}
                    </h1>
                    <div className="flex items-center gap-2 mb-4">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">{member.email}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editedMember?.name || ''}
                          onChange={(e) => setEditedMember({...editedMember, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editedMember?.email || ''}
                          onChange={(e) => setEditedMember({...editedMember, email: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Current Client</span>
                    </div>
                    <p className="text-blue-800 dark:text-blue-200 font-semibold">{currentClient}</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">Category</span>
                    </div>
                    {!isEditing ? (
                      <p className="text-green-800 dark:text-green-200 font-semibold">{categoryName}</p>
                    ) : (
                      <CreatableSelect
                        options={Array.isArray(categories) ? categories.map((c: any) => ({ id: c.id, name: c.name })) : []}
                        value={editedMember?.categoryId}
                        onSelect={(value) => setEditedMember({...editedMember, categoryId: value})}
                        onCreate={handleCreateCategory}
                        placeholder="Select category..."
                      />
                    )}
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Location</span>
                    </div>
                    {!isEditing ? (
                      <p className="text-purple-800 dark:text-purple-200 font-semibold">{locationName}</p>
                    ) : (
                      <CreatableSelect
                        options={Array.isArray(locations) ? locations.map((l: any) => ({ id: l.id, name: l.name })) : []}
                        value={editedMember?.locationId}
                        onSelect={(value) => setEditedMember({...editedMember, locationId: value})}
                        onCreate={handleCreateLocation}
                        placeholder="Select location..."
                      />
                    )}
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Hire Date</span>
                    </div>
                    {!isEditing ? (
                      <p className="text-orange-800 dark:text-orange-200 font-semibold">
                        {member.hireDate ? formatDateForDisplay(member.hireDate) : 'Not set'}
                      </p>
                    ) : (
                      <DateInput
                        value={editedMember?.hireDate || ''}
                        onChange={(value) => setEditedMember({...editedMember, hireDate: value})}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content Section */}
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <Tabs defaultValue="skills" className="space-y-6">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="appreciations">Appreciations</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="history">Client History</TabsTrigger>
              </TabsList>

              <TabsContent value="skills" className="mt-6">
                <SkillsTab member={member} />
              </TabsContent>

              <TabsContent value="opportunities" className="mt-6">
                <OpportunitiesTab member={member} />
              </TabsContent>

              <TabsContent value="assignments" className="mt-6">
                <AssignmentsTab member={member} clients={clients as any[]} />
              </TabsContent>

              <TabsContent value="roles" className="mt-6">
                <RolesTab member={member} clients={clients as any[]} />
              </TabsContent>

              <TabsContent value="appreciations" className="mt-6">
                <AppreciationsTab member={member} clients={clients as any[]} />
              </TabsContent>

              <TabsContent value="feedback" className="mt-6">
                <FeedbackTab member={member} clients={clients as any[]} />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <ClientHistoryTab member={member} clients={clients as any[]} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Profile Edit Section */}

      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => {
          setShowDeleteDialog(false);
          deleteMemberMutation.mutate();
        }}
        title="Delete Member"
        description={`Are you sure you want to delete ${member?.name}? This action cannot be undone and will permanently remove all their data including skills, assignments, roles, feedback, and work history.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}