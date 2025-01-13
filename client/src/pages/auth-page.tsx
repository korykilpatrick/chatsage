import { useForm } from "react-hook-form";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { register: registerUser, login } = useUser();
  const { toast } = useToast();
  const registerForm = useForm({
    defaultValues: {
      username: "",
      password: "",
      displayName: ""
    }
  });

  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: ""
    }
  });

  const handleRegister = async (data: any) => {
    try {
      const result = await registerUser(data);
      if (!result.ok) {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Registration failed",
        variant: "destructive"
      });
    }
  };

  const handleLogin = async (data: any) => {
    try {
      const result = await login(data);
      if (!result.ok) {
        toast({
          title: "Login failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">ChatSage</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <Input placeholder="Username" {...loginForm.register("username")} />
                <Input type="password" placeholder="Password" {...loginForm.register("password")} />
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <Input placeholder="Username" {...registerForm.register("username")} />
                <Input placeholder="Display Name" {...registerForm.register("displayName")} />
                <Input type="password" placeholder="Password" {...registerForm.register("password")} />
                <Button type="submit" className="w-full">Register</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
