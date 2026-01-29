import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5" />
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Ivorian in Texas</h1>
          <p className="text-muted-foreground">Connecting our community</p>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
