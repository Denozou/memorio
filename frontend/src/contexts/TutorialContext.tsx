import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import { api } from "../lib/api";
import Tutorial from "../components/Tutorial";

interface TutorialContextType {
  showTutorial: () => void;
  hideTutorial: () => void;
  isVisible: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function TutorialProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  // Check if user needs to see tutorial on first load (only on protected routes)
  useEffect(() => {
    let alive = true;
    
    // Only check tutorial status on protected routes (not on public pages)
    const publicPaths = ['/login', '/signup', '/auth/', '/landing', '/'];
    const isPublicPage = publicPaths.some(path => 
      window.location.pathname === path || 
      (path !== '/' && window.location.pathname.startsWith(path))
    );
    
    if (isPublicPage) {
      setHasCheckedInitial(true);
      return;
    }
    
    const checkTutorialStatus = async () => {
      try {
        const { data } = await api.get<{ completed: boolean }>("/users/tutorial-status");
        if (alive && !data.completed) {
          setIsVisible(true);
        }
      } catch (e) {
        // Silently fail - user might not be logged in
      } finally {
        if (alive) setHasCheckedInitial(true);
      }
    };
    checkTutorialStatus();
    return () => { alive = false; };
  }, []);

  const showTutorial = () => setIsVisible(true);
  const hideTutorial = () => setIsVisible(false);

  const handleComplete = () => {
    setIsVisible(false);
  };

  const contextValue = useMemo(() => ({
    showTutorial,
    hideTutorial,
    isVisible
  }), [isVisible]);

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      {isVisible && hasCheckedInitial && <Tutorial onComplete={handleComplete} />}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
