import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import apiFetch from "@/lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff" | "admin";
  matricNo?: string;
  staffId?: string;
}

interface StaffRegistrationProps {
  onRegister: (user: User) => void;
  onBack: () => void;
}

export const StaffRegistration = ({
  onRegister,
  onBack,
}: StaffRegistrationProps) => {
  const [formData, setFormData] = useState({
    name: "",
    staffId: "",
    email: "",
    password: "",
    confirmPassword: "",
    department: "",
    position: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const departments = [
    "Computer Science",
    "Information Technology",
    "Software Engineering",
    "Business Administration",
    "Economics",
    "Accounting",
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Mass Communication",
    "English",
    "Political Science",
    "Administration",
    "Security",
    "ICT Services",
    "Library",
  ];

  const positions = [
    "Professor",
    "Associate Professor",
    "Senior Lecturer",
    "Lecturer",
    "Assistant Lecturer",
    "Administrative Officer",
    "ICT Officer",
    "Security Officer",
    "Librarian",
    "Technical Officer",
  ];

  const departmentToOfficeId: Record<string, string> = {
    "Computer Science": "ICT",
    "Information Technology": "ICT",
    "Software Engineering": "ICT",
    "Business Administration": "ADMIN",
    Economics: "ADMIN",
    Accounting: "ADMIN",
    "Civil Engineering": "ADMIN",
    "Mechanical Engineering": "ADMIN",
    "Electrical Engineering": "ADMIN",
    "Mass Communication": "STUDENT",
    English: "STUDENT",
    "Political Science": "STUDENT",
    Administration: "ADMIN",
    Security: "SECURITY",
    "ICT Services": "ICT",
    Library: "LIBRARY",
  };

  const generateStaffId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(Math.random() * 9000) + 1000;
    return `CUSTAFF${year}${randomNum}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!formData.email.endsWith("@covenantuniversity.edu.ng")) {
        throw new Error("Email must end with @covenantuniversity.edu.ng");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Generate staff ID if not provided
      const staffId = formData.staffId || generateStaffId();

      // Map department to officeId
      const officeId = departmentToOfficeId[formData.department] || "ADMIN";

      const response = await apiFetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          role: "staff",
          email: formData.email,
          password: formData.password,
          staffId, // Use generated or provided staff ID
          officeId, // mapped from department
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed");
      }

      const newUser: User = {
        id: data.user_id, // Use the UUID from backend
        name: formData.name,
        email: formData.email,
        role: "staff",
        staffId, // Include the staff ID
      };

      toast({
        title: "Registration Successful",
        description: "Your staff account has been created successfully!",
      });

      onRegister(newUser);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your information",
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="staffId">Staff ID</Label>
          <Input
            id="staffId"
            value={formData.staffId}
            onChange={(e) =>
              setFormData({ ...formData, staffId: e.target.value })
            }
            placeholder="Leave blank to auto-generate (e.g., CUSTAFF23XXXX)"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Staff ID will be auto-generated if left blank
          </p>
        </div>

        <div>
          <Label htmlFor="email">Staff Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="yourname@covenantuniversity.edu.ng"
            required
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Must end with @covenantuniversity.edu.ng
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="department">Department</Label>
            <Select
              value={formData.department}
              onValueChange={(value) =>
                setFormData({ ...formData, department: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="position">Position</Label>
            <Select
              value={formData.position}
              onValueChange={(value) =>
                setFormData({ ...formData, position: value })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
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
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
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
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
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
          {loading ? "Creating Account..." : "Create Staff Account"}
        </Button>
      </form>
    </div>
  );
};
