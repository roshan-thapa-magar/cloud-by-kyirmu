// models/restaurantSchema.ts
import mongoose, { Schema, models, model } from "mongoose";

const restaurantSchema = new Schema(
  {
    restaurantName: {
      type: String,
      required: true,
    },
    openingTime: {
      type: String,
      required: true,
    },
    closingTime: {
      type: String,
      default: null,
    },
    operatingDays: [
      {
        type: String,
      },
    ],
    shopStatus: {
      type: String,
      enum: ["open", "closed"],
      default: "closed",
    },
  },
  { timestamps: true }
);

const Restaurant = models.Restaurant || model("Restaurant", restaurantSchema);

export default Restaurant;