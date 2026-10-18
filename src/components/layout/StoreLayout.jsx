import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { StoreSettingsProvider } from '../../contexts/StoreSettingsContext';

const StoreLayout = () => {
  return (
    <StoreSettingsProvider>
      <div className="store-shell min-h-screen flex flex-col bg-[#fbfaf8] text-[#2b2926] selection:bg-[#d7c4a4] selection:text-[#2b2926]">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </StoreSettingsProvider>
  );
};

export default StoreLayout;
