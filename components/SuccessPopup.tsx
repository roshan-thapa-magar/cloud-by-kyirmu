"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle, X, Sparkles, Heart, Gift, PartyPopper, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation"; // ✅ correct import

interface SuccessPopupProps {
    message?: string;
    duration?: number;
    onClose?: () => void;
    orderId?: string;
    customerName?: string;
    orderTotal?: number;
    onViewOrder?: () => void;
    onContinueShopping?: () => void;
}

export function SuccessPopup({
    message = "Your order has been confirmed!",
    duration = 6000,
    onClose,
    orderId,
    customerName = "",
    orderTotal,
    onViewOrder,
    onContinueShopping
}: SuccessPopupProps) {
    const [visible, setVisible] = useState(true);
    const [isHovering, setIsHovering] = useState(false);
    const [progress, setProgress] = useState(100);
    const [isClosing, setIsClosing] = useState(false);
    const [showConfetti, setShowConfetti] = useState(true);
    const router = useRouter();
    // Handle auto-close with pause on hover
    useEffect(() => {
        if (isHovering) return;

        const startTime = Date.now();
        let animationFrame: number;

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (remaining > 0 && !isHovering) {
                animationFrame = requestAnimationFrame(updateProgress);
            } else if (remaining === 0) {
                handleClose();
            }
        };

        animationFrame = requestAnimationFrame(updateProgress);

        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
            }
        };
    }, [duration, isHovering]);

    // Remove confetti after animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowConfetti(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = useCallback(() => {
        setIsClosing(true);
        setTimeout(() => {
            setVisible(false);
            if (onClose) onClose();
        }, 300);
    }, [onClose]);

    const handleContinueShopping = () => {
        handleClose();
        if (onContinueShopping) onContinueShopping();
    };

    const handleViewOrder = () => {
        handleClose();
        router.push("/myAccount#orderHistry");
    };

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && visible) {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [visible, handleClose]);

    if (!visible) return null;

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/30 backdrop-blur-md transition-all duration-300 animate-fade-in"
                onClick={handleClose}
            />

            {/* Confetti Particles */}
            {showConfetti && (
                <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-float-up"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`,
                            }}
                        >
                            {Math.random() > 0.5 ? (
                                <Sparkles className="w-3 h-3 text-yellow-400" />
                            ) : (
                                <Heart className="w-2 h-2 text-pink-400" />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Popup Container */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`relative pointer-events-auto max-w-md w-full transition-all duration-300 ${isClosing ? 'animate-scale-down' : 'animate-scale-up'
                        }`}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    {/* Main Card */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Animated Progress Bar */}
                        <div className="relative h-1 bg-gray-100">
                            <div
                                className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                            {isHovering && (
                                <div className="absolute -top-8 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded-full shadow-sm">
                                    Paused
                                </div>
                            )}
                        </div>

                        {/* Greeting Section */}
                        <div className="pt-6 px-6 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full mb-3">
                                <Sparkles className="w-3 h-3 text-green-500" />
                                <span className="text-xs font-medium text-green-600">
                                    {getGreeting()}
                                </span>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                Hello, {customerName.split(' ')[0]}! 👋
                            </h2>
                            <p className="text-sm text-gray-500">
                                Thank you for shopping with us
                            </p>
                        </div>

                        {/* Success Icon Section - Green Tick */}
                        <div className="relative mt-4 mb-2">
                            {/* Animated Background Effects */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-28 h-28 bg-green-100 rounded-full animate-ping-slow" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-green-50 rounded-full animate-pulse" />
                            </div>

                            {/* Green Tick Icon */}
                            <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full w-20 h-20 mx-auto flex items-center justify-center shadow-lg animate-bounce-in">
                                <CheckCircle className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Success Message */}
                        <div className="px-6 text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Order Placed Successfully! 🎉
                            </h3>
                            <p className="text-gray-600 text-sm">
                                {message}
                            </p>
                        </div>

                        {/* Order Details Card */}
                        {(orderId || orderTotal) && (
                            <div className="mx-6 mt-4 p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-green-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <Gift className="w-4 h-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
                                        Order Confirmed
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    {orderId && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                            <p className="font-mono font-semibold text-gray-900 text-sm">
                                                #{orderId.slice(0, 8)}
                                            </p>
                                        </div>
                                    )}
                                    {orderTotal && (
                                        <div className={orderId ? 'text-right' : ''}>
                                            <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                                            <p className="font-bold text-green-600 text-xl">
                                                {orderTotal.toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Special Thank You Note */}
                        <div className="mx-6 mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                            <p className="text-sm text-green-800 flex items-center justify-center gap-2">
                                <Heart className="w-4 h-4 text-green-500 fill-current" />
                                We're thrilled to have you as our customer!
                                <Heart className="w-4 h-4 text-green-500 fill-current" />
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 pt-4 space-y-3">
                            <button
                                onClick={handleContinueShopping}
                                className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                Continue Shopping
                            </button>

                            <div className="flex gap-3">
                                {onViewOrder && (
                                    <button
                                        onClick={handleViewOrder}
                                        className="flex-1 px-4 py-2.5 border-2 border-green-200 text-green-600 rounded-xl font-medium hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                                    >
                                        <ShoppingBag className="w-4 h-4 inline mr-2" />
                                        Track Order
                                    </button>
                                )}
                                <button onClick={handleViewOrder} className="flex-1 px-4 py-2.5 border-2 border-green-200 text-green-600 rounded-xl font-medium hover:bg-green-50 hover:border-green-300 transition-all duration-200"><ShoppingBag className="w-4 h-4 inline mr-2" />View Order</button>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                            aria-label="Close popup"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Friendly Tip */}
                    <div className="mt-4 text-center text-xs text-gray-500 animate-fade-in-up">
                        💚 Thanks for your order! Press ESC or click outside to close
                    </div>
                </div>
            </div>

        </>
    );
}