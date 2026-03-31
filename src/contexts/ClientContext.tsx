import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Client } from "@/types";
import { useClients } from "@/hooks/useClients";

interface ClientContextType {
  clients: Client[];
  selectedClient: Client | null;
  selectedClientId: string | null;
  setSelectedClientId: (id: string | null) => void;
  isLoading: boolean;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const STORAGE_KEY = "selected_client_id";

export function ClientProvider({ children }: { children: ReactNode }) {
  const { data: clients = [], isLoading } = useClients();
  const [selectedClientId, setSelectedClientIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY),
  );

  // Persist selection
  const setSelectedClientId = (id: string | null) => {
    setSelectedClientIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Auto-select first client if none selected (or selection no longer valid)
  useEffect(() => {
    if (isLoading || clients.length === 0) return;
    const valid = selectedClientId && clients.some((c) => c._id === selectedClientId);
    if (!valid) {
      setSelectedClientId(clients[0]._id);
    }
  }, [clients, isLoading, selectedClientId]);

  const selectedClient = clients.find((c) => c._id === selectedClientId) || null;

  return (
    <ClientContext.Provider
      value={{ clients, selectedClient, selectedClientId, setSelectedClientId, isLoading }}
    >
      {children}
    </ClientContext.Provider>
  );
}

export function useSelectedClient() {
  const context = useContext(ClientContext);
  if (!context) throw new Error("useSelectedClient must be used within a ClientProvider");
  return context;
}
