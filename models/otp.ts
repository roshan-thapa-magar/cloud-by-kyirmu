import mongoose, { Schema, models, model } from "mongoose";

const otpSchema = new Schema(
  {
    phone: { type: String },
    email: { type: String},
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

const OTP = models.OTP || model("OTP", otpSchema);
export default OTP;