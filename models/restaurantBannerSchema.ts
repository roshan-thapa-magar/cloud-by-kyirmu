import mongoose, { Schema, models, model } from "mongoose";

const restaurantBannerSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    order: { type: Number, default: 0 },

  },
  { timestamps: true }
);

const RestaurantBanner =
  models.RestaurantBanner || model("RestaurantBanner", restaurantBannerSchema);

export default RestaurantBanner;
