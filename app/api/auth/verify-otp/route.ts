import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import OTP from "@/models/otp";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone || !otp) {
      return NextResponse.json(
        { message: "Phone and OTP are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const otpRecord = await OTP.findOne({ phone });
    if (!otpRecord) {
      return NextResponse.json({ message: "No OTP found for this number" }, { status: 400 });
    }

    if (otpRecord.otp !== otp) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id }); // remove expired OTP
      return NextResponse.json({ message: "OTP expired" }, { status: 400 });
    }

    // OTP is valid — do not update password yet
    return NextResponse.json({ message: "OTP verified successfully" }, { status: 200 });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}