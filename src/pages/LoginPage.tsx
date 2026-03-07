import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, UserPlus, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register' | 'forgot';

export function LoginPage() {
  const { user, loading, error, signIn, signUp, resetPassword, clearError } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage(null);
    clearError();

    let success = false;

    if (mode === 'login') {
      success = await signIn(email, password);
    } else if (mode === 'register') {
      success = await signUp(email, password);
      if (success) {
        setSuccessMessage('Registration successful! Please check your email to verify your account.');
        setMode('login');
      }
    } else if (mode === 'forgot') {
      success = await resetPassword(email);
      if (success) {
        setSuccessMessage('Password reset email sent! Please check your inbox.');
        setMode('login');
      }
    }

    setSubmitting(false);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setEmail('');
    setPassword('');
    setSuccessMessage(null);
    clearError();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CoLearn PDF Explainer</h1>
          <p className="text-gray-600 mt-2">
            Analyze math, physics, and chemistry problems
          </p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              {mode === 'login' && 'Sign In'}
              {mode === 'register' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
          </CardHeader>
          <CardContent>
            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="email"
                  label="Email"
                  placeholder="name@colearn.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only @colearn.id email addresses are allowed
                </p>
              </div>

              {mode !== 'forgot' && (
                <Input
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <Spinner size="sm" className="mr-2" />
                ) : mode === 'login' ? (
                  <LogIn size={16} className="mr-2" />
                ) : mode === 'register' ? (
                  <UserPlus size={16} className="mr-2" />
                ) : (
                  <Mail size={16} className="mr-2" />
                )}
                {mode === 'login' && 'Sign In'}
                {mode === 'register' && 'Create Account'}
                {mode === 'forgot' && 'Send Reset Link'}
              </Button>
            </form>

            {/* Mode Switcher */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              {mode === 'login' && (
                <div className="space-y-2 text-center text-sm">
                  <p className="text-gray-600">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Create one
                    </button>
                  </p>
                  <p>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-gray-500 hover:text-gray-700 hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </p>
                </div>
              )}

              {mode === 'register' && (
                <p className="text-center text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}

              {mode === 'forgot' && (
                <p className="text-center text-sm text-gray-600">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
