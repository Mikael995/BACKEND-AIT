import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type RoleLevel = 'level_1' | 'level_2' | 'level_3' | 'moderator' | 'administrator' | 'owner';

export interface UserRole {
  id: string;
  user_id: string;
  role_level: RoleLevel;
  assigned_by: string | null;
  created_at: string;
}

const ROLE_HIERARCHY: Record<RoleLevel, number> = {
  level_1: 1,
  level_2: 2,
  level_3: 3,
  moderator: 4,
  administrator: 5,
  owner: 6,
};

export function useUserRole() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user,
  });

  const roleLevel = query.data?.role_level ?? 'level_1';
  const roleNumber = ROLE_HIERARCHY[roleLevel];

  const isModerator = roleNumber >= 4;
  const isAdmin = roleNumber >= 5;
  const isOwner = roleNumber >= 6;

  const canModerate = isModerator;
  const canManageUsers = isAdmin;
  const canManageEvents = isAdmin;
  const canSendBroadcasts = isAdmin;
  const canManageAdmins = isOwner;
  const canAccessSettings = isOwner;

  return {
    ...query,
    roleLevel,
    roleNumber,
    isModerator,
    isAdmin,
    isOwner,
    canModerate,
    canManageUsers,
    canManageEvents,
    canSendBroadcasts,
    canManageAdmins,
    canAccessSettings,
  };
}

export function getRoleName(level: RoleLevel): string {
  const names: Record<RoleLevel, string> = {
    level_1: 'Member',
    level_2: 'Member II',
    level_3: 'Member III',
    moderator: 'Moderator',
    administrator: 'Administrator',
    owner: 'Owner',
  };
  return names[level];
}

export function getRoleColor(level: RoleLevel): string {
  const colors: Record<RoleLevel, string> = {
    level_1: 'bg-muted text-muted-foreground',
    level_2: 'bg-muted text-muted-foreground',
    level_3: 'bg-secondary/20 text-secondary',
    moderator: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    administrator: 'bg-primary/20 text-primary',
    owner: 'bg-gold/20 text-yellow-700 dark:text-yellow-300',
  };
  return colors[level];
}
