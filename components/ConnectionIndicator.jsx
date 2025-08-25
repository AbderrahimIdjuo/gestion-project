"use client";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Loader2, Wifi, WifiOff } from "lucide-react";

export default function ConnectionIndicator({ className = "" }) {
  const connectionStatus = useConnectionStatus();

  const getStatusConfig = () => {
    switch (connectionStatus.status) {
      case "connected":
        return {
          icon: <Wifi className="h-4 w-4 text-green-500" />,
          text: "En ligne",
          textColor: "text-green-600",
          bgColor: "bg-green-100",
          borderColor: "border-green-200",
        };
      case "disconnected":
        return {
          icon: <WifiOff className="h-4 w-4 text-red-500" />,
          text: "Hors ligne",
          textColor: "text-red-600",
          bgColor: "bg-red-100",
          borderColor: "border-red-200",
        };
      case "loading":
        return {
          icon: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
          text: "Vérification...",
          textColor: "text-blue-600",
          bgColor: "bg-blue-100",
          borderColor: "border-blue-200",
        };
      default:
        return {
          icon: <Wifi className="h-4 w-4 text-gray-500" />,
          text: "Inconnu",
          textColor: "text-gray-600",
          bgColor: "bg-gray-100",
          borderColor: "border-gray-200",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`inline-flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.borderColor} border ${className}`}
    >
      {config.icon}
      <span className={config.textColor}>{config.text}</span>
    </div>
  );
}
