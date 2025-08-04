"use client";

interface SpinnerProps {
  className?: string;
}

export default function Spinner({ className = "" }: SpinnerProps) {
  return (
    <div
      className={`w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Chargement en cours"
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}
