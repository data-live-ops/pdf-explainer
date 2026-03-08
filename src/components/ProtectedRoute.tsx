import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from './ui/Spinner';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);

  useEffect(() => {
    // Check if URL contains OAuth callback params
    const hasAuthParams =
      location.hash.includes('access_token') ||
      location.hash.includes('error') ||
      location.search.includes('code=');

    if (hasAuthParams) {
      setIsProcessingCallback(true);
      // Give Supabase time to process the callback
      const timer = setTimeout(() => {
        setIsProcessingCallback(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Show loading while auth is initializing or processing OAuth callback
  if (loading || isProcessingCallback) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
