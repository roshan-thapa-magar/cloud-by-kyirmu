import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreIcon, Clock3Icon, CalendarDaysIcon } from "lucide-react";

interface Restaurant {
  name: string;
  openingTime: string;
  closingTime: string;
  operatingDays: string[];
  shopStatus: string;
}

interface RestaurantListProps {
  restaurants: Restaurant[];
}

const formatDays = (days: string[]) => {
  if (!days?.length) return "Not set";
  if (days.length === 7) return "Every day";
  return days.map(d => d.slice(0, 3)).join(", ");
};

export function RestaurantList({ restaurants }: RestaurantListProps) {
  if (!restaurants?.length) return null;

  return (
    <>
      <h2 className="text-2xl font-semibold mt-8">Restaurants</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant, index) => (
          <Card key={index}>
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2">
                <StoreIcon className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{restaurant.name || "Unnamed"}</h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock3Icon className="h-4 w-4" />
                <span>{restaurant.openingTime} - {restaurant.closingTime}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarDaysIcon className="h-4 w-4" />
                <span>{formatDays(restaurant.operatingDays)}</span>
              </div>
              <Badge variant={restaurant.shopStatus === "open" ? "default" : "destructive"}>
                {restaurant.shopStatus}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}