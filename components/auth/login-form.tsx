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
  
  // Track keyboard visibility
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

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

  // Handle keyboard visibility for mobile
  useEffect(() => {
    if (!isDesktop) {
      const handleResize = () => {
        // Detect if keyboard is open by checking viewport height
        const isKeyboard = window.innerHeight < window.screen.height * 0.75
        setIsKeyboardOpen(isKeyboard)
        
        if (isKeyboard && contentRef.current) {
          // Scroll the active input into view
          const activeElement = document.activeElement
          if (activeElement && contentRef.current.contains(activeElement)) {
            setTimeout(() => {
              activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }, 100)
          }
        }
      }
      
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isDesktop])

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
    <div 
      ref={contentRef}
      className={cn(
        "overflow-y-auto",
        isDesktop ? "" : "px-4"
      )}
      style={{
        // Add padding when keyboard is open to ensure content is scrollable
        paddingBottom: isKeyboardOpen ? "20px" : "0"
      }}
    >
      {step === 0 && (
        <form onSubmit={handleSendOtp} className="space-y-4">
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
              ) : (<IoLogoGoogle className="w-4 h-4 mr-2" />
              )}
              Continue with Google
            </Button>
          </FieldGroup>
        </form>
      )}

      {step === 1 && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} maxLength={6} className="gap-2">
              <InputOTPGroup>
                {[0, 1, 2].map(i => (
                  <InputOTPSlot 
                    key={i} 
                    index={i} 
                    className="w-12 h-12 text-lg font-semibold" 
                    ref={i === 0 ? otpRef : null} 
                  />
                ))}
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                {[3, 4, 5].map(i => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-12 text-lg font-semibold" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="space-y-2">
            <Button type="submit" disabled={loading || !otp} className="w-full h-11">
              {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Verify & Continue'}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              {countdown > 0 ? (
                <p className="text-sm font-medium text-primary">
                  Resend available in {countdown}s
                </p>
              ) : (
                <Button 
                  variant="link" 
                  onClick={handleSendOtp}
                  className="text-sm font-medium"
                >
                  Resend Code
                </Button>
              )}
            </div>
            <Button variant="outline" type="button" onClick={() => setStep(0)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Email
            </Button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel>Full Name</FieldLabel>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input 
                  ref={nameRef} 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Enter full name" 
                  className="pl-9 h-11" 
                  required 
                />
              </div>
            </Field>
            <Field>
              <FieldLabel>Phone Number</FieldLabel>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="98XXXXXXXX" 
                  className="pl-9 h-11" 
                  required 
                />
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
    </div>
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
          <CardContent className="pb-6">{FormContent()}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Drawer open={true} onOpenChange={closeModal}>
      <DrawerContent className="max-h-[90vh] overflow-hidden">
        <DrawerHeader className="text-center sticky top-0 bg-background z-10 border-b">
          <DrawerTitle>{step === 0 ? 'Welcome Back' : step === 1 ? 'Check Your Email' : 'Complete Profile'}</DrawerTitle>
          <DrawerDescription>
            {step === 0 ? 'Sign in with email or continue with Google' : step === 1 ? `We've sent a 6-digit code to ${email}` : 'Tell us a bit about yourself'}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto py-6">
          {FormContent()}
        </div>
      </DrawerContent>
    </Drawer>
  )
}