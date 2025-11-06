// src/contexts/LoadingContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";
import styled, { keyframes } from "styled-components";

interface LoadingContextType {
  isLoading: boolean;
  showLoading: () => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  const showLoading = () => setIsLoading(true);
  const hideLoading = () => setIsLoading(false);

  return (
    <LoadingContext.Provider value={{ isLoading, showLoading, hideLoading }}>
      {children}
      {isLoading && (
        <Overlay>
          <LoadingWave>
            <Bar style={{ animationDelay: "0s" }} />
            <Bar style={{ animationDelay: "0.1s" }} />
            <Bar style={{ animationDelay: "0.2s" }} />
            <Bar style={{ animationDelay: "0.3s" }} />
          </LoadingWave>
        </Overlay>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) throw new Error("useLoading must be used within a LoadingProvider");
  return context;
};

// Styled Components
const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const waveAnim = keyframes`
  0% { height: 10px; }
  50% { height: 50px; }
  100% { height: 10px; }
`;

const LoadingWave = styled.div`
  width: 150px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
`;

const Bar = styled.div`
  width: 20px;
  height: 10px;
  background-color: #4727a0;
  border-radius: 5px;
  animation: ${waveAnim} 1s ease-in-out infinite;
`;
