"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Github, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4aa] to-[#00a8ff] flex items-center justify-center">
              <Github className="w-5 h-5 text-background" />
            </div>
            <span className="font-semibold text-lg tracking-tight">RepoForge</span>
          </Link>

          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : session ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9 border-2 border-primary/30">
                        <AvatarImage src={session.user?.image || ""} alt={session.user?.name || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {session.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 glass-panel">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-muted-foreground">@{session.user?.githubUsername}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => signIn("github")}
                className="bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background font-medium"
              >
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
