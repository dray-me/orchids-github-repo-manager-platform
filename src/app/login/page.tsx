"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#00d4aa]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#00a8ff]/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative glass-panel rounded-2xl p-8 sm:p-12 max-w-md w-full text-center glow-primary"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4aa] to-[#00a8ff] flex items-center justify-center mx-auto mb-6">
          <Github className="w-9 h-9 text-background" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Welcome to RepoForge</h1>
        <p className="text-muted-foreground mb-8">
          Sign in with your GitHub account to start managing repositories
        </p>

        <Button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background font-semibold h-12 text-base"
        >
          <Github className="mr-2 w-5 h-5" />
          Continue with GitHub
        </Button>

        <p className="text-xs text-muted-foreground mt-6">
          By signing in, you agree to grant repository access permissions
        </p>
      </motion.div>
    </div>
  );
}
