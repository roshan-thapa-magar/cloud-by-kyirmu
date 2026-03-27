import mongoose, { Schema, models, model } from "mongoose";

const restaurantLogoSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const RestaurantLogo =
  models.RestaurantLogo || model("RestaurantLogo", restaurantLogoSchema);

export default RestaurantLogo;
