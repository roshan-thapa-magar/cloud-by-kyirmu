// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      _id: string;  // MongoDB _id
      role: string;
    } & DefaultSession["user"];
  }

  interface User {
    _id: string;
    role: string;
  }

  interface JWT {
    _id: string;
    role: string;
  }
}
