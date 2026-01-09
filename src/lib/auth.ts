import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { supabase } from "./supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.githubId = (profile as { id?: number }).id?.toString();
        token.githubUsername = (profile as { login?: string }).login;
        
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("github_id", token.githubId)
          .single();

        if (!existingUser) {
          const { data: newUser } = await supabase
            .from("users")
            .insert({
              github_id: token.githubId,
              github_username: token.githubUsername,
              github_email: token.email,
              github_avatar_url: (profile as { avatar_url?: string }).avatar_url,
              github_access_token: account.access_token,
            })
            .select("id")
            .single();
          token.userId = newUser?.id;
        } else {
          await supabase
            .from("users")
            .update({
              github_access_token: account.access_token,
              updated_at: new Date().toISOString(),
            })
            .eq("github_id", token.githubId);
          token.userId = existingUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        accessToken: token.accessToken as string,
        user: {
          ...session.user,
          id: token.userId as string,
          githubId: token.githubId as string,
          githubUsername: token.githubUsername as string,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
  },
});

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      githubId: string;
      githubUsername: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
