import mongoose, { Schema, models, model } from "mongoose";

const itemsSchema = new Schema(
  {
    itemType: {
      type: String,
      required: true,
      enum: ["combo", "single"],
    },

    itemName: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
    },

    category: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      default: "",
    },
    ordersCount: {
      type: Number,
      default: 0,
    },

    /* ------------ TOPPINGS SYSTEM ------------ */

    toppings: [
      {
        toppingTitle: {
          type: String,
          required: true,
        },

        // 👇 important field
        selectionType: {
          type: String,
          enum: ["single", "multiple"],
          default: "multiple",
        },

        items: [
          {
            title: {
              type: String,
              required: true,
            },
            price: {
              type: Number,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const Items = models.Items || model("Items", itemsSchema);
export default Items;



