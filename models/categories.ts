import mongoose, { Schema, models, model } from "mongoose";

const categoeySchema = new Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

const Category = models.Category || model("Category", categoeySchema);

export default Category;
