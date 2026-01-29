import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole, getRoleName } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  Bell, 
  Settings,
  Newspaper,
  LogOut,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { roleLevel, isAdmin, isModerator, isLoading: roleLoading } = useUserRole();

  if (profileLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0].toUpperCase() || '?';

  const quickLinks = [
    { icon: Users, label: 'Member Directory', href: '/members', description: 'Connect with community members' },
    { icon: Calendar, label: 'Events', href: '/events', description: 'Upcoming community events' },
    { icon: MessageSquare, label: 'Messages', href: '/messages', description: 'Your conversations' },
    { icon: Newspaper, label: 'News', href: '/news', description: 'Latest community updates' },
    { icon: Bell, label: 'Notifications', href: '/notifications', description: 'View your alerts' },
    { icon: Settings, label: 'Profile Settings', href: '/profile', description: 'Update your profile' },
  ];

  const adminLinks = [
    { icon: Users, label: 'User Management', href: '/admin/users', description: 'Manage community members' },
    { icon: Calendar, label: 'Event Management', href: '/admin/events', description: 'Create and manage events' },
    { icon: Newspaper, label: 'News Management', href: '/admin/news', description: 'Publish announcements' },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary">Ivorian in Texas</h1>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {getRoleName(roleLevel)}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, {profile?.full_name || 'Member'}!
          </h2>
          <p className="text-muted-foreground">
            Stay connected with your Ivorian community in Texas.
          </p>
        </div>

        {/* Quick Links Grid */}
        <div className="mb-8">
          <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{link.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{link.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Admin Section */}
        {(isAdmin || isModerator) && (
          <div>
            <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-1 text-sm text-primary">Admin</span>
              Admin Tools
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminLinks.map((link) => (
                <Link key={link.href} to={link.href}>
                  <Card className="h-full border-primary/20 transition-all hover:border-primary/50 hover:shadow-md">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <link.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{link.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{link.description}</CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
