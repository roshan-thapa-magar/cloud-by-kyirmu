"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SkeletonBanner from "@/components/skeleton/SkeletonBanner";
import { bannerApi, Banner } from "@/services/banner.api";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { getPusherClient } from "@/lib/pusher-client";

export default function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await bannerApi.getAll();
      const sortedData = [...data].sort((a, b) => a.order - b.order);
      setBanners(sortedData);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    
    const pusher = getPusherClient();
    const channel = pusher.subscribe('banners');

    // Handle new banner added
    const handleBannerAdded = (newBanner: Banner) => {
      console.log('New banner added:', newBanner);
      fetchBanners(); // Refresh banners
      toast.success('New banner available!');
    };

    // Handle banner update
    const handleBannerUpdated = (updatedBanner: Banner) => {
      console.log('Banner updated:', updatedBanner);
      fetchBanners(); // Refresh banners
    };

    // Handle banner deletion
    const handleBannerDeleted = (data: { id: string }) => {
      console.log('Banner deleted:', data.id);
      fetchBanners(); // Refresh banners
    };

    // Handle banners reordered
    const handleBannersReordered = (reorderedBanners: Banner[]) => {
      console.log('Banners reordered');
      const sortedData = [...reorderedBanners].sort((a, b) => a.order - b.order);
      setBanners(sortedData);
      // Reset index if needed
      if (index >= sortedData.length) {
        setIndex(0);
      }
    };

    // Bind all Pusher events
    channel.bind('banner-added', handleBannerAdded);
    channel.bind('banner-updated', handleBannerUpdated);
    channel.bind('banner-deleted', handleBannerDeleted);
    channel.bind('banners-reordered', handleBannersReordered);

    // Cleanup
    return () => {
      channel.unbind('banner-added', handleBannerAdded);
      channel.unbind('banner-updated', handleBannerUpdated);
      channel.unbind('banner-deleted', handleBannerDeleted);
      channel.unbind('banners-reordered', handleBannersReordered);
      pusher.unsubscribe('banners');
    };
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (banners.length === 0 || !isAutoPlaying) return;
    
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [banners, isAutoPlaying]);

  // Navigation functions
  const goToNext = () => {
    setIsAutoPlaying(false);
    setIndex((prev) => (prev + 1) % banners.length);
  };

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (slideIndex: number) => {
    setIsAutoPlaying(false);
    setIndex(slideIndex);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 100) {
      goToNext(); // Swipe left
    }
    if (touchStart - touchEnd < -100) {
      goToPrev(); // Swipe right
    }
  };

  if (loading) {
    return <SkeletonBanner />;
  }

  if (!loading && banners.length === 0) {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No Banners Available</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Upload banners to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden rounded-xl shadow-2xl group">
      {/* Images */}
      {banners.map((banner, i) => (
        <div
          key={banner._id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            i === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
          }`}
        >
          <Image
            src={banner.url}
            alt={`Banner ${i + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={i === 0}
            className="object-cover"
          />
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Navigation Arrows - Visible on hover */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform hover:scale-110 z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Play/Pause Button */}
      {banners.length > 1 && (
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute top-4 left-4 w-8 h-8 md:w-10 md:h-10 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
          aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
        >
          {isAutoPlaying ? <Pause className="w-4 h-4 md:w-5 md:h-5" /> : <Play className="w-4 h-4 md:w-5 md:h-5" />}
        </button>
      )}

      {/* Slide Counter */}
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-medium z-20">
        {index + 1} / {banners.length}
      </div>

      {/* Navigation Dots - Modern Design */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`group/dot relative transition-all duration-300 ${
                i === index ? "w-8" : "w-2"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            >
              <span
                className={`absolute inset-0 rounded-full transition-all duration-300 ${
                  i === index 
                    ? "bg-white h-2" 
                    : "bg-white/50 hover:bg-white/80 h-2"
                }`}
              />
              {i === index && (
                <span className="absolute inset-0 rounded-full bg-white animate-ping opacity-75 h-2" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Touch swipe indicator for mobile */}
      <div
        className="absolute inset-0 z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Caption/Title (if you want to add text overlay) */}
      {banners[index] && (
        <div className="absolute bottom-16 left-4 md:left-8 text-white z-20 max-w-2xl">
          <h3 className="text-lg md:text-2xl font-bold mb-1 drop-shadow-lg">
            Special Offer
          </h3>
          <p className="text-sm md:text-base text-white/90 drop-shadow-md hidden md:block">
            Discover our delicious dishes and exclusive deals
          </p>
        </div>
      )}
    </div>
  );
}