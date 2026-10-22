import { Outlet } from 'react-router-dom';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { StoreSettingsProvider } from '../../contexts/StoreSettingsContext';

const StoreContent = () => {
  const { websiteConfig, themeStyle } = useStoreSettings();
  return (
    <div className="store-shell min-h-screen flex flex-col bg-[#fbfaf8] text-[#2b2926] selection:bg-[#d7c4a4] selection:text-[#2b2926]" style={themeStyle} data-theme-revision={websiteConfig?.revision || 0}>
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const StoreLayout = () => <StoreSettingsProvider><StoreContent /></StoreSettingsProvider>;

export default StoreLayout;
