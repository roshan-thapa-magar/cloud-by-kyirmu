"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "../ui/input"
import { Search } from "lucide-react"
import Image from "next/image"
import { FoodOrderingDialog } from "@/components/food-ordering-dialog"
import { getItems } from "@/services/items.api"
import { useSession } from "next-auth/react"
import { useAuthModal } from "@/context/auth-modal-context"

const SearchBar = () => {
  const { data: session, status } = useSession()
  const { openModal } = useAuthModal()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<any>(null) // dialog state
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch items
  const fetchItems = async () => {
    try {
      const data = await getItems()
      setItems(data.items)
    } catch (error) {
      console.error("Failed to fetch items", error)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // Focus input when mobile opens
  useEffect(() => {
    if (mobileOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mobileOpen])

  const filteredItems = items.filter((item) =>
    item.itemName?.toLowerCase().includes(search.toLowerCase())
  )

  // Open dialog with authentication check
  const openDialog = (item: any) => {
    // Check authentication first
    if (status !== "authenticated") {
      openModal()
      return
    }
    if (session?.user?.role !== "user") {
      openModal()
      return
    }

    setSelectedItem(item)
    setSearch("")      // close dropdown
    setMobileOpen(false) // close mobile search if open
  }

  return (
    <div className="mlrelative w-full">
      {/* Desktop Search */}
      <div className="hidden md:block">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
          />
          <Input
            placeholder="Search items..."
            className="pl-10 focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {search && (
          <div className="absolute z-50 mt-2 w-[300px] bg-background shadow-md rounded-md">
            <div className="px-4 pt-4 pb-2 text-lg font-bold">Items and Combos</div>

            {filteredItems.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted-foreground">No items found</p>
            )}

            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center space-x-3 hover:bg-muted px-4 py-2 cursor-pointer"
                onClick={() => openDialog(item)}
              >
                <Image
                  src={item.image || "/placeholder.png"}
                  alt={item.itemName}
                  width={40}
                  height={40}
                  className="object-cover w-8 h-8 rounded-full"
                />
                <span className="text-sm font-semibold">{item.itemName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Search */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md hover:bg-muted py-1"
        >
          <Search className="w-5 h-5" />
        </button>

        {mobileOpen && (
          <div className="fixed top-1 left-0 right-0 bg-background z-50 p-3 shadow-md">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <Input
                ref={inputRef}
                placeholder="Search items..."
                className="pl-10 pr-10 focus-visible:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {search && (
              <div className="w-full bg-background shadow-md rounded-md mt-2">
                <div className="px-4 pt-4 pb-2 text-lg font-bold">Items and Combos</div>

                {filteredItems.length === 0 && (
                  <p className="px-4 py-3 text-sm text-muted-foreground">No items found</p>
                )}

                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 hover:bg-muted px-4 py-2 cursor-pointer"
                    onClick={() => openDialog(item)}
                  >
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.itemName}
                      width={40}
                      height={40}
                      className="object-cover w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-semibold">{item.itemName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Single FoodOrderingDialog - only render when authenticated or when selectedItem exists */}
      {selectedItem && status === "authenticated" && (
        <FoodOrderingDialog
          item={selectedItem}
          open={!!selectedItem}
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null)
          }}
        />
      )}
    </div>
  )
}

export default SearchBar