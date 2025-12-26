"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { SafeUserWithRole, UpdateOwnProfileData } from '@/lib/types/rbac';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Save, 
  X, 
  User, 
  Mail, 
  Shield, 
  Users, 
  Calendar,
  Edit,
  Eye,
  Key
} from 'lucide-react';

interface UserProfileProps {
  user: SafeUserWithRole;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  mode: 'view' | 'edit';
  onEditMode?: () => void;
}

interface ProfileFormData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

export function UserProfile({ 
  user, 
  isOpen, 
  onClose, 
  onSuccess, 
  mode, 
  onEditMode 
}: UserProfileProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [errors, setErrors] = useState<FormErrors>({});
  
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    }
  }, [user, isOpen]);
  
  // Handle form field changes
  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation (only if changing password)
    if (formData.newPassword || formData.currentPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const updateData: UpdateOwnProfileData & { currentPassword?: string; newPassword?: string } = {
        name: formData.name.trim(),
        email: formData.email.trim(),
      };
      
      // Include password change if provided
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Failed to update profile',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Check if current user can edit this profile
  const canEdit = currentUser?.id === user.id;
  const isOwnProfile = currentUser?.id === user.id;
  
  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Get role badge variant
  const getRoleBadgeVariant = (roleName: string) => {
    switch (roleName) {
      case 'Admin/Manager':
        return 'default';
      case 'Team Leader':
        return 'secondary';
      case 'User/Employee':
        return 'outline';
      default:
        return 'outline';
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {mode === 'edit' ? 'Edit Profile' : 'User Profile'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update your profile information and password'
              : `View profile information for ${user.name}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security" disabled={!isOwnProfile || mode === 'view'}>
              Security
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            {mode === 'view' ? (
              // View Mode
              <div className="space-y-4">
                {/* Basic Information */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="font-medium">{user.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div>
                        <Badge variant={user.isActive ? "secondary" : "destructive"}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </Card>
                
                {/* Role Information */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Role & Permissions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <div>
                        {user.role ? (
                          <Badge variant={getRoleBadgeVariant(user.role.name)}>
                            {user.role.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No Role</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Team</Label>
                      <p className="font-medium">
                        {user.team ? user.team.name : 'No team assigned'}
                      </p>
                    </div>
                  </div>
                </Card>
                
                {/* Team Information */}
                {user.team && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Team Information
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Team Name</Label>
                        <p className="font-medium">{user.team.name}</p>
                      </div>
                      {user.team.description && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                          <p className="text-sm">{user.team.description}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              // Edit Mode
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* General error */}
                {errors.general && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="text-destructive text-sm">{errors.general}</p>
                  </div>
                )}
                
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-destructive text-sm">{errors.name}</p>
                  )}
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Enter your email address"
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>
                
                {/* Role and Team (read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {user.role ? (
                        <Badge variant={getRoleBadgeVariant(user.role.name)}>
                          {user.role.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No Role</Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <div className="p-2 bg-muted rounded-md">
                      <span className="text-sm">
                        {user.team ? user.team.name : 'No team assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            {mode === 'edit' && isOwnProfile && (
              <div className="space-y-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Change Password
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Leave password fields empty if you don&apos;t want to change your password.
                  </p>
                  
                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleChange('currentPassword', e.target.value)}
                        placeholder="Enter your current password"
                        disabled={loading}
                      />
                      {errors.currentPassword && (
                        <p className="text-destructive text-sm">{errors.currentPassword}</p>
                      )}
                    </div>
                    
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleChange('newPassword', e.target.value)}
                        placeholder="Enter your new password"
                        disabled={loading}
                      />
                      {errors.newPassword && (
                        <p className="text-destructive text-sm">{errors.newPassword}</p>
                      )}
                    </div>
                    
                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        placeholder="Confirm your new password"
                        disabled={loading}
                      />
                      {errors.confirmPassword && (
                        <p className="text-destructive text-sm">{errors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            {mode === 'edit' ? 'Cancel' : 'Close'}
          </Button>
          
          {mode === 'view' && canEdit && onEditMode && (
            <Button onClick={onEditMode}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
          
          {mode === 'edit' && (
            <Button onClick={handleUpdateProfile} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}