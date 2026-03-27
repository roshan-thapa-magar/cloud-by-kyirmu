import Image from "next/image";
import { FoodOrderingDialog } from "@/components/food-ordering-dialog";

// Accept full item object
interface ComboItemProps {
  item: any; // can also type it properly with all fields
  className?: string;
}

export default function ComboItem({ item, className = "" }: ComboItemProps) {
  return (
    <FoodOrderingDialog item={{ ...item }}>
      <div
        className={`flex-shrink-0 border rounded-lg transition-all duration-300 ease-in-out hover:border-green-500 hover:shadow-lg cursor-pointer ${className}`}
      >
        <div className="relative w-full rounded-t-md h-32 md:h-48 overflow-hidden">
          <Image
            src={item.image || "/images/image.png"}
            alt={item.itemName}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-opacity duration-1000 ease-in-out cursor-grab active:cursor-grabbing"
            priority
          />
        </div>
        <div className="p-4">
          <span className="font-bold text-base block truncate-text">{item.itemName}</span>
          <p className="text-xs text-gray-600 instruction-text">{item.description}</p>
          <span className="font-extrabold block text-lg">RS. {item.price}</span>
        </div>
      </div>
    </FoodOrderingDialog>
  );
}