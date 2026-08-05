import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavbarLogo } from "@/components/navbar-logo";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { seedInitialAdmin } from "@/services/auth";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const adminDoc = await getDoc(doc(db, "admins", user.uid));
          if (adminDoc.exists() && adminDoc.data().active) {
            navigate({ to: "/admin" });
          }
        } catch (error) {
          console.error("Auth redirect verify failed:", error);
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setSubmitting(true);
    try {
      const creds = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      // Verify role and activity in firestore
      let adminDoc = await getDoc(doc(db, "admins", creds.user.uid));
      
      if (!adminDoc.exists()) {
        // Auto-seed primary email
        if (data.email.toLowerCase() === "manager.vensaiglobal@gmail.com") {
          try {
            await seedInitialAdmin(creds.user.uid, "Primary Manager", data.email, "admin");
            adminDoc = await getDoc(doc(db, "admins", creds.user.uid));
          } catch (seedError) {
            console.error("Auto-seeding primary manager failed:", seedError);
          }
        }
      }

      if (!adminDoc.exists()) {
        await auth.signOut();
        toast.error("Unauthorized: Access denied.");
        setSubmitting(false);
        return;
      }

      const adminData = adminDoc.data();
      if (!adminData.active) {
        await auth.signOut();
        toast.error("Account is inactive. Contact Administrator.");
        setSubmitting(false);
        return;
      }

      toast.success(`Welcome back, ${adminData.name}`);
      navigate({ to: "/admin" });
    } catch (error: any) {
      console.error("Login error:", error);
      let errMsg = "Incorrect email or password.";
      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errMsg = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        errMsg = "Too many failed attempts. Try again later.";
      }
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center bg-[#FAF9F5] overflow-hidden p-4 sm:p-6 font-sans">
      {/* Soft ambient background homepage warm glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-[#8B7D6B]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#C7965A]/10 blur-3xl pointer-events-none" />
      
      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-[#E5E2DC] bg-white/95 p-8 sm:p-10 shadow-2xl shadow-stone-900/5 backdrop-blur-xl">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6">
          <NavbarLogo size="lg" />
          <p className="mt-1 text-xs text-[#776E63] font-medium uppercase tracking-wider">
            Architectural Catalogue & Admin Console
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-[#5B554C] tracking-wide uppercase">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#776E63]" />
              <Input
                id="email"
                type="email"
                placeholder="name@vensaiprime.com"
                {...register("email")}
                className={`h-11 rounded-xl bg-[#FAF8F5] pl-10 border-[#E5E2DC] text-sm text-[#211C17] placeholder-[#776E63]/60 focus:bg-white focus:border-[#8B7D6B] focus:ring-2 focus:ring-[#8B7D6B]/20 transition-all ${
                  errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] font-medium text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs font-semibold text-[#5B554C] tracking-wide uppercase">
                Password
              </Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#776E63]" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className={`h-11 rounded-xl bg-[#FAF8F5] pl-10 pr-10 border-[#E5E2DC] text-sm text-[#211C17] placeholder-[#776E63]/60 focus:bg-white focus:border-[#8B7D6B] focus:ring-2 focus:ring-[#8B7D6B]/20 transition-all ${
                  errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#776E63] hover:text-[#211C17] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] font-medium text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Action Submit Button */}
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-[#211C17] hover:bg-[#3D332A] text-white font-medium text-sm transition-all shadow-md shadow-[#211C17]/20 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Authenticating...</span>
              </div>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-[#E5E2DC] pt-5">
          <p className="text-[11px] text-[#776E63] flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3 text-[#8B7D6B]" /> Vensai Prime Enterprise Portal
          </p>
        </div>
      </div>
    </div>
  );
}
