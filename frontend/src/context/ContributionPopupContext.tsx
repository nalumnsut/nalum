import { createContext, type ReactNode, useContext } from "react";

const ContributionPopupContext = createContext<(() => void) | null>(null);

interface ContributionPopupProviderProps {
  children: ReactNode;
  onOpen: () => void;
}

export function ContributionPopupProvider({
  children,
  onOpen,
}: ContributionPopupProviderProps) {
  return (
    <ContributionPopupContext.Provider value={onOpen}>
      {children}
    </ContributionPopupContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContributionPopup() {
  const openContributionPopup = useContext(ContributionPopupContext);

  if (!openContributionPopup) {
    throw new Error(
      "useContributionPopup must be used within ContributionPopupProvider",
    );
  }

  return openContributionPopup;
}
