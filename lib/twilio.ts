import twilio from "twilio";
import User from "@/models/user";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function sendWhatsAppOTP(phone: string, otp: string) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phone}`,
      body: `Your password reset code is: ${otp}`,
    });
  } catch (error) {
    console.error("Twilio error:", error);
    throw error;
  }
}



export async function sendWhatsAppOrderDetails(order: any) {
  const orderObj = order.toObject ? order.toObject() : order;

  try {
    // 1️⃣ Find restaurant owner
    const owner = await User.findOne({ role: "owner" });
    if (!owner || !owner.phone) {
      throw new Error("Owner not found or phone number missing");
    }

    // 2️⃣ Find customer info
    const customer = await User.findById(orderObj.userId);
    const customerName = customer?.name || "Unknown";

    // =======================
    // 📍 Extract lat,lng → Generate Google Maps link
    // =======================
    let mapsLink = "";
    let cleanAddress = orderObj.address;

    if (orderObj.address && orderObj.address.includes(",")) {
      const parts = orderObj.address.split(",");

      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);

        if (!isNaN(lat) && !isNaN(lng)) {
          mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
          cleanAddress = `${lat}, ${lng}`;
        }
      }
    }

    // =======================
    // 📝 Build WhatsApp Message
    // =======================
    let messageBody = `🆕 *NEW ORDER ALERT* 🆕\n`;
    messageBody += `━━━━━━━━━━━━━━━━━━━\n\n`;
    messageBody += `🆔 *Order ID:* ${orderObj.orderId}\n`;
    messageBody += `👤 *Customer:* ${customerName}\n`;
    messageBody += `📞 *Phone:* ${orderObj.phone.replace(/\D/g, "")}\n`;

    if (mapsLink) {
      messageBody += `📍 *Location:* ${mapsLink}\n`;
    } else {
      messageBody += `📍 *Address:* ${cleanAddress}\n`;
    }

    messageBody += `💳 *Payment:* ${orderObj.paymentMethod}\n`;
    messageBody += `🕐 *Order Time:* ${new Date().toLocaleString()}\n\n`;

    messageBody += `🛒 *ORDER ITEMS*\n`;
    messageBody += `━━━━━━━━━━━━━━━━━━━\n`;

    // =======================
    // 🧾 Order Items
    // =======================
    orderObj.items.forEach((item: any, idx: number) => {
      messageBody += `\n*${idx + 1}. ${item.itemName}*`;
      messageBody += `\n   ▸ Qty: ${item.qty} × ₹${item.price || (item.totalAmount / item.qty).toFixed(2)
        }`;
      messageBody += `\n   ▸ Subtotal: ₹${item.totalAmount}`;

      if (item.note) {
        messageBody += `\n   📝 Note: _${item.note}_`;
      }

      if (item.toppings && item.toppings.length > 0) {
        item.toppings.forEach((topping: any) => {
          let toppingText = "";

          if (topping.selectionType === "multiple") {
            const paidToppings = topping.items.filter(
              (t: any) => t.price > 0
            );

            if (paidToppings.length > 0) {
              toppingText = paidToppings
                .map((t: any) => `${t.title} (₹${t.price})`)
                .join(", ");
            } else {
              toppingText = topping.items
                .map((t: any) => t.title)
                .join(", ");
            }
          } else if (topping.selectionType === "single") {
            toppingText = topping.selectedItem || "";
          }

          if (toppingText) {
            messageBody += `\n   🧂 *${topping.toppingTitle}:* ${toppingText}`;
          }
        });
      }
    });

    if (orderObj.note) {
      // Two line breaks above, no line break after
      messageBody += `\n\n📝 *Order Note:*\n${orderObj.note}`;
    }

    // =======================
    // 💰 Order Summary
    // =======================
    messageBody += `\n\n━━━━━━━━━━━━━━━━━━━\n`;
    messageBody += `💰 *TOTAL AMOUNT: ₹${orderObj.totalAmount}*\n`;
    messageBody += `━━━━━━━━━━━━━━━━━━━\n`;


    // =======================
    // ⚡ Quick Actions
    // =======================
    messageBody += `\n⚡ *Quick Actions:*\n`;
    messageBody += `• Reply to this message to contact customer\n`;
    messageBody += `• Call customer: wa.me/${orderObj.phone.replace(
      /\D/g,
      ""
    )}\n`;
    // =======================
    // 📤 Send WhatsApp Message
    // =======================
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${owner.phone}`,
      body: messageBody,
    });

    return message.sid;
  } catch (error) {
    console.error("Error sending WhatsApp order:", error);
    throw error;
  }
}