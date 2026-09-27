import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const StoreLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-950 text-surface-100 selection:bg-gold-500 selection:text-surface-950">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
