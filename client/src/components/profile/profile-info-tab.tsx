import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DateInput } from '@/components/ui/date-input';
import { CreatableSelect } from '@/components/ui/creatable-select';
import { Edit, Save, X } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDateForDisplay } from '@/lib/utils';
import type { MemberWithSkills } from '@shared/schema';

interface ProfileInfoTabProps {
  member: MemberWithSkills;
  categories: any[];
  locations: any[];
}

export default function ProfileInfoTab({ member, categories, locations }: ProfileInfoTabProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    categoryId: 0,
    locationId: 0,
    hireDate: ''
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/members/${member.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      setIsEditing(false);
      toast({ title: 'Success', description: 'Member updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: 'Failed to update member' });
    },
  });

  useEffect(() => {
    if (member) {
      setProfileData({
        name: member.name || '',
        email: member.email || '',
        categoryId: member.categoryId || 0,
        locationId: member.locationId || 0,
        hireDate: member.hireDate ? new Date(member.hireDate).toISOString().split('T')[0] : ''
      });
    }
  }, [member]);

  const handleSave = () => {
    const updateData = {
      name: profileData.name,
      email: profileData.email,
      categoryId: profileData.categoryId || null,
      locationId: profileData.locationId || null,
      hireDate: profileData.hireDate ? new Date(profileData.hireDate).toISOString() : null
    };
    updateMemberMutation.mutate(updateData);
  };

  const handleCancel = () => {
    setProfileData({
      name: member.name || '',
      email: member.email || '',
      categoryId: member.categoryId || 0,
      locationId: member.locationId || 0,
      hireDate: member.hireDate ? new Date(member.hireDate).toISOString().split('T')[0] : ''
    });
    setIsEditing(false);
  };

  const categoryName = categories?.find(c => c.id === member.categoryId)?.name || 'Not assigned';
  const locationName = locations?.find(l => l.id === member.locationId)?.name || 'Not assigned';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Profile Information</h3>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={updateMemberMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={handleCancel} variant="outline" size="sm">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          {isEditing ? (
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded border">{member.name}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          {isEditing ? (
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded border">{member.email}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Techie Category</Label>
          {isEditing ? (
            <CreatableSelect
              value={profileData.categoryId}
              onChange={(value) => setProfileData(prev => ({ ...prev, categoryId: value }))}
              options={categories?.map(c => ({ value: c.id, label: c.name })) || []}
              placeholder="Select category..."
              createLabel="Create category"
              onCreateNew={async (name: string) => {
                try {
                  const newCategory = await apiRequest('POST', '/api/categories', { name, description: `${name} category`, isActive: true });
                  queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
                  return newCategory.id;
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to create category' });
                  return null;
                }
              }}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded border">{categoryName}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          {isEditing ? (
            <CreatableSelect
              value={profileData.locationId}
              onChange={(value) => setProfileData(prev => ({ ...prev, locationId: value }))}
              options={locations?.map(l => ({ value: l.id, label: l.name })) || []}
              placeholder="Select location..."
              createLabel="Create location"
              onCreateNew={async (name: string) => {
                try {
                  const newLocation = await apiRequest('POST', '/api/locations', { name, description: `${name} location`, isActive: true });
                  queryClient.invalidateQueries({ queryKey: ['/api/locations'] });
                  return newLocation.id;
                } catch (error) {
                  toast({ title: 'Error', description: 'Failed to create location' });
                  return null;
                }
              }}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded border">{locationName}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="hireDate">Hire Date</Label>
          {isEditing ? (
            <DateInput
              value={profileData.hireDate}
              onChange={(value) => setProfileData(prev => ({ ...prev, hireDate: value }))}
              placeholder="DD/MM/YYYY"
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded border">
              {member.hireDate ? formatDateForDisplay(member.hireDate) : 'Not set'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}