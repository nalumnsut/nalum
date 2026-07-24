import { useState, Suspense } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Outlet } from 'react-router-dom';

const Root = () => {
  const [headerHeight, setHeaderHeight] = useState(0);

  return (
    <div className="flex flex-col min-h-screen">
      <Header setHeaderHeight={setHeaderHeight} />
      <main className="flex-grow" style={{ paddingTop: `${headerHeight}px` }}>
        <Suspense fallback={<div className="min-h-[60vh]" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Root;