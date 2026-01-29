import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile';
import { useUserRole, getRoleName, getRoleColor } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Camera, Loader2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { roleLevel } = useUserRole();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    location: '',
    phone: '',
  });

  // Update form when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfile.mutateAsync(formData);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await uploadAvatar.mutateAsync(file);
      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been changed.',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload your avatar. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Profile Settings</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>
              Update your personal information and profile picture.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Avatar Section */}
            <div className="mb-8 flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                  disabled={uploadAvatar.isPending}
                >
                  {uploadAvatar.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-medium">{profile?.full_name || 'Member'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <Badge className={`mt-2 ${getRoleColor(roleLevel)}`}>
                  {getRoleName(roleLevel)}
                </Badge>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || profile?.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio || profile?.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location || profile?.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Houston, TX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone || profile?.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>

              <Button type="submit" disabled={updateProfile.isPending} className="w-full">
                {updateProfile.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
