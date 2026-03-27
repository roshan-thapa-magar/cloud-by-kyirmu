"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check, Eye, EyeOff, Lock, Phone, ChevronRight, Shield, Smartphone, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Step = "phone" | "otp" | "password" | "success";

export default function PasswordResetFlow() {
  const [currentStep, setCurrentStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isLoading, setIsLoading] = useState(false);

  // Error states
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  // OTP verified flag
  const [otpVerified, setOtpVerified] = useState(false);

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Countdown for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === "otp" && resendTimer > 0) {
      timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendTimer]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 8) strength += 1;
    if (/[A-Z]/.test(newPassword)) strength += 1;
    if (/[a-z]/.test(newPassword)) strength += 1;
    if (/[0-9]/.test(newPassword)) strength += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength += 1;
    setPasswordStrength(strength);
  }, [newPassword]);

  // Validation functions
  const validatePhone = (value: string) => {
    if (!value) { setPhoneError("Phone number is required."); return false; }
    if (!/^\+?\d{10,15}$/.test(value)) { setPhoneError("Enter a valid phone number with country code."); return false; }
    setPhoneError(null); return true;
  };

  const validateOtp = () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) { setOtpError("OTP must be 6 digits."); return false; }
    setOtpError(null); return true;
  };

  const validateNewPassword = (value: string) => {
    if (value.length < 8) { setNewPasswordError("Password must be at least 8 characters."); return false; }
    if (!/[A-Z]/.test(value) || !/[a-z]/.test(value) || !/[0-9]/.test(value)) {
      setNewPasswordError("Password must contain uppercase, lowercase, and number.");
      return false;
    }
    setNewPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (newPass: string, confirmPass: string) => {
    if (newPass !== confirmPass) { setConfirmPasswordError("Passwords do not match."); return false; }
    setConfirmPasswordError(null);
    return true;
  };

  // Input change handlers
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
    validatePhone(value);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }

    validateOtp();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    validateNewPassword(value);
    if (confirmPassword) validateConfirmPassword(value, confirmPassword);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    validateConfirmPassword(newPassword, value);
  };

  // API Handlers
  const handleSendCode = async () => {
    if (!validatePhone(phone)) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+977${phone}` })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentStep("otp");
        setResendTimer(60);
        setOtpVerified(false);
        toast.success("OTP sent to your WhatsApp number!");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!validateOtp()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+977${phone}`, otp: otp.join("") })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpVerified(true);
        setCurrentStep("password");
      } else {
        toast.error(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpVerified) { toast.error("Please verify OTP first."); return; }
    if (!validateNewPassword(newPassword) || !validateConfirmPassword(newPassword, confirmPassword)) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: `+977${phone}`, newPassword, otp: otp.join("") })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentStep("success");
      } else {
        toast.error(data.message || "Failed to reset password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case "phone": return <Phone className="w-5 h-5" />;
      case "otp": return <Smartphone className="w-5 h-5" />;
      case "password": return <KeyRound className="w-5 h-5" />;
      case "success": return <Check className="w-5 h-5" />;
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-green-500";
    return "bg-green-600";
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    if (passwordStrength <= 4) return "Strong";
    return "Very Strong";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Steps - Redesigned */}
          <div className="space-y-8">
            <div className="space-y-3">
              <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-4 py-1.5">
                Secure Account Recovery
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Reset Password
              </h1>
              <p className="text-muted-foreground text-lg">
                Follow the simple steps below to securely reset your password. We'll send a WhatsApp OTP for verification.
              </p>
            </div>

            <div className="space-y-6 relative">
              {/* Progress Line */}
              <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

              {["phone", "otp", "password", "success"].map((step, idx) => {
                const stepIndex = ["phone", "otp", "password", "success"].indexOf(currentStep);
                const isCompleted = idx < stepIndex;
                const isCurrent = currentStep === step;

                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={{
                          scale: isCurrent ? 1.1 : 1,
                          backgroundColor: isCompleted ? "rgb(34 197 94)" : isCurrent ? "rgb(59 130 246)" : "rgb(226 232 240)"
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
                          isCurrent ? "ring-4 ring-primary/20" : ""
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5 text-white" />
                        ) : (
                          <span className={`text-sm font-semibold ${isCurrent ? "text-white" : "text-slate-600"}`}>
                            {idx + 1}
                          </span>
                        )}
                      </motion.div>

                      <div className="pb-6">
                        <h3 className={`text-xl font-semibold mb-1 transition-colors ${
                          isCurrent ? "text-primary" : isCompleted ? "text-green-600" : "text-muted-foreground"
                        }`}>
                          {step === "phone" ? "Verify Phone Number" :
                           step === "otp" ? "Enter Verification Code" :
                           step === "password" ? "Create New Password" :
                           "Reset Complete"}
                        </h3>
                        <p className="text-muted-foreground">
                          {step === "phone"
                            ? "Enter your registered phone number to receive a verification code"
                            : step === "otp"
                              ? "Enter the 6-digit code sent to your WhatsApp"
                              : step === "password"
                                ? "Create a strong password for your account"
                                : "Your password has been successfully updated"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground bg-white/50 dark:bg-slate-900/50 p-4 rounded-xl">
              <Shield className="w-5 h-5 text-primary" />
              <span>Your information is encrypted and secure</span>
            </div>
          </div>

          {/* Right Form - Enhanced Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-2xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2">
                        {getStepIcon(currentStep)}
                        <span>
                          {currentStep === "phone" ? "Enter Phone" :
                           currentStep === "otp" ? "Verify Code" :
                           currentStep === "password" ? "New Password" :
                           "All Done!"}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-base mt-1">
                        {currentStep === "phone" ? "We'll send a verification code to your WhatsApp" :
                         currentStep === "otp" ? "Enter the 6-digit code sent to your device" :
                         currentStep === "password" ? "Create a strong password" :
                         "Your account has been updated"}
                      </CardDescription>
                    </div>
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                  {/* Phone Step */}
                  {currentStep === "phone" && (
                    <>
                      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                        <p className="text-sm flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          <span>Enter your phone number with country code (e.g., +977)</span>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-base">Phone Number</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">+977</span>
                          </div>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="98XXXXXXXX"
                            value={phone}
                            onChange={handlePhoneChange}
                            className={`pl-20 h-12 text-lg ${phoneError ? "border-red-500 ring-red-100" : ""}`}
                          />
                        </div>
                        {phoneError && (
                          <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-red-500 flex items-center gap-1"
                          >
                            <span>⚠</span> {phoneError}
                          </motion.p>
                        )}
                      </div>

                      <Button
                        onClick={handleSendCode}
                        disabled={isLoading || !phone}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending...</span>
                          </div>
                        ) : (
                          <>
                            Send Verification Code
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {/* OTP Step */}
                  {currentStep === "otp" && (
                    <>
                      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 text-center">
                        <p className="text-sm text-muted-foreground mb-1">Verification code sent to</p>
                        <p className="font-semibold text-lg flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4" />
                          {phone}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base text-center block">Enter 6-digit code</Label>
                        <div className="flex gap-2 justify-center">
                          {otp.map((digit, index) => (
                            <Input
                              key={index}
                              id={`otp-${index}`}
                              type="text"
                              inputMode="numeric"
                              value={digit}
                              onChange={(e) => handleOtpChange(index, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(index, e)}
                              className={`w-12 h-14 text-center text-2xl font-bold ${
                                otpError ? "border-red-500" : ""
                              }`}
                              maxLength={1}
                            />
                          ))}
                        </div>
                        {otpError && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-red-500 text-center"
                          >
                            {otpError}
                          </motion.p>
                        )}
                      </div>

                      <Button
                        onClick={handleVerifyCode}
                        disabled={isLoading || otp.join("").length !== 6}
                        className="w-full h-12 text-base font-semibold"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : (
                          "Verify Code"
                        )}
                      </Button>

                      <div className="text-center text-sm">
                        {resendTimer > 0 ? (
                          <p className="text-muted-foreground">
                            Resend code in <span className="font-semibold text-primary">{resendTimer}s</span>
                          </p>
                        ) : (
                          <Button
                            variant="link"
                            onClick={handleSendCode}
                            className="text-primary font-semibold"
                          >
                            Resend Code
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {/* Password Step */}
                  {currentStep === "password" && (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-base">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={handleNewPasswordChange}
                              className={`pr-10 h-12 ${newPasswordError ? "border-red-500" : ""}`}
                              placeholder="Enter new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword && (
                          <div className="space-y-2">
                            <div className="flex gap-1 h-1.5">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <div
                                  key={level}
                                  className={`flex-1 rounded-full transition-all ${
                                    level <= passwordStrength
                                      ? getStrengthColor()
                                      : "bg-gray-200 dark:bg-gray-700"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-right">
                              Strength: <span className="font-semibold">{getStrengthText()}</span>
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-base">Confirm Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              value={confirmPassword}
                              onChange={handleConfirmPasswordChange}
                              className={`pr-10 h-12 ${confirmPasswordError ? "border-red-500" : ""}`}
                              placeholder="Confirm new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        {(newPasswordError || confirmPasswordError) && (
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {newPasswordError || confirmPasswordError}
                            </p>
                          </div>
                        )}

                        {/* Password Requirements */}
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Password must contain:</p>
                          <ul className="space-y-1 text-xs text-muted-foreground">
                            <li className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? "bg-green-500" : "bg-gray-300"}`} />
                              At least 8 characters
                            </li>
                            <li className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`} />
                              One uppercase letter
                            </li>
                            <li className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${/[a-z]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`} />
                              One lowercase letter
                            </li>
                            <li className="flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(newPassword) ? "bg-green-500" : "bg-gray-300"}`} />
                              One number
                            </li>
                          </ul>
                        </div>
                      </div>

                      <Button
                        onClick={handleResetPassword}
                        disabled={isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                        className="w-full h-12 text-base font-semibold"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Resetting...</span>
                          </div>
                        ) : (
                          "Reset Password"
                        )}
                      </Button>
                    </>
                  )}

                  {/* Success Step */}
                  {currentStep === "success" && (
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      className="text-center space-y-6"
                    >
                      <div className="relative">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="absolute inset-0 animate-ping">
                          <div className="w-20 h-20 bg-green-400 rounded-full opacity-20 mx-auto" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                          Password Reset Successful!
                        </h3>
                        <p className="text-muted-foreground">
                          Your password has been updated successfully. You can now log in with your new credentials.
                        </p>
                      </div>

                      <Button
                        onClick={() => (window.location.href = "/login")}
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80"
                      >
                        Continue to Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <p className="text-xs text-muted-foreground">
                        You'll be redirected to the login page
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}