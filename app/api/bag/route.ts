import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import BagItem, { ITopping } from "@/models/BagItem";
import Restaurant from "@/models/restaurantSchema";

// Helper function to compare if two topping configurations are identical
const areToppingsEqual = (toppings1: ITopping[], toppings2: ITopping[]): boolean => {
  if (toppings1.length !== toppings2.length) return false;
  
  // Sort both arrays to compare regardless of order
  const sorted1 = [...toppings1].sort((a, b) => a.toppingTitle.localeCompare(b.toppingTitle));
  const sorted2 = [...toppings2].sort((a, b) => a.toppingTitle.localeCompare(b.toppingTitle));
  
  for (let i = 0; i < sorted1.length; i++) {
    const t1 = sorted1[i];
    const t2 = sorted2[i];
    
    // Compare basic properties
    if (t1.toppingTitle !== t2.toppingTitle) return false;
    if (t1.selectionType !== t2.selectionType) return false;
    
    // For single selection, compare the selected item
    if (t1.selectionType === "single") {
      if (t1.selectedItem !== t2.selectedItem) return false;
    }
    
    // For multiple selection, compare the selected items in the items array
    if (t1.selectionType === "multiple") {
      // Only compare items that have price > 0 (selected items)
      const selectedItems1 = (t1.items || []).filter(item => item.price > 0);
      const selectedItems2 = (t2.items || []).filter(item => item.price > 0);
      
      if (selectedItems1.length !== selectedItems2.length) return false;
      
      // Sort selected items by title for consistent comparison
      const sortedItems1 = [...selectedItems1].sort((a, b) => a.title.localeCompare(b.title));
      const sortedItems2 = [...selectedItems2].sort((a, b) => a.title.localeCompare(b.title));
      
      for (let j = 0; j < sortedItems1.length; j++) {
        if (sortedItems1[j].title !== sortedItems2[j].title) return false;
        if (sortedItems1[j].price !== sortedItems2[j].price) return false;
      }
    }
  }
  
  return true;
};

export async function POST(request: NextRequest) {
  try {
    await connectMongoDB();
    
    // Get restaurant (assuming single restaurant)
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if restaurant is open
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
    );

    // Current day full name (e.g., "tuesday")
    const today = now.toLocaleString("en-US", { weekday: "long" }).toLowerCase();

    // Normalize operatingDays from DB to lowercase
    const operatingDays = restaurant.operatingDays.map((day: string) => day.toLowerCase());

    // Check shopStatus
    if (restaurant.shopStatus === "closed") {
      return NextResponse.json(
        { error: "Restaurant is currently closed" },
        { status: 403 }
      );
    }

    // Check operating days
    if (operatingDays.length > 0 && !operatingDays.includes(today)) {
      return NextResponse.json(
        { error: `Restaurant is closed today (${today})` },
        { status: 403 }
      );
    }

    // Check opening/closing time
    const { openingTime, closingTime } = restaurant;
    if (openingTime && closingTime) {
      const currentTime = now.toTimeString().slice(0, 5); // "HH:mm"
      if (currentTime < openingTime || currentTime > closingTime) {
        return NextResponse.json(
          {
            error: `Restaurant is closed now (Open: ${openingTime} - ${closingTime})`,
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { userId, itemId, itemName, price, qty, image, note, toppings } = body;

    if (!userId || !itemName || !price) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // --- Process toppings to calculate prices and clean up data ---
    const processedToppings = (toppings || []).map((topping: any) => {
      let totalSelectedToppingPrice = 0;

      if (topping.selectionType === "single") {
        // For single selection, find the selected item price
        const selectedItem = topping.items?.find((i: any) => i.title === topping.selectedItem);
        totalSelectedToppingPrice = selectedItem?.price || 0;
        
        // Clean up: Keep only the selected item in items array or mark it properly
        // For comparison, we want to store only the relevant data
        return {
          toppingTitle: topping.toppingTitle,
          selectionType: topping.selectionType,
          selectedItem: topping.selectedItem,
          totalSelectedToppingPrice,
          // Keep items array but ensure it's consistent
          items: topping.items || []
        };
      } else if (topping.selectionType === "multiple") {
        // For multiple selection, sum up prices of all items
        totalSelectedToppingPrice = (topping.items || []).reduce(
          (sum: number, i: any) => sum + (i.price || 0),
          0
        );
        
        return {
          toppingTitle: topping.toppingTitle,
          selectionType: topping.selectionType,
          selectedItem: "",
          totalSelectedToppingPrice,
          items: topping.items || []
        };
      }
      
      return topping;
    });

    // --- Calculate total amount ---
    const totalToppingsPrice = processedToppings.reduce(
      (sum: number, t: any) => sum + (t.totalSelectedToppingPrice || 0),
      0
    );
    const totalAmount = price * (qty || 1) + totalToppingsPrice;

    // --- Debug logging to see what's being compared ---
    console.log("Processing new item:", {
      userId,
      itemId,
      itemName,
      toppings: processedToppings
    });

    // --- Check if identical item already exists in bag ---
    // Get all bag items for this user
    const existingBagItems = await BagItem.find({ userId });
    
    console.log(`Found ${existingBagItems.length} existing bag items for user ${userId}`);

    // Look for an item with identical itemId and toppings configuration
    let existingItem = null;
    for (const bagItem of existingBagItems) {
      // First check if it's the same base item
      if (bagItem.itemId === itemId && bagItem.itemName === itemName) {
        console.log("Comparing with existing item:", {
          id: bagItem._id,
          toppings: bagItem.toppings
        });
        
        const isEqual = areToppingsEqual(bagItem.toppings, processedToppings);
        console.log("Toppings equal:", isEqual);
        
        if (isEqual) {
          existingItem = bagItem;
          break;
        }
      }
    }

    if (existingItem) {
      // Update quantity of existing item
      const newQty = existingItem.qty + (qty || 1);
      const newTotalAmount = existingItem.price * newQty + totalToppingsPrice;
      
      const updatedBag = await BagItem.findByIdAndUpdate(
        existingItem._id,
        {
          qty: newQty,
          totalAmount: newTotalAmount,
          note: note || existingItem.note,
          updatedAt: new Date()
        },
        { new: true }
      );

      console.log(`Updated existing item: ${existingItem._id}, new quantity: ${newQty}`);

      return NextResponse.json(
        { 
          success: true, 
          message: "Bag item quantity updated successfully", 
          data: updatedBag,
          updated: true 
        },
        { status: 200 }
      );
    }

    // --- Create new bag item if no identical item exists ---
    const newBag = await BagItem.create({
      userId,
      itemId: itemId || null,
      itemName,
      price,
      qty: qty || 1,
      image: image || "",
      note: note || "",
      toppings: processedToppings,
      totalAmount,
    });

    console.log(`Created new bag item: ${newBag._id}`);

    return NextResponse.json(
      { success: true, message: "Bag created successfully", data: newBag, updated: false },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/bag:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create Bag", error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectMongoDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "UserId is required" },
        { status: 400 }
      );
    }

    // Fetch all bag items for the user
    const items = await BagItem.find({ userId }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error) {
    console.error("Error in GET /api/bag:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch items", error: String(error) },
      { status: 500 }
    );
  }
}