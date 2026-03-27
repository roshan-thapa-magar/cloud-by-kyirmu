// utils/api.ts
export const fetchRestaurant = async () => {
  const res = await fetch("/api/restaurant");
  if (!res.ok) throw new Error("Failed to fetch restaurants");
  const data = await res.json();
  return data[0] || null; // assuming only one restaurant for simplicity
};

export const createRestaurant = async (restaurant: any) => {
  const res = await fetch("/api/restaurant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(restaurant),
  });
  if (!res.ok) throw new Error("Failed to create restaurant");
  return res.json();
};

export const updateRestaurant = async (restaurant: any) => {
  const res = await fetch("/api/restaurant", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(restaurant),
  });
  if (!res.ok) throw new Error("Failed to update restaurant");
  return res.json();
};