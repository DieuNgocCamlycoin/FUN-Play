import React, { createContext, useState, useContext, ReactNode } from 'react';

interface MusicContextType {
  isPageMusicActive: boolean;
  setPageMusicActive: (active: boolean) => void;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: ReactNode }) => {
  const [isPageMusicActive, setPageMusicActive] = useState(false);

  return (
    <MusicContext.Provider value={{ isPageMusicActive, setPageMusicActive }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
