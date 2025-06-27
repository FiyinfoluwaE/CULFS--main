
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'staff' | 'admin';
  matricNo?: string;
  staffId?: string;
}

interface StudentRegistrationProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

export const StudentRegistration = ({ onRegister, onBack }: StudentRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: '',
    matricNo: '',
    regNo: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    level: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    'Computer Science', 'Information Technology', 'Software Engineering',
    'Business Administration', 'Economics', 'Accounting',
    'Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering',
    'Mass Communication', 'English', 'Political Science'
  ];

  const levels = ['100', '200', '300', '400', '500'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.email.endsWith('@stu.cu.edu.ng')) {
        throw new Error('Email must end with @stu.cu.edu.ng');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Simulate API call
      // await new Promise(resolve => setTimeout(resolve, 1500));

      // const newUser: User = {
      //   id: `student-${Date.now()}`,
      //   name: formData.name,
      //   email: formData.email,
      //   role: 'student',
      //   matricNo: formData.matricNo
      // };
const response = await fetch('http://localhost:5000/api/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formData.name,
    role: 'student',
    credentials: formData.regNo, // optional: university_credentials
    email: formData.email,
    password: formData.password,
    matricNo: formData.matricNo,
    department: formData.department,
    level: formData.level,
  }),
});

const data = await response.json();

if (!response.ok || !data.success) {
  throw new Error(data.message || 'Registration failed');
}

const newUser: User = {
  id: data.user_id,
  name: formData.name,
  email: formData.email,
  role: 'student',
  matricNo: formData.matricNo,
};

      toast({
        title: "Registration Successful",
        description: "Your student account has been created successfully!",
      });

      onRegister(newUser);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Please check your information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Login
      </Button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter your full name"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="matricNo">Matric Number</Label>
            <Input
              id="matricNo"
              value={formData.matricNo}
              onChange={(e) => setFormData({...formData, matricNo: e.target.value})}
              placeholder="e.g., 16CU123456"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="regNo">Registration Number</Label>
            <Input
              id="regNo"
              value={formData.regNo}
              onChange={(e) => setFormData({...formData, regNo: e.target.value})}
              placeholder="Enter reg number"
              required
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Student Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            placeholder="yourname@stu.cu.edu.ng"
            required
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Must end with @stu.cu.edu.ng</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => setFormData({...formData, department: value})}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="level">Level</Label>
            <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level}>{level} Level</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Enter password"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              placeholder="Confirm password"
              required
              className="mt-1"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Student Account'}
        </Button>
      </form>
    </div>
  );
};
