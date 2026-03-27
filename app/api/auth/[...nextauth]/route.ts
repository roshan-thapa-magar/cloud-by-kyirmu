import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import NextAuth, { NextAuthOptions, User as NextAuthUser } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import cloudinary from "@/lib/cloudinary";
import OTP from "@/models/otp";
// Extend NextAuth User type
interface MyUser extends NextAuthUser {
  _id: string;
  role: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    CredentialsProvider({
      name: "Phone Login",
      credentials: {
        phone: { label: "Phone", type: "text", placeholder: "+97798XXXXXXXX" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<MyUser | null> {
        if (!credentials?.phone || !credentials?.password)
          throw new Error("Missing phone or password");

        await connectMongoDB();

        // Ensure phone starts with +977
        let formattedPhone = credentials.phone;
        if (!formattedPhone.startsWith("+977")) {
          formattedPhone = "+977" + formattedPhone.replace(/^0/, "");
        }

        const user = await User.findOne({ phone: formattedPhone });
        if (!user) throw new Error("User not found");
        if (!user.password) throw new Error("Please login with Google");

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!passwordMatch) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          _id: user._id.toString(),
          role: user.role || "user",
        } as MyUser;
      },
    }),
    CredentialsProvider({
      id: "otp-login",
      name: "OTP Login",
      credentials: {
        email: { label: "Email", type: "text" },
        otp: { label: "OTP", type: "text" },
        name: { label: "Name", type: "text" },     // ✅ added
        phone: { label: "Phone", type: "text" },   // ✅ added
      },

      async authorize(credentials): Promise<MyUser | null> {
        if (!credentials?.email || !credentials?.otp)
          throw new Error("Email and OTP required");

        await connectMongoDB();

        // ✅ 1. Verify OTP
        const otpEntry = await OTP.findOne({ email: credentials.email })
          .sort({ createdAt: -1 });
        if (!otpEntry) throw new Error("OTP not found");

        if (otpEntry.otp !== credentials.otp)
          throw new Error("Invalid OTP");

        if (otpEntry.expiresAt < new Date())
          throw new Error("OTP expired");

        // ✅ 2. Check if user exists
        let user = await User.findOne({ email: credentials.email });

        if (!user) {
          // ❗ Only allow creation if name + phone provided
          if (!credentials.name || !credentials.phone) {
            throw new Error("User not found");
          }

          // ✅ Create new user
          user = await User.create({
            email: credentials.email,
            name: credentials.name,
            phone: credentials.phone,
            role: "user",
          });
        }

        // ✅ 3. Delete OTP AFTER success (important fix)
        await OTP.deleteOne({ _id: otpEntry._id });

        // ✅ 4. Return user
        return {
          id: user._id.toString(),
          _id: user._id.toString(),
          role: user.role || "user",
        } as MyUser;
      },
    }),
  ],



  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token._id = (user as MyUser)._id;
        token.role = (user as MyUser).role;
      }

      if (account?.provider === "google" && user.email) {
        await connectMongoDB();
        const dbUser = await User.findOne({ email: user.email });
        if (dbUser) {
          token._id = dbUser._id.toString();
          token.role = dbUser.role || "user";
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        _id: token._id as string,
        role: token.role as string,
      };
      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectMongoDB();
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            // Only upload image if user doesn't exist
            let imageUrl = user.image || null;
            if (imageUrl) {
              const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
                folder: "users",
                public_id: `user_${Date.now()}`,
              });
              imageUrl = uploadResponse.secure_url;
            }

            existingUser = await User.create({
              name: user.name,
              email: user.email,
              image: imageUrl,
              role: "user",
            });
          } else if (!existingUser.image && user.image) {
            // Upload only if the existing user has no image yet
            const uploadResponse = await cloudinary.uploader.upload(user.image, {
              folder: "users",
              public_id: `user_${Date.now()}`,
            });
            existingUser.image = uploadResponse.secure_url;
            await existingUser.save();
          }

          return true;
        } catch (err) {
          console.error("Google signIn error:", err);
          return false;
        }
      }
      return true;
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
