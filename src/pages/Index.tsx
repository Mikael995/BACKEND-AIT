import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { Users, Calendar, MessageSquare, ArrowRight } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="mb-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Ivorian in Texas</h1>
          <div className="flex gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Join Now</Button>
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Connect with the{' '}
            <span className="text-primary">Ivorian Community</span>{' '}
            in Texas
          </h2>
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Join our vibrant community platform to network, attend events, share news, 
            and stay connected with fellow Ivorians across Texas.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mx-auto mt-24 grid max-w-5xl gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Member Directory</h3>
            <p className="text-sm text-muted-foreground">
              Find and connect with other Ivorians living in Texas. Build your network.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
              <Calendar className="h-7 w-7 text-secondary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Community Events</h3>
            <p className="text-sm text-muted-foreground">
              Discover and RSVP to cultural events, gatherings, and celebrations.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">Direct Messaging</h3>
            <p className="text-sm text-muted-foreground">
              Connect privately with members through our secure messaging system.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-24 max-w-2xl rounded-3xl bg-gradient-to-r from-primary to-primary/80 p-8 text-center text-primary-foreground shadow-xl sm:p-12">
          <h3 className="mb-4 text-2xl font-bold sm:text-3xl">
            Ready to join our community?
          </h3>
          <p className="mb-6 opacity-90">
            Create your account today and start connecting with the Ivorian community in Texas.
          </p>
          <Link to="/signup">
            <Button size="lg" variant="secondary" className="gap-2">
              Create Account <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 Ivorian in Texas. Connecting our community.</p>
        </div>
      </footer>
    </div>
  );
}
