"use client";
import { CheckCircle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function ConnectionStatusBar({ connectionStatus }) {
  const [showBar, setShowBar] = useState(false);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [isOfflineBar, setIsOfflineBar] = useState(false);

  useEffect(() => {
    // Afficher la barre seulement dans des cas spécifiques
    if (previousStatus !== null && previousStatus !== connectionStatus.status) {
      // Cas 1: Perte de connexion (connected → disconnected)
      if (
        previousStatus === "connected" &&
        connectionStatus.status === "disconnected"
      ) {
        setShowBar(true);
        setIsOfflineBar(true); // Marquer comme barre de perte de connexion
      }

      // Cas 2: Rétablissement de connexion (disconnected → connected)
      if (
        previousStatus === "disconnected" &&
        connectionStatus.status === "connected"
      ) {
        setShowBar(true);
        setIsOfflineBar(false); // Marquer comme barre de rétablissement

        // Masquer la barre après 5 secondes seulement pour le rétablissement
        const timer = setTimeout(() => {
          setShowBar(false);
        }, 5000);

        return () => clearTimeout(timer);
      }
    }

    // Mettre à jour le statut précédent
    setPreviousStatus(connectionStatus.status);
  }, [connectionStatus.status, previousStatus]);

  // Si on est connecté et qu'on avait une barre de perte de connexion, la masquer
  useEffect(() => {
    if (connectionStatus.status === "connected" && isOfflineBar) {
      setShowBar(false);
      setIsOfflineBar(false);
    }
  }, [connectionStatus.status, isOfflineBar]);

  if (!showBar) return null;

  const getStatusConfig = () => {
    if (isOfflineBar) {
      return {
        icon: <WifiOff className="h-5 w-5" />,
        title: "Connexion perdue",
        message:
          "Votre connexion Internet a été interrompue.",
        bgColor: "bg-red-500",
        textColor: "text-white",
        borderColor: "border-red-600",
      };
    } else {
      return {
        icon: <CheckCircle className="h-5 w-5" />,
        title: "Connexion rétablie",
        message: "Votre connexion Internet a été rétablie avec succès",
        bgColor: "bg-green-500",
        textColor: "text-white",
        borderColor: "border-green-600",
      };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${config.bgColor} ${config.textColor} shadow-lg border-t ${config.borderColor}`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {config.icon}
            <div>
              <h3 className="font-semibold text-sm">{config.title}</h3>
              <p className="text-xs opacity-90">{config.message}</p>
            </div>
          </div>

          {/* Bouton de fermeture seulement pour la barre de rétablissement */}
          {!isOfflineBar && (
            <button
              onClick={() => setShowBar(false)}
              className="opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Fermer la notification"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
