"use client";

import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Github, Upload, GitBranch, FolderArchive, ArrowRight, Zap, Shield, Cloud } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4aa]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00a8ff]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9d4edd]/5 rounded-full blur-3xl" />
      </div>

      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Streamlined GitHub Management</span>
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
              Forge Your
              <span className="gradient-text"> Repositories</span>
              <br />
              With Ease
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Upload archives, extract files, and push directly to GitHub. 
              The simplest way to create and manage repositories from your local files.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background font-semibold h-14 px-8 text-lg">
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  onClick={() => signIn("github")}
                  className="bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background font-semibold h-14 px-8 text-lg"
                >
                  <Github className="mr-2 w-5 h-5" />
                  Get Started with GitHub
                </Button>
              )}
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-14 px-8 text-lg border-border/50">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Three simple steps to get your files on GitHub
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Upload Archive",
                description: "Upload your ZIP or TAR files. We support .zip, .tar, .tar.gz, and .tgz formats.",
                delay: 0,
              },
              {
                icon: FolderArchive,
                title: "Preview Files",
                description: "See all extracted files with a beautiful tree view. Review before pushing.",
                delay: 0.1,
              },
              {
                icon: GitBranch,
                title: "Push to GitHub",
                description: "Create a new repository or push to existing ones. All in a single click.",
                delay: 0.2,
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: feature.delay }}
                className="glass-panel rounded-2xl p-8 glow-primary hover:border-primary/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00d4aa]/20 to-[#00a8ff]/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="glass-panel rounded-3xl p-12 glow-accent">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: Shield,
                  title: "Secure Authentication",
                  description: "OAuth 2.0 with GitHub. Your credentials never touch our servers.",
                },
                {
                  icon: Cloud,
                  title: "Cloud Native",
                  description: "Built on Supabase for reliable data storage and real-time sync.",
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Optimized file processing and direct GitHub API integration.",
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Start Forging?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join developers who streamline their repository management with RepoForge.
            </p>
            {!session && (
              <Button
                size="lg"
                onClick={() => signIn("github")}
                className="bg-gradient-to-r from-[#00d4aa] to-[#00a8ff] hover:opacity-90 text-background font-semibold h-14 px-8 text-lg"
              >
                <Github className="mr-2 w-5 h-5" />
                Sign in with GitHub
              </Button>
            )}
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[#00d4aa] to-[#00a8ff] flex items-center justify-center">
              <Github className="w-4 h-4 text-background" />
            </div>
            <span className="font-medium">RepoForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built with Next.js, Supabase, and GitHub API
          </p>
        </div>
      </footer>
    </div>
  );
}
