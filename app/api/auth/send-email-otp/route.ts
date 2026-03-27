import { connectMongoDB } from "@/lib/mongodb";
import OTP from "@/models/otp";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) return new Response("Email is required", { status: 400 });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiry time (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await connectMongoDB();

    // 🔥 Check if OTP already exists
    const existingOTP = await OTP.findOne({ email });

    if (existingOTP) {
      // ✅ Update existing OTP
      existingOTP.otp = otpCode;
      existingOTP.expiresAt = expiresAt;
      await existingOTP.save();
    } else {
      // ✅ Create new OTP
      await OTP.create({ email, otp: otpCode, expiresAt });
    }

    // Send OTP via Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otpCode}. It will expire in 5 minutes.`,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to send OTP", { status: 500 });
  }
}