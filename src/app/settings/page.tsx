"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Github, LogOut, ExternalLink, Shield, Database, Key, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Github className="w-5 h-5 text-primary" />
              GitHub Account
            </h2>

            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-16 w-16 border-2 border-primary/30">
                <AvatarImage src={session.user?.image || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {session.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{session.user?.name}</p>
                <p className="text-muted-foreground">@{session.user?.githubUsername}</p>
                {session.user?.email && (
                  <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <a
                href={`https://github.com/${session.user?.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  View Profile
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">OAuth Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Authenticated via GitHub OAuth 2.0
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Data Storage</p>
                    <p className="text-sm text-muted-foreground">
                      Securely stored with Supabase
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                  Encrypted
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Permissions</h2>
            <p className="text-muted-foreground text-sm mb-4">
              RepoForge has access to the following GitHub permissions:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Read user profile information</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Access email addresses</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Create and manage repositories</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>Push and pull repository content</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              You can revoke these permissions at any time from your{" "}
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub settings
              </a>
              .
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
