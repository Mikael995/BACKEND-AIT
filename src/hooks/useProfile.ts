// src/hooks/useProfile.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  phone: string | null;
  avatar_url: string | null;
  interests: string[];
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to get the token from storage
const getAuthHeader = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json',
});

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const response = await fetch('/api/users/profile', {
        headers: getAuthHeader(),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch profile');
      }

      return response.json() as Promise<Profile>;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: getAuthHeader(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update profile');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('Not authenticated');

      // Create FormData for file upload
      const formData = new FormData();
      // 'image' matches upload.single('image') in userRoutes.ts
      formData.append('image', file);

      const response = await fetch('/api/users/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          // Note: Browser automatically sets Content-Type for FormData with boundary
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Avatar upload failed');
      
      const data = await response.json();
      // Return the URL from your Cloudinary response in the controller
      return data.avatar_url || data.url; 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
  });
}