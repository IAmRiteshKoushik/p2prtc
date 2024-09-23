import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

export function LoginCard() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleSignin = async () => {
    const request = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      })
    });
    const response = await request.json();

    if (response.status === 200) {
      console.log("Logged In");
      navigate("/main");
    } else {
      console.log("Login failed");
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" onChange={(e) => setEmail(e.target.value)} type="email" placeholder="johnromero@example.com" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" onChange={(e) => setPassword(e.target.value)} type="password" placeholder="shh! Secret password here!" required />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleSignin}>Sign in</Button>
      </CardFooter>
    </Card>
  );
}

export function Login() {
  return (
    <div className="flex justify-center items-center w-screen h-screen">
      <LoginCard />
    </div>
  );
}
