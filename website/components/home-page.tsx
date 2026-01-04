"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Check, X, Coins } from "lucide-react"
import { Link } from "@/i18n/navigation"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { startGoogleOAuth, buildOAuthCallbackUrl, getDefaultRedirectPath } from "@/lib/auth/oauth"
import { toast } from "react-toastify"
import { Footer } from "@/components/footer"
import { useTranslations } from "next-intl"
import { Checkbox } from "@/components/ui/checkbox"
import { motion } from "framer-motion"
import { eurToCoins } from "@/lib/wallet"
import { DynamicGradientOverlay } from "@/components/dynamic-gradient-overlay"

const translations = {
  en: {
    or: "or",
    passwordValid: "Password is valid",
    passwordsMatch: "Passwords match",
    passwordMismatch: "Passwords do not match",
    passwordMinLength: "Minimum 6 characters",
    ageConfirmation: "I confirm that I am 18 years or older and agree to the Terms of Service and Privacy Policy",
    loggingIn: "Logging in...",
    creatingAccount: "Creating account...",
    invalidCredentials: "Incorrect email or password. Please try again.",
    emailNotConfirmed: "Please verify your email before logging in.",
    sessionError: "Unable to create session. Please try again.",
    emailAlreadyRegistered: "This email is already registered. Try logging in instead.",
  },
  uk: {
    or: "або",
    passwordValid: "Пароль валідний",
    passwordsMatch: "Паролі співпадають",
    passwordMismatch: "Паролі не співпадають",
    passwordMinLength: "Мінімум 6 символів",
    ageConfirmation:
      "Я підтверджую, що мені 18 років або більше, та погоджуюсь з Умовами використання та Політикою конфіденційності",
    loggingIn: "Вхід...",
    creatingAccount: "Створення акаунту...",
    invalidCredentials: "Невірний email або пароль. Спробуйте ще раз.",
    emailNotConfirmed: "Будь ласка, підтвердіть вашу електронну пошту перед входом.",
    sessionError: "Не вдалося створити сесію. Спробуйте ще раз.",
    emailAlreadyRegistered: "Цей email вже зареєстрований. Спробуйте увійти.",
  },
}

export default function HomePage() {
  const t = useTranslations("common")
  const tLanding = useTranslations("landing")

  const [locale, setLocale] = useState<"en" | "uk">("en")

  // Get locale from window on client
  if (typeof window !== "undefined" && locale === "en") {
    const path = window.location.pathname
    if (path.startsWith("/uk")) {
      setLocale("uk")
    }
  }

  const getText = (key: keyof typeof translations.en): string => {
    return translations[locale]?.[key] || translations.en[key]
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptedAge, setAcceptedAge] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter()
  const defaultRedirectPath = getDefaultRedirectPath()

  const isFormValid =
    mode === "login"
      ? email && password
      : email && password && confirmPassword && password === confirmPassword && password.length >= 6 && acceptedAge

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const client = createClient()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError(getText("passwordMismatch"))
          setIsLoading(false)
          return
        }

        const emailUsername = email.split("@")[0]
        const res = await fetch("/api/handles/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseName: emailUsername }),
        })
        const { handle, error } = await res.json()

        if (error) {
          toast.error("Failed to generate handle")
          setIsLoading(false)
          return
        }

        const uniqueHandle = handle

        const emailRedirectTo = buildOAuthCallbackUrl({
          nextPath: defaultRedirectPath,
        })

        const { data, error: signUpError } = await client.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo,
            data: {
              handle: uniqueHandle,
            },
          },
        })

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError(getText("emailAlreadyRegistered"))
          } else {
            setError(signUpError.message)
          }
          setIsLoading(false)
          return
        }

        if (data?.user && !data.session) {
          setError(null)
          router.push("/auth/verify-email?email=" + encodeURIComponent(email))
          return
        }

        router.push("/feed")
      } else {
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message === "Invalid login credentials") {
            setError(getText("invalidCredentials"))
          } else if (error.message.includes("Email not confirmed")) {
            setError(getText("emailNotConfirmed"))
          } else {
            setError(error.message)
          }
          setIsLoading(false)
          return
        }

        if (!data.session) {
          setError(getText("sessionError"))
          setIsLoading(false)
          return
        }

        router.push("/feed")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      if (errorMessage === "Invalid login credentials") {
        setError(getText("invalidCredentials"))
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true)
    setError(null)

    try {
      const credentialResponse = await startGoogleOAuth({ nextPath: defaultRedirectPath })
      handleGoogleSuccess(credentialResponse)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsGoogleLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    const client = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const emailUsername = credentialResponse.email.split("@")[0]
      if (emailUsername) {
        const res = await fetch("/api/handles/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ baseName: emailUsername }),
        })
        const { handle, error } = await res.json()

        if (error) {
          toast.error("Failed to generate handle")
          setIsLoading(false)
          return
        }

        const uniqueHandle = handle

        const emailRedirectTo = buildOAuthCallbackUrl({
          nextPath: defaultRedirectPath,
        })

        const { data, error: signUpError } = await client.auth.signUp({
          email: credentialResponse.email,
          password: credentialResponse.password,
          options: {
            emailRedirectTo,
            data: {
              handle: uniqueHandle,
            },
          },
        })

        if (signUpError) {
          if (signUpError.message.includes("already registered")) {
            setError(getText("emailAlreadyRegistered"))
          } else {
            setError(signUpError.message)
          }
          setIsLoading(false)
          return
        }

        if (data?.user && !data.session) {
          setError(null)
          router.push("/auth/verify-email?email=" + encodeURIComponent(credentialResponse.email))
          return
        }

        router.push("/feed")
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEmail("")
    setPassword("")
    setConfirmPassword("")
    setAcceptedAge(false)
    setError(null)
  }

  const demoVideoPrice = 9.99
  const demoVideoPriceInCoins = eurToCoins(demoVideoPrice)

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex flex-col lg:grid lg:grid-cols-2 flex-1 overflow-hidden">
        <div className="relative bg-gradient-to-br from-[#0ea5e9] via-[#06b6d4] to-[#14b8a6] flex flex-col p-6 md:p-8 lg:p-12 overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[20%] left-[5%] w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </div>

          {/* Floating cards - right side */}
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 hidden 2xl:block z-10 pointer-events-none w-[400px] h-[500px]">
            {/* Card 1 - Top left */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotate: -12 }}
              animate={{ opacity: 1, y: 0, rotate: -12 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="absolute top-[20px] left-0 w-[160px]"
              style={{ zIndex: 1 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="aspect-[3/4] relative">
                  <img
                    src="/female-fashion-model-urban-style.jpg"
                    alt="Creator content"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                      <span className="text-white text-sm font-medium">@sofia</span>
                    </div>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-2 bg-white">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-600 font-medium">2.4k</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Card 2 - Top right, slightly higher */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotate: 6 }}
              animate={{ opacity: 1, y: 0, rotate: 6 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-[-20px] right-0 w-[200px]"
              style={{ zIndex: 3 }}
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      LIVE
                    </span>
                  </div>
                  <div className="aspect-[3/4] relative">
                    <img
                      src="/female-content-creator-selfie-colorful.jpg"
                      alt="Live creator"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="p-3 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500" />
                    <div>
                      <p className="text-base font-bold text-gray-800">Emma Live</p>
                      <p className="text-sm text-gray-500">1.2k watching</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Card 3 - Bottom left */}
            <motion.div
              initial={{ opacity: 0, y: 50, rotate: -4 }}
              animate={{ opacity: 1, y: 0, rotate: -4 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute bottom-[40px] left-[40px] w-[140px]"
              style={{ zIndex: 2 }}
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="aspect-square relative">
                  <img
                    src="/fitness-girl-workout-gym.jpg"
                    alt="Fitness content"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-sm font-bold">Workout Tips</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-white/80 text-xs">@fit_anna</span>
                      <span className="text-green-400 text-sm font-bold">$5</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Card 4 - 18+ Video Demo - Center right, LARGER */}
            <motion.div
              initial={{ opacity: 0, y: 20, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -5 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute top-[280px] right-[20px] w-[180px]"
              style={{ zIndex: 4 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1.5 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="aspect-[3/4] relative rounded-2xl overflow-hidden">
                  {/* Blurred video background */}
                  <video
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/grok-video-16ef84f9-fa1e-4b03-b82c-1d8abedab963-iaDBct93jmklLDRMH23CEd20DwTkzh.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover blur-[6px] scale-110 rounded-2xl"
                  />

                  <DynamicGradientOverlay />

                  {/* 18+ Badge */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-bold rounded-md">18+</span>
                  </div>

                  {/* Lock/Monetization Icon */}
                  <div className="absolute top-2 right-2 z-10">
                    <div className="w-6 h-6 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Centered unlock prompt */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 border border-white/30">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <p className="text-white text-xs font-semibold drop-shadow-lg">Unlock</p>
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" />
                        <span className="text-white text-[10px] font-medium">@exclusive</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-xs font-bold">{demoVideoPriceInCoins}</span>
                        <Coins className="w-3 h-3 text-amber-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating notification badge - top */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -top-8 left-[60px]"
              style={{ zIndex: 5 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="bg-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">New subscriber!</span>
              </motion.div>
            </motion.div>

            {/* Earnings badge - right side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="absolute top-[200px] -right-4"
              style={{ zIndex: 5 }}
            >
              <motion.div
                animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
                className="bg-green-500 px-4 py-2 rounded-full shadow-xl"
              >
                <span className="text-white text-sm font-bold whitespace-nowrap">+$1,250 today</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col justify-center flex-1 max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto lg:mx-0">
            {/* Logo */}
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <img
                src="/logo-white.png"
                alt="Fantikx"
                className="w-auto h-8 sm:h-10 md:h-12 lg:h-14 xl:h-16 2xl:h-20 drop-shadow-2xl mx-auto lg:mx-0"
              />
            </div>

            {/* Main headline */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-white mb-2 sm:mb-3 lg:mb-4 leading-tight text-center lg:text-left">
              {tLanding("headline")}
              <br />
              <span className="italic bg-gradient-to-r from-white via-cyan-100 to-teal-100 bg-clip-text text-transparent">
                {tLanding("headlineHighlight")}
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl 2xl:text-2xl text-white font-semibold mb-2 sm:mb-3 text-center lg:text-left">
              {tLanding("subheadline")}
            </p>

            {/* Tagline */}
            <p className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-lg text-white/90 mb-4 sm:mb-6 lg:mb-8 font-medium text-center lg:text-left">
              {tLanding("tagline")}
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center lg:justify-start mb-6 sm:mb-8 lg:mb-10">
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-semibold border border-white/30">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {tLanding("features.noLimits.title")}
              </span>
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-semibold border border-white/30">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {tLanding("features.noBans.title")}
              </span>
              <span className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs lg:text-sm font-semibold border border-white/30">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {tLanding("features.modern.title")}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 lg:gap-6 pt-4 sm:pt-6 border-t border-white/25">
              <div className="text-center lg:text-left">
                <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">50K+</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-white/80 mt-0.5">Creators</p>
              </div>
              <div className="w-px h-8 sm:h-10 lg:h-12 bg-white/25 hidden sm:block" />
              <div className="text-center lg:text-left">
                <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">$2M+</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-white/80 mt-0.5">Paid Out</p>
              </div>
              <div className="w-px h-8 sm:h-10 lg:h-12 bg-white/25 hidden sm:block" />
              <div className="text-center lg:text-left">
                <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white">0%</p>
                <p className="text-[10px] sm:text-xs lg:text-sm text-white/80 mt-0.5">Shadow Bans</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-4 md:p-6 lg:p-12 bg-background overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="flex gap-4 mb-4 md:mb-6">
              <button
                onClick={() => {
                  setMode("login")
                  setError(null)
                }}
                className={`text-lg md:text-xl font-semibold pb-2 border-b-2 transition-colors ${
                  mode === "login" ? "text-gray-900 border-blue-500" : "text-gray-400 border-transparent"
                }`}
              >
                {t("login")}
              </button>
              <button
                onClick={() => {
                  setMode("signup")
                  setError(null)
                }}
                className={`text-lg md:text-xl font-semibold pb-2 border-b-2 transition-colors ${
                  mode === "signup" ? "text-gray-900 border-blue-500" : "text-gray-400 border-transparent"
                }`}
              >
                {t("signUp")}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm md:text-base font-medium text-gray-700">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="mt-1 h-11 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm md:text-base font-medium text-gray-700">
                  {t("password")}
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    className="h-11 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {getText("passwordMinLength")}
                  </p>
                )}
                {password.length >= 6 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {getText("passwordValid")}
                  </p>
                )}
              </div>

              {mode === "signup" && (
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm md:text-base font-medium text-gray-700">
                    {t("confirmPassword")}
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("confirmPassword")}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className={`h-11 bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10 ${
                        confirmPassword && password !== confirmPassword ? "border-red-300" : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {getText("passwordMismatch")}
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && password.length >= 6 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {getText("passwordsMatch")}
                    </p>
                  )}
                </div>
              )}

              {mode === "signup" && (
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="acceptAge"
                    checked={acceptedAge}
                    onCheckedChange={(checked) => setAcceptedAge(checked === true)}
                    className="mt-0.5"
                  />
                  <Label htmlFor="acceptAge" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
                    {getText("ageConfirmation")}
                  </Label>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading || !isFormValid}
                className={`w-full h-11 font-medium rounded-lg transition-all ${
                  isFormValid
                    ? "bg-gradient-to-r from-[#0ea5e9] to-[#14b8a6] hover:from-[#0284c7] hover:to-[#0d9488] text-white shadow-md"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading
                  ? mode === "login"
                    ? getText("loggingIn")
                    : getText("creatingAccount")
                  : mode === "login"
                    ? t("login")
                    : t("signUp")}
              </Button>

              {mode === "login" && (
                <>
                  <p className="text-xs text-center text-gray-500 leading-relaxed">
                    {t.rich("loginAgreement", {
                      link: (chunks) => (
                        <Link href="/legal/terms" className="text-blue-500 hover:underline">
                          {chunks}
                        </Link>
                      ),
                    })}
                  </p>
                  <div className="text-center">
                    <Link href="/auth/forgot-password" className="text-sm text-blue-500 hover:underline">
                      {t("forgotPassword")}
                    </Link>
                  </div>
                </>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-gray-500">{getText("or")}</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading || isGoogleLoading}
                variant="outline"
                className="w-full h-11 border-2 border-gray-300 hover:bg-gray-50 font-medium rounded-lg bg-white"
              >
                {isGoogleLoading ? (
                  t("connecting")
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{t("signInWithGoogle")}</span>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
