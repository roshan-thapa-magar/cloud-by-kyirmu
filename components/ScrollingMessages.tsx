"use client";

import { useState, useEffect } from "react";

interface ScrollingMessagesProps {
    duration?: number; // duration per message in seconds
    onClose?: () => void; // optional close handler
}

interface Restaurant {
    _id: string;
    restaurantName: string;
    openingTime: string;
    closingTime?: string;
    operatingDays: string[];
    shopStatus: "open" | "closed";
}

interface MessageItem {
    text: string;
    type: "name" | "status" | "hours" | "days";
}

export default function ScrollingMessages({
    duration = 10,
    onClose
}: ScrollingMessagesProps) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);

    // Handle close
    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    // Fetch restaurants
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await fetch("/api/restaurant");
                const data = await res.json();
                setRestaurants(data);
            } catch (error) {
                console.error("Error fetching restaurants:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    // Create message sequence
    useEffect(() => {
        if (restaurants.length > 0) {
            const sequence: MessageItem[] = [];
            
            restaurants.forEach((restaurant) => {
                // Name
                sequence.push({
                    text: restaurant.restaurantName,
                    type: "name"
                });

                // Status
                sequence.push({
                    text: restaurant.shopStatus === "open" ? "🟢 Open Now" : "🔴 Closed Now",
                    type: "status"
                });

                // Hours
                sequence.push({
                    text: `${restaurant.openingTime} - ${restaurant.closingTime || "Late Night"}`,
                    type: "hours"
                });

                // Days
                const days = restaurant.operatingDays?.length > 0 
                    ? restaurant.operatingDays.join(", ") 
                    : "Open All Days";
                sequence.push({
                    text: days,
                    type: "days"
                });
            });

            setMessages(sequence);
        }
    }, [restaurants]);

    useEffect(() => {
        if (messages.length > 1) {
            const interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % messages.length);
            }, duration * 1000);
            return () => clearInterval(interval);
        }
    }, [messages.length, duration]);

    if (!isVisible) return null;

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-green-800 w-full py-3 px-4 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Side loading indicator */}
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-white font-medium">Loading restaurants...</span>
                    </div>
                    {/* Close button */}
                    <button 
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    // No restaurants
    if (messages.length === 0) {
        return (
            <div className="bg-green-800 w-full py-3 px-4 relative">
                <div className="flex items-center justify-between">
                    <span className="text-white font-medium">Welcome to Our Restaurant</span>
                    <button 
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        );
    }

    const currentMessage = messages[currentIndex];

    // Different colors for different message types
    const bgColor = 
        currentMessage.type === "name" ? "bg-green-800" :
        currentMessage.type === "status" ? "bg-blue-800" :
        currentMessage.type === "hours" ? "bg-amber-800" :
        "bg-purple-800";

    return (
        <div className={`${bgColor} w-full py-3 px-4 transition-colors duration-500 relative`}>
            <div className="flex items-center gap-3">
                {/* Side loading/status indicator */}
                <div className="flex-shrink-0">
                    {currentMessage.type === "name" && <span className="text-white">🏪</span>}
                    {currentMessage.type === "status" && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    )}
                    {currentMessage.type === "hours" && <span className="text-white">⏰</span>}
                    {currentMessage.type === "days" && <span className="text-white">📅</span>}
                </div>

                {/* Scrolling message */}
                <div className="flex-1 overflow-hidden">
                    <div
                        key={currentIndex}
                        className="animate-scroll-ltr text-white font-medium whitespace-nowrap"
                        style={{ 
                            animationDuration: `${duration}s`,
                            animationTimingFunction: "linear"
                        }}
                    >
                        {currentMessage.text}
                    </div>
                </div>

                {/* Close button */}
                <button 
                    onClick={handleClose}
                    className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}