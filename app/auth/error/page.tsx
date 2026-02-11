"use client"

import { Heart, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Email Confirmation Failed
        </h1>
        <p className="text-muted-foreground">
          The confirmation link may have expired or already been used.
          Please try signing up again or request a new confirmation email.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Heart className="w-5 h-5" />
          Back to App
        </Link>
      </div>
    </div>
  )
}
