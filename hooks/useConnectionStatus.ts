import { useEffect, useRef, useState } from "react";

export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isNetworkHealthy, setIsNetworkHealthy] = useState<boolean>(true);
  const previousStatusRef = useRef<string | null>(null);

  useEffect(() => {
    // Vérifier si on est côté client
    if (typeof window === "undefined") {
      return;
    }

    // État initial
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Vérifier la connectivité réseau
    const checkNetworkHealth = async () => {
      try {
        // Essayer de faire une requête légère pour vérifier la connectivité
        const response = await fetch("/api/statistiques", {
          method: "HEAD",
          cache: "no-cache",
        });
        setIsNetworkHealthy(response.ok);
      } catch (error) {
        setIsNetworkHealthy(false);
      }
    };

    // État initial
    updateOnlineStatus();
    checkNetworkHealth();

    // Écouteurs d'événements
    const handleOnline = () => {
      console.log("🟢 Événement 'online' détecté");
      setIsOnline(true);
      // Re-vérifier la connectivité réseau quand on revient en ligne
      setTimeout(checkNetworkHealth, 1000);
    };

    const handleOffline = () => {
      console.log("🔴 Événement 'offline' détecté");
      setIsOnline(false);
      setIsNetworkHealthy(false);
    };

    // Écouter les changements de connectivité
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérifier périodiquement la connectivité réseau (toutes les 30 secondes)
    const networkCheckInterval = setInterval(checkNetworkHealth, 30000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(networkCheckInterval);
    };
  }, []);

  // Calculer le statut actuel
  const currentStatus =
    isOnline === null
      ? "loading"
      : isOnline && isNetworkHealthy
      ? "connected"
      : "disconnected";

  // Détecter les changements de statut
  useEffect(() => {
    if (
      previousStatusRef.current !== null &&
      previousStatusRef.current !== currentStatus
    ) {
      console.log(
        `🔄 Changement de statut: ${previousStatusRef.current} → ${currentStatus}`
      );
    }
    previousStatusRef.current = currentStatus;
  }, [currentStatus]);

  // Retourner un objet avec plus d'informations
  return {
    isOnline: isOnline ?? true, // Fallback à true si null (SSR)
    isNetworkHealthy,
    isLoading: isOnline === null,
    status: currentStatus,
    previousStatus: previousStatusRef.current,
  };
}
