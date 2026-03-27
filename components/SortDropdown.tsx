"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface SortDropdownProps {
  sort: string;
  setSort: (value: string) => void;
}

const sortLabels: Record<string, string> = {
  default: "Default",
  price_high: "High to Low",
  price_low: "Low to High",
  popular: "Popularity",
};

export default function SortDropdown({ sort, setSort }: SortDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="px-3 py-2 border rounded-md">
        <div className="flex items-center gap-4 cursor-pointer">
          <span>{sortLabels[sort]}</span>
          <ChevronDown size={16} />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setSort("default")}>
          Default
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setSort("price_high")}>
          High to Low
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setSort("price_low")}>
          Low to High
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setSort("popular")}>
          Popularity
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}