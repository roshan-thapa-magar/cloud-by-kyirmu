import mongoose, { Schema, models, model } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    image: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: false, 
    },
    role: {
      type: String,
      enum: ["user", "owner"],
    },
    phone: {
      type: String,
      required: false,
      default: null,
    },

    address: {
      type: String,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

const User = models.User || model("User", userSchema);

export default User;
