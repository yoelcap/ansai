"use client";

import { createContext, useContext } from "react";

interface PendingCountContextValue {
  refreshPendingCount: () => void;
}

export const PendingCountContext = createContext<PendingCountContextValue>({
  refreshPendingCount: () => {},
});

export function usePendingCount() {
  return useContext(PendingCountContext);
}
