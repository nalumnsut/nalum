import { useCallback, useState, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ContributionPopup } from '@/components/ContributionPopup';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { ContributionPopupProvider } from '@/context/ContributionPopupContext';
import { Outlet, useLocation } from 'react-router-dom';

const Root = () => {
  const location = useLocation();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [showIntro, setShowIntro] = useState(location.pathname === '/');
  const [popupOpenRequest, setPopupOpenRequest] = useState(0);

  const openContributionPopup = useCallback(() => {
    setPopupOpenRequest((request) => request + 1);
  }, []);

  return (
    <ContributionPopupProvider onOpen={openContributionPopup}>
      <div className="flex flex-col min-h-screen">
        {showIntro && (
          <LoadingAnimation onAnimationComplete={() => setShowIntro(false)} />
        )}
        <Header setHeaderHeight={setHeaderHeight} />
        <main className="flex-grow" style={{ paddingTop: `${headerHeight}px` }}>
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <Outlet />
          </Suspense>
        </main>
        <Footer />
        <ContributionPopup
          ready={!showIntro}
          openRequest={popupOpenRequest}
        />
      </div>
    </ContributionPopupProvider>
  );
};

export default Root;
