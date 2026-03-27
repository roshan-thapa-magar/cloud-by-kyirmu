'use client'

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"

interface SpicyLevelProps {
  title: string
  items: { title: string; price: number }[]
  selectedItem?: string // for initial selection
  value?: number        // optional controlled value
  onChange?: (index: number) => void // callback for changes
}

export default function SpicyLevel({
  title,
  items,
  selectedItem,
  value,
  onChange,
}: SpicyLevelProps) {
  // Determine initial index: selectedItem or 0
  const initialIndex = selectedItem ? items.findIndex(i => i.title === selectedItem) : 0
  const [internalValue, setInternalValue] = useState(Math.max(initialIndex, 0))

  // Update internal value if controlled value changes
  useEffect(() => {
    if (typeof value === "number") setInternalValue(value)
  }, [value])

  const handleChange = (index: number) => {
    setInternalValue(index)
    onChange?.(index)
  }

  const currentItem = items[internalValue]?.title || "None"

  return (
    <div className="w-full max-w-md">
      <h2 className="text-md font-semibold mt-4 ">{title}</h2>
      <span className="flex w-full border my-3"></span>

      <div className="text-center text-lg font-bold text-purple-600">{currentItem}</div>

      <div className="relative pt-6">
        <Slider
          value={[internalValue]}
          onValueChange={(val) => handleChange(val[0])}
          min={0}
          max={Math.max(0, items.length - 1)}
          step={1}
          className="
            [&>span:first-child]:bg-red-500
            [&_[role=slider]]:bg-red-600
            [&_[role=slider]]:border-red-600
          "
        />
      </div>

      {/* Show all items with check */}
      <div className="flex justify-between mt-2">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className={internalValue === index ? "font-bold text-green-600" : ""}>
              {item.title}
            </span>
            {internalValue === index && <span className="text-green-600">✓</span>}
          </div>
        ))}
      </div>
    </div>
  )
}