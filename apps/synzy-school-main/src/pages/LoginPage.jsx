import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'; // Added this
import { googleLogin } from '../api/authService'; // Added this

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const savedCreds = localStorage.getItem("school-finder-rememberMe");
    if (savedCreds) {
      const { email, password } = JSON.parse(savedCreds);
      setValue("email", email);
      setValue("password", password);
      setRememberMe(true);
    }
  }, [setValue]);

  // =====================
  // EMAIL LOGIN
  // =====================
 // Inside LoginPage.jsx

const onSubmit = async (data) => {
  setIsLoading(true);
  setServerError("");
  try {
    // 1. Capture the user object returned by your login function
    // Assuming your AuthContext login returns the user data
    const user = await login(data); 

    if (rememberMe) {
      localStorage.setItem("school-finder-rememberMe", JSON.stringify(data));
    } else {
      localStorage.removeItem("school-finder-rememberMe");
    }

    // 2. ✅ DYNAMIC REDIRECTION
    // Check if the logged-in user is a school or a student
    if (user?.userType === 'school') {
      navigate("/school-portal/register"); // Or wherever your school home is
    } else {
      navigate("/dashboard"); // Standard student dashboard
    }

  } catch (error) {
    console.error("Login failed:", error);
    if (error.response?.status === 401) {
      setServerError(error.response?.data?.message || "Please verify your email.");
      setShowResendButton(true);
      setUserEmail(data.email);
      toast.info("Please check your email inbox for verification link.");
    } else {
      setServerError(error.response?.data?.message || "Invalid email or password.");
    }
  } finally {
    setIsLoading(false);
  }
};

  // =====================
  // GOOGLE LOGIN HANDLERS
  // =====================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setIsLoading(true);
      const payload = {
        tokenId: credentialResponse.credential,
        authProvider: 'google',
        // Note: For login, the backend usually ignores this if user exists,
        // or uses it to create a default 'student' profile if new.
        userType: 'student', 
      };

      const res = await googleLogin(payload);

      if (res.data.status === "success") {
        const { token, auth } = res.data.data;

        // Use AuthContext to set state and localStorage
        await login(auth, token); 

        toast.success('Logged in successfully!');

        // REDIRECTION LOGIC:
        // If it's a school user, send to portal. Otherwise, send to dashboard.
        if (auth.userType === 'school') {
          navigate('/school-portal/register');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      toast.error(error.response?.data?.message || 'Google Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Google login was unsuccessful");
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Please enter your details to login.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* ... (Server Error Display) */}
            {serverError && (
               <div className="text-sm text-red-600 bg-red-100 p-3 rounded-md text-center">
                 <p>{serverError}</p>
               </div>
            )}

            {/* EMAIL & PASSWORD FIELDS */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email address</label>
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full px-3 py-2 mt-1 border rounded-md ${errors.email ? "border-red-500" : "border-gray-300"}`}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`w-full px-3 py-2 mt-1 border rounded-md ${errors.password ? "border-red-500" : "border-gray-300"}`}
                    disabled={isLoading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 text-gray-500">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                <span className="ml-2 text-gray-700">Remember Me</span>
              </label>
              <Link to="/forgot-password" name="forgot" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
            </div>

            <button type="submit" disabled={isLoading} className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">Or continue with</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* GOOGLE LOGIN BUTTON */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              width="100%"
              theme="outline"
              text="signin_with"
              shape="rectangular"
            />
          </div>

          <p className="text-sm text-center text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-blue-600 hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
};

export default LoginPage;