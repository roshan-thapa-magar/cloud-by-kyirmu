"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Phone, Lock, ArrowRight, Shield } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (cleaned.length < 10) {
      setPhoneError("Phone number must be at least 10 digits");
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    validatePhone(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone) || !validatePassword(password)) {
      return;
    }

    setLoading(true);

    // Ensure phone starts with +977
    let formattedPhone = phone;
    if (!formattedPhone.startsWith("+977")) {
      formattedPhone = "+977" + formattedPhone.replace(/^0/, "");
    }

    const res = await signIn("credentials", {
      phone: formattedPhone,
      password,
      redirect: false,
    });

    if (res?.error) {
      toast.error(res.error);
      setLoading(false);
    } else {
      // toast.success("Login successful! Redirecting...");
      router.push("/owner");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 shadow-2xl border-0">
        <CardContent className="grid p-0 md:grid-cols-2 min-h-[650px]">
          
          {/* Left Image - Enhanced */}
          <div className="relative hidden md:block bg-gradient-to-br from-primary/90 to-primary/40">
            <div className="absolute inset-0 bg-black/20 z-10" />
            <Image
              src="/images/login.png"
              alt="Login Illustration"
              fill
              className="object-cover mix-blend-overlay"
              priority
            />
            
            {/* Overlay Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 z-20 text-white">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-bold leading-tight">
                  Secure Access to Your Business
                </h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  Manage your properties, track bookings, and grow your business with our comprehensive dashboard.
                </p>
                
                {/* Trust Indicators */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50" />
                    ))}
                  </div>
                  {/* <p className="text-xs text-white/70">
                    Trusted by 1000+ property owners
                  </p> */}
                </div>
              </div>
            </div>
          </div>

          {/* Form - Enhanced */}
          <form onSubmit={handleLogin} className="p-8 md:p-10 flex flex-col justify-center h-full bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50">
            <div className="flex flex-col gap-8">
              
              {/* Header with decorative elements */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Secure Login Portal
                </div>
                
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground text-sm">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number
                </Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <span className="text-sm text-muted-foreground font-medium">+977</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => validatePhone(phone)}
                    className={cn(
                      "pl-16 h-12 text-base transition-all duration-200",
                      phoneError 
                        ? "border-red-500 focus-visible:ring-red-500/20" 
                        : phone && !phoneError
                        ? "border-green-500 focus-visible:ring-green-500/20"
                        : ""
                    )}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <span className="text-red-500">•</span>
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    onBlur={() => validatePassword(password)}
                    className={cn(
                      "h-12 text-base pr-12 transition-all duration-200",
                      passwordError 
                        ? "border-red-500 focus-visible:ring-red-500/20" 
                        : password && !passwordError
                        ? "border-green-500 focus-visible:ring-green-500/20"
                        : ""
                    )}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors p-1"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                
                {passwordError && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <span className="text-red-500">•</span>
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </Button>

              {/* Quick Tips */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/30"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Quick Tips
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-medium text-primary mb-1">📱 Phone Format</p>
                  <p className="text-muted-foreground">Use 98XXXXXXXX or +97798XXXXXXXX</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="font-medium text-primary mb-1">🔒 Security</p>
                  <p className="text-muted-foreground">We never share your credentials</p>
                </div>
              </div>

              {/* Demo Credentials - Optional, remove if not needed */}
              <p className="text-xs text-center text-muted-foreground mt-2">
                Demo: Use 9812345678 / password123
              </p>
            </div>
          </form>

        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-balance text-center text-xs text-muted-foreground [&_a]:hover:underline [&_a]:underline-offset-4 [&_a]:text-primary">
        By signing in, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}