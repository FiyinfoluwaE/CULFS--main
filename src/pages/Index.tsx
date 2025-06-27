
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from '@/components/auth/LoginForm';
import { StudentRegistration } from '@/components/auth/StudentRegistration';
import { StaffRegistration } from '@/components/auth/StaffRegistration';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';

type AuthMode = 'login' | 'student-register' | 'staff-register';
type UserRole = 'student' | 'staff' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  matricNo?: string;
  staffId?: string;
}

const Index = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setAuthMode('login');
  };

  if (user) {
    switch (user.role) {
      case 'student':
        return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'staff':
        return <StaffDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">CULfs</h1>
          <p className="text-xl text-purple-100">Covenant University Lost and Found System</p>
          <p className="text-purple-200 mt-2">Streamlining the process of reporting, tracking and retrieving lost items</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {authMode === 'login' && (
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription className="text-purple-100">
                  Sign in to access the Lost and Found System
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <LoginForm onLogin={handleLogin} />
                <div className="mt-6 space-y-3">
                  <p className="text-center text-gray-600 mb-4">Don't have an account?</p>
                  <Button
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => setAuthMode('student-register')}
                  >
                    Register as Student
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                    onClick={() => setAuthMode('staff-register')}
                  >
                    Register as Staff
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {authMode === 'student-register' && (
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Student Registration</CardTitle>
                <CardDescription className="text-purple-100">
                  Create your student account
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <StudentRegistration 
                  onRegister={handleLogin} 
                  onBack={() => setAuthMode('login')} 
                />
              </CardContent>
            </Card>
          )}

          {authMode === 'staff-register' && (
            <Card className="shadow-xl border-0">
              <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl">Staff Registration</CardTitle>
                <CardDescription className="text-purple-100">
                  Create your staff account
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <StaffRegistration 
                  onRegister={handleLogin} 
                  onBack={() => setAuthMode('login')} 
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Features Section */}
        {authMode === 'login' && (
          <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow border-purple-100">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-xl">📋</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Report Lost Items</h3>
                <p className="text-gray-600 text-sm">Easily report your lost items with detailed descriptions and photos</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-purple-100">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-xl">🔍</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Track Status</h3>
                <p className="text-gray-600 text-sm">Monitor the status of your reported items in real-time</p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow border-purple-100">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 text-xl">📧</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Get Notified</h3>
                <p className="text-gray-600 text-sm">Receive email notifications when your items are found</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
