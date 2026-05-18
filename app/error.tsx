"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center max-w-sm px-4">
        <p className="font-serif text-lg text-forest mb-2">Algo salió mal</p>
        <p className="text-sm text-muted mb-4">
          Hubo un error al cargar la página.
        </p>
        <button
          onClick={reset}
          className="btn-primary text-sm"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
