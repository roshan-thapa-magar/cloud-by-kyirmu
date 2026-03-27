'use client'

import Image from "next/image"
import React, { useEffect, useState, useCallback } from "react"
import { getCategories } from "@/services/category.api"
import { Skeleton } from "@/components/skeleton/Skeleton"
import { getPusherClient } from "@/lib/pusher-client"
import Link from "next/link"
import { toast } from "sonner"

interface Category {
  _id: string
  categoryName: string
  image?: string
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories()
      setCategories(data.categories)
    } catch (error) {
      console.error("Failed to load categories")
      toast.error("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    
    const pusher = getPusherClient()
    const channel = pusher.subscribe('categories')

    // Handle new category created
    const handleCategoryCreated = (newCategory: Category) => {
      console.log('New category created:', newCategory)
      setCategories(prev => [newCategory, ...prev])
      toast.success(`New category "${newCategory.categoryName}" added`)
    }

    // Handle category image updated
    const handleCategoryImageUpdated = (updatedCategory: Category) => {
      console.log('Category image updated:', updatedCategory)
      setCategories(prev =>
        prev.map(c => (c._id === updatedCategory._id ? updatedCategory : c))
      )
      toast.info(`Category "${updatedCategory.categoryName}" image updated`)
    }

    // Handle category updated
    const handleCategoryUpdated = (updatedCategory: Category) => {
      console.log('Category updated:', updatedCategory)
      setCategories(prev =>
        prev.map(c => (c._id === updatedCategory._id ? updatedCategory : c))
      )
      toast.info(`Category "${updatedCategory.categoryName}" updated`)
    }

    // Handle category deleted
    const handleCategoryDeleted = (data: { _id: string }) => {
      console.log('Category deleted:', data._id)
      setCategories(prev => prev.filter(c => c._id !== data._id))
      toast.info('Category deleted')
    }

    // Bind all Pusher events
    channel.bind('category-created', handleCategoryCreated)
    channel.bind('category-image-updated', handleCategoryImageUpdated)
    channel.bind('category-updated', handleCategoryUpdated)
    channel.bind('category-deleted', handleCategoryDeleted)

    // Cleanup
    return () => {
      channel.unbind('category-created', handleCategoryCreated)
      channel.unbind('category-image-updated', handleCategoryImageUpdated)
      channel.unbind('category-updated', handleCategoryUpdated)
      channel.unbind('category-deleted', handleCategoryDeleted)
      pusher.unsubscribe('categories')
    }
  }, [fetchCategories])

  return (
    <div className="mt-4">
      {(loading || categories.length > 0) && (
        <span className="text-2xl font-extrabold">Categories</span>
      )}
      <div className="mt-4 flex overflow-x-auto hide-scrollbar gap-4 cursor-pointer">
        {loading ? (
          <Skeleton count={13} />
        ) : (
          categories.map((item) => (
            <Link
              key={item._id}
              href={`/filter?cid=${item._id}`}
              className="flex-none w-20 flex flex-col items-center space-y-2 text-center border rounded-lg hover:border-green-500 transition-all duration-200 hover:shadow-md"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full">
                <Image
                  src={item.image || "https://t4.ftcdn.net/jpg/02/84/46/89/360_F_284468940_1bg6BwgOfjCnE3W0wkMVMVqddJgtMynE.jpg"}
                  alt={item.categoryName}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <span className="block w-20 text-center truncate text-sm font-bold leading-tight">
                {item.categoryName}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}