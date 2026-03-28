// 'use client'

// import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
// import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
// import { Input } from "@/components/ui/input"
// import { useState, useEffect } from "react"
// import { Loader2, Mail, ArrowLeft, ArrowRight, User, Phone } from "lucide-react"
// import { useAuthModal } from "@/context/auth-modal-context"
// import { signIn } from "next-auth/react"
// import { toast } from "sonner"

// export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
//   const [step, setStep] = useState<0 | 1 | 2>(0)
//   const [email, setEmail] = useState("")
//   const [otp, setOtp] = useState("")
//   const [name, setName] = useState("")
//   const [phone, setPhone] = useState("")
//   const [loading, setLoading] = useState(false)
//   const [loadingGoogle, setLoadingGoogle] = useState(false)
//   const [countdown, setCountdown] = useState(60)
//   const { closeModal } = useAuthModal()

//   useEffect(() => {
//     if (step !== 1) return
//     if (countdown <= 0) return
//     const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
//     return () => clearTimeout(timer)
//   }, [countdown, step])

//   const handleSendOtp = async (e?: React.FormEvent) => {
//     e?.preventDefault()
//     if (!email) return toast("Email required")
//     setLoading(true)
//     try {
//       const res = await fetch("/api/auth/send-email-otp", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       })
//       if (!res.ok) throw new Error("Failed to send OTP")
//       setStep(1)
//       setCountdown(60)
//     } catch (err) {
//       console.error(err)
//       toast("Error sending OTP")
//     } finally { setLoading(false) }
//   }

//   const handleVerifyOtp = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!otp) return toast("Enter OTP")
//     setLoading(true)
//     try {
//       const result = await signIn("otp-login", { redirect: false, email, otp })
//       if (result?.error) {
//         if (result.error === "User not found") {
//           setStep(2)
//         } else {
//           toast(result.error)
//         }
//       } else {
//         closeModal()
//       }
//     } catch (err) {
//       console.error(err)
//       toast("OTP verification failed")
//     } finally { setLoading(false) }
//   }

//   const handleRegister = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!name || !phone || !email) return toast("Fill all fields")
//     setLoading(true)
//     try {
//       const result = await signIn("otp-login", {
//         redirect: false,
//         email,
//         otp,
//         name,
//         phone,
//       })
//       if (result?.error) toast(result.error)
//       else closeModal()
//     } catch (err) {
//       console.error(err)
//       toast("Registration failed")
//     } finally { setLoading(false) }
//   }

//   const handleGoogleLogin = async () => {
//     setLoadingGoogle(true)
//     try { await signIn("google", { callbackUrl: "/" }) }
//     catch (err) { console.error(err); setLoadingGoogle(false) }
//   }

//   return (
//     <div className={cn("flex flex-col gap-6", className)} {...props}>
//       <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-muted">
//         <CardHeader className="space-y-2 text-center pb-8">
//           {/* Logo/Brand Icon */}
//           {/* <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
//             <Mail className="w-6 h-6 text-primary" />
//           </div> */}
//           <CardTitle className="text-2xl font-bold tracking-tight">
//             {step === 0 && "Welcome Back"}
//             {step === 1 && "Check Your Email"}
//             {step === 2 && "Complete Profile"}
//           </CardTitle>
//           <CardDescription className="text-sm text-muted-foreground">
//             {step === 0 && "Sign in with email or continue with Google"}
//             {step === 1 && `We've sent a 6-digit code to ${email}`}
//             {step === 2 && "Tell us a bit about yourself"}
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           {/* Step 0: Email & Google Login */}
//           {step === 0 && (
//             <form onSubmit={handleSendOtp} >
//               <FieldGroup >
//                 <Field>
//                   <FieldLabel className="text-sm font-medium">Email Address</FieldLabel>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       type="email"
//                       value={email}
//                       onChange={e => setEmail(e.target.value)}
//                       placeholder="you@example.com"
//                       className="pl-9 h-11"
//                       required
//                     />
//                   </div>
//                 </Field>

//                 <div className="space-y-3">
//                   <Button 
//                     type="submit" 
//                     disabled={loading}
//                     className="w-full h-11 font-medium"
//                   >
//                     {loading ? (
//                       <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                     ) : (
//                       <ArrowRight className="w-4 h-4 mr-2" />
//                     )}
//                     Continue with Email
//                   </Button>

//                   <div className="relative">
//                     <div className="absolute inset-0 flex items-center">
//                       <div className="w-full border-t border-border"></div>
//                     </div>
//                     <div className="relative flex justify-center text-xs uppercase">
//                       <span className="bg-background px-2 text-muted-foreground">or</span>
//                     </div>
//                   </div>

//                   <Button 
//                     variant="outline" 
//                     type="button" 
//                     onClick={handleGoogleLogin} 
//                     disabled={loadingGoogle}
//                     className="w-full h-11 font-medium"
//                   >
//                     {loadingGoogle ? (
//                       <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                     ) : (
//                       <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
//                         <path
//                           fill="currentColor"
//                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                         />
//                         <path
//                           fill="currentColor"
//                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                         />
//                         <path
//                           fill="currentColor"
//                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                         />
//                         <path
//                           fill="currentColor"
//                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                         />
//                       </svg>
//                     )}
//                     Google
//                   </Button>
//                 </div>
//               </FieldGroup>
//             </form>
//           )}

//           {/* Step 1: OTP Input */}
//           {step === 1 && (
//             <form onSubmit={handleVerifyOtp}>
//               <FieldGroup>
//                 <div className="flex justify-center">
//                   <InputOTP 
//                     value={otp} 
//                     onChange={setOtp} 
//                     maxLength={6}
//                     className="gap-2"
//                   >
//                     <InputOTPGroup>
//                       <InputOTPSlot index={0} className="w-12 h-12 text-lg font-semibold" />
//                       <InputOTPSlot index={1} className="w-12 h-12 text-lg font-semibold" />
//                       <InputOTPSlot index={2} className="w-12 h-12 text-lg font-semibold" />
//                     </InputOTPGroup>
//                     <InputOTPSeparator />
//                     <InputOTPGroup>
//                       <InputOTPSlot index={3} className="w-12 h-12 text-lg font-semibold" />
//                       <InputOTPSlot index={4} className="w-12 h-12 text-lg font-semibold" />
//                       <InputOTPSlot index={5} className="w-12 h-12 text-lg font-semibold" />
//                     </InputOTPGroup>
//                   </InputOTP>
//                 </div>

//                 <Button 
//                   type="submit" 
//                   disabled={loading || !otp}
//                   className="w-full h-11 font-medium"
//                 >
//                   {loading ? (
//                     <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                   ) : (
//                     "Verify & Continue"
//                   )}
//                 </Button>

//                 <div className="text-center space-y-2">
//                   <p className="text-sm text-muted-foreground">
//                     Didn't receive the code?
//                   </p>
//                   {countdown > 0 ? (
//                     <p className="text-sm font-medium text-primary">
//                       Resend available in {countdown}s
//                     </p>
//                   ) : (
//                     <Button 
//                       variant="link" 
//                       onClick={handleSendOtp}
//                       className="text-sm font-medium"
//                     >
//                       Resend Code
//                     </Button>
//                   )}
//                 </div>

//                 <Button
//                   variant="outline"
//                   type="button"
//                   onClick={() => setStep(0)}
//                   className="w-full"
//                 >
//                   <ArrowLeft className="w-4 h-4 mr-2" />
//                   Back to Email
//                 </Button>
//               </FieldGroup>
//             </form>
//           )}

//           {/* Step 2: Registration */}
//           {step === 2 && (
//             <form onSubmit={handleRegister}>
//               <FieldGroup>
//                 <Field>
//                   <FieldLabel className="text-sm font-medium">Full Name</FieldLabel>
//                   <div className="relative">
//                     <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       value={name}
//                       onChange={e => setName(e.target.value)}
//                       placeholder="Enter your full name"
//                       className="pl-9 h-11"
//                       required
//                     />
//                   </div>
//                 </Field>

//                 <Field>
//                   <FieldLabel className="text-sm font-medium">Phone Number</FieldLabel>
//                   <div className="relative">
//                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       value={phone}
//                       onChange={e => setPhone(e.target.value)}
//                       placeholder="98XXXXXXXX"
//                       className="pl-9 h-11"
//                       required
//                     />
//                   </div>
//                 </Field>

//                 <div className="flex gap-3 pt-2">
//                   <Button
//                     type="button"
//                     variant="outline"
//                     onClick={() => setStep(1)}
//                     className="flex-1 h-11"
//                   >
//                     <ArrowLeft className="w-4 h-4 mr-2" />
//                     Back
//                   </Button>
//                   <Button
//                     type="submit"
//                     disabled={loading}
//                     className="flex-1 h-11 font-medium"
//                   >
//                     {loading ? (
//                       <Loader2 className="animate-spin h-4 w-4 mr-2" />
//                     ) : (
//                       "Complete Registration"
//                     )}
//                   </Button>
//                 </div>
//               </FieldGroup>
//             </form>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   )
// }



'use client'

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { Mail, ArrowLeft, ArrowRight, User, Phone, Loader2 } from "lucide-react"
import { useAuthModal } from "@/context/auth-modal-context"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useEffect, useRef, useState } from "react"
import { IoLogoGoogle } from "react-icons/io5";

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const { closeModal } = useAuthModal()
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // refs for autofocus
  const emailRef = useRef<HTMLInputElement>(null)
  const otpRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  // countdown for OTP resend
  useEffect(() => {
    if (step !== 1 || countdown <= 0) return
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown, step])

  // autofocus input based on step
  useEffect(() => {
    if (step === 0) emailRef.current?.focus()
    if (step === 1) otpRef.current?.focus()
    if (step === 2) nameRef.current?.focus()
  }, [step])

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email) return toast('Email required')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error('Failed to send OTP')
      setStep(1)
      setCountdown(60)
    } catch {
      toast('Error sending OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) return toast('Enter OTP')
    setLoading(true)
    try {
      const result = await signIn('otp-login', { redirect: false, email, otp })
      if (result?.error) result.error === 'User not found' ? setStep(2) : toast(result.error)
      else closeModal()
    } catch {
      toast('OTP verification failed')
    } finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !email) return toast('Fill all fields')
    setLoading(true)
    try {
      const result = await signIn('otp-login', { redirect: false, email, otp, name, phone })
      result?.error ? toast(result.error) : closeModal()
    } catch {
      toast('Registration failed')
    } finally { setLoading(false) }
  }

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true)
    try { await signIn('google', { callbackUrl: '/' }) }
    catch { setLoadingGoogle(false) }
  }

  // single form rendering function
  const FormContent = () => (
    <>
      <CardContent >
        {step === 0 && (
          <form onSubmit={handleSendOtp}>
            <FieldGroup>
              <Field>
                <FieldLabel>Email Address</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9 h-11"
                    required
                  />
                </div>
              </Field>
              <Button type="submit" disabled={loading} className="w-full h-11">
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                Login with OTP
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button variant="outline" type="button" onClick={handleGoogleLogin} disabled={loadingGoogle} className="w-full h-11">
                {loadingGoogle ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (<IoLogoGoogle />
                )}
                Continue with Google
              </Button>
            </FieldGroup>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleVerifyOtp}>
            <div className="flex justify-center">
              <InputOTP value={otp} onChange={setOtp} maxLength={6} className="gap-2">
                <InputOTPGroup>
                  {[0, 1, 2].map(i => <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg font-semibold" ref={i === 0 ? otpRef : null} />)}
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  {[3, 4, 5].map(i => <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg font-semibold" />)}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button type="submit" disabled={loading || !otp} className="w-full h-11 mt-3">
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Verify & Continue'}
            </Button>
            <Button variant="outline" type="button" onClick={() => setStep(0)} className="w-full mt-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Email
            </Button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister}>
            <FieldGroup>
              <Field>
                <FieldLabel>Full Name</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" className="pl-9 h-11" required />
                </div>
              </Field>
              <Field>
                <FieldLabel>Phone Number</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="98XXXXXXXX" className="pl-9 h-11" required />
                </div>
              </Field>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 h-11">
                  {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Complete Registration'}
                </Button>
              </div>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </>
  )

  if (isDesktop) {
    return (
      <div className={cn('flex flex-col gap-6', className)} {...props}>
        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-muted">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {step === 0 && 'Welcome Back'}
              {step === 1 && 'Check Your Email'}
              {step === 2 && 'Complete Profile'}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {step === 0 && 'Sign in with email or continue with Google'}
              {step === 1 && `We've sent a 6-digit code to ${email}`}
              {step === 2 && 'Tell us a bit about yourself'}
            </CardDescription>
          </CardHeader>
          {FormContent()}
        </Card>
      </div>
    )
  }

  return (
    <Drawer open={true} onOpenChange={closeModal}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-center">
          <DrawerTitle>{step === 0 ? 'Welcome Back' : step === 1 ? 'Check Your Email' : 'Complete Profile'}</DrawerTitle>
          <DrawerDescription>
            {step === 0 ? 'Sign in with email or continue with Google' : step === 1 ? `We've sent a 6-digit code to ${email}` : 'Tell us a bit about yourself'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto max-h-[80vh]">{FormContent()}</div>
      </DrawerContent>
    </Drawer>
  )
}