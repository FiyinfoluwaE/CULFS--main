// import { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";

// interface User {
//   id: string;
//   name: string;
//   email: string;
//   role: 'student' | 'staff' | 'admin';
//   matricNo?: string;
//   staffId?: string;
// }

// interface LoginFormProps {
//   onLogin: (user: User) => void;
// }

// export const LoginForm = ({ onLogin }: LoginFormProps) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const { toast } = useToast();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // Admin login check
//       if (email === 'admin' && password === 'admin') {
//         onLogin({
//           id: 'admin-001',
//           name: 'System Administrator',
//           email: 'admin@covenantuniversity.edu.ng',
//           role: 'admin'
//         });
//         return;
//       }

//       // For demo purposes, simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // Mock user data based on email domain
//       if (email.endsWith('@stu.cu.edu.ng')) {
//         onLogin({
//           id: 'student-001',
//           name: 'John Doe',
//           email,
//           role: 'student',
//           matricNo: '16CU123456'
//         });
//       } else if (email.endsWith('@covenantuniversity.edu.ng')) {
//         onLogin({
//           id: 'staff-001',
//           name: 'Dr. Jane Smith',
//           email,
//           role: 'staff',
//           staffId: 'CU/STAFF/001'
//         });
//       } else {
//         throw new Error('Invalid email domain');
//       }

//       toast({
//         title: "Login Successful",
//         description: "Welcome to CULfs!",
//       });
//     } catch (error) {
//       toast({
//         title: "Login Failed",
//         description: "Invalid credentials or email domain",
//         variant: "destructive",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4">
//       <div>
//         <Label htmlFor="email">Email / Username</Label>
//         <Input
//           id="email"
//           type="text"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email or 'admin' for admin access"
//           required
//           className="mt-1"
//         />
//       </div>
//       <div>
//         <Label htmlFor="password">Password</Label>
//         <Input
//           id="password"
//           type="password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Enter your password"
//           required
//           className="mt-1"
//         />
//       </div>
//       <Button
//         type="submit"
//         className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
//         disabled={loading}
//       >
//         {loading ? 'Signing In...' : 'Sign In'}
//       </Button>
//     </form>
//   );
// };

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import apiFetch from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "staff" | "admin";
  matricNo?: string;
  staffId?: string;
}

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const loginMutation = useMutation<
    { success: boolean; user: User },
    Error,
    { email: string; password: string }
  >({
    mutationFn: async (creds: { email: string; password: string }) => {
      const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const json = (await res.json()) as {
        success: boolean;
        user?: User;
        message?: string;
      };
      if (!res.ok || !json.success)
        throw new Error(json.message || "Login failed");
      return { success: true, user: json.user! } as {
        success: boolean;
        user: User;
      };
    },
    onSuccess(data) {
      onLogin(data.user);
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      toast({ title: "Login Successful", description: "Welcome to CULfs!" });
    },
    onError(err: Error) {
      toast({
        title: "Login Failed",
        description: err.message,
        variant: "destructive",
      });
    },
    onSettled() {
      setLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email / Username</Label>
        <Input
          id="email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email or 'admin' for admin access"
          required
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="mt-1"
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        disabled={loading}
      >
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
};
