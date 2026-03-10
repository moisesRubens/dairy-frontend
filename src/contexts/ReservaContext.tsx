import React, { createContext, useContext, useState, useCallback } from 'react';

type ReservaContextType = {
  novaReserva: boolean;
  notificarNovaReserva: () => void;
  limparNotificacao: () => void;
};

const ReservaContext = createContext<ReservaContextType | undefined>(undefined);

export function ReservaProvider({ children }: { children: React.ReactNode }) {
  const [novaReserva, setNovaReserva] = useState(false);

  const notificarNovaReserva = useCallback(() => {
    setNovaReserva(true);
  }, []);

  const limparNotificacao = useCallback(() => {
    setNovaReserva(false);
  }, []);

  return (
    <ReservaContext.Provider value={{ novaReserva, notificarNovaReserva, limparNotificacao }}>
      {children}
    </ReservaContext.Provider>
  );
}

export function useReserva() {
  const context = useContext(ReservaContext);
  if (!context) {
    throw new Error('useReserva deve ser usado dentro de ReservaProvider');
  }
  return context;
}