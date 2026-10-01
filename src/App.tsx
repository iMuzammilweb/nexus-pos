import React, { useState, useEffect } from 'react';
import { NexusProvider, useNexus } from './context/NexusContext';
import { PosHeader } from './components/pos/PosHeader';
import { PosMenuScreen } from './components/pos/PosMenuScreen';
import { PosCartSidebar } from './components/pos/PosCartSidebar';
import { PosOrderManagement } from './components/pos/PosOrderManagement';
import { StoreManagementDashboard } from './components/dashboard/StoreManagementDashboard';
import { NexusLoginScreen } from './components/auth/NexusLoginScreen';
import { DeviceAuthorizationScreen } from './components/auth/DeviceAuthorizationScreen';
import { checkDeviceStatus, DeviceAuthStatus } from './services/deviceAuthService';
import { StaffPhoneOrderScreen } from './components/pos/StaffPhoneOrderScreen';
import { VariantSelectionModal } from './components/pos/VariantSelectionModal';
import { ModifierSelectionModal } from './components/pos/ModifierSelectionModal';
import { ProductOptionModal } from './components/pos/ProductOptionModal';
import { OrderCheckScreen } from './components/pos/OrderCheckScreen';
import { MenuManagementModal } from './components/pos/MenuManagementModal';
import { ReportsDashboardModal } from './components/pos/ReportsDashboardModal';
import { StaffLockModal } from './components/pos/StaffLockModal';
import { CashDrawerModal } from './components/pos/CashDrawerModal';
import { GlobalSearchModal } from './components/pos/GlobalSearchModal';
import { NotificationsDrawer } from './components/pos/NotificationsDrawer';
import { CheckoutPaymentModal } from './components/pos/CheckoutPaymentModal';
import { ThermalReceiptModal } from './components/pos/ThermalReceiptModal';
import { StoreSelectionScreen } from './components/pos/StoreSelectionScreen';
import { IncomingOrderAlertBanner } from './components/pos/IncomingOrderAlertBanner';
import { NotificationToast } from './components/pos/NotificationToast';
import { PosTableManagementModal } from './components/pos/PosTableManagementModal';
import { GlobalOrderHistoryModal } from './components/pos/GlobalOrderHistoryModal';
import { ShieldCheck } from 'lucide-react';

const NexusPosApp: React.FC = () => {
  const { activeAppView, currentUser } = useNexus();

  // Zero-Trust Device Authorization State
  const [isCheckingDeviceAuth, setIsCheckingDeviceAuth] = useState(true);
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState(false);
  const [deviceAuthStatus, setDeviceAuthStatus] = useState<DeviceAuthStatus | null>(null);

  const verifyDevice = async () => {
    try {
      const status = await checkDeviceStatus();
      setDeviceAuthStatus(status);
      setIsDeviceAuthorized(status.isAuthorized);
    } catch {
      setIsDeviceAuthorized(false);
    } finally {
      setIsCheckingDeviceAuth(false);
    }
  };

  useEffect(() => {
    verifyDevice();

    // Check device validity on window focus or interval
    const handleFocus = () => {
      verifyDevice();
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(verifyDevice, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  // 1. Initial Device Authorization Check Loading Screen
  if (isCheckingDeviceAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-[#172033] font-sans">
        <div className="flex flex-col items-center gap-3 p-8 bg-white rounded-3xl border border-[#E5EAF2] shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 animate-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div className="text-center">
            <div className="text-sm font-black text-[#172033]">Checking Device Security...</div>
            <div className="text-xs text-[#64748B] mt-0.5">Nexus POS Terminal Verification</div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Hardware Gate: If device is not authorized or revoked, show Device Authorization Screen
  if (!isDeviceAuthorized) {
    return (
      <DeviceAuthorizationScreen
        onAuthorized={() => {
          setIsDeviceAuthorized(true);
        }}
        initialStatus={deviceAuthStatus}
      />
    );
  }

  // 3. If active view is store selection gateway
  if (activeAppView === 'store-selection') {
    return <StoreSelectionScreen />;
  }

  // 4. If active view is login or no logged in user, show standard 3-tier login portal
  if (activeAppView === 'login' || !currentUser) {
    return <NexusLoginScreen />;
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F8FAFC] text-[#172033] font-sans antialiased selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Persistent Live Audio-Visual Alert Banner */}
      <IncomingOrderAlertBanner />

      {/* Floating Notification Toast */}
      <NotificationToast />

      {/* 1. Main View Rendering */}
      {activeAppView === 'store-selection' ? (
        <StoreSelectionScreen />
      ) : activeAppView === 'dashboard' ? (
        <StoreManagementDashboard />
      ) : (
        <div className="flex flex-col h-full w-full overflow-hidden">
          {/* POS Header (70px) */}
          <PosHeader />

          {/* POS Subviews */}
          <div className="flex-1 flex overflow-hidden">
            {(activeAppView === 'pos-menu' || activeAppView === 'staff-pos') && (
              <>
                <PosMenuScreen />
                <PosCartSidebar />
              </>
            )}

            {activeAppView === 'pos-orders' && <PosOrderManagement />}
          </div>
        </div>
      )}

      {/* 2. Global Interactive Modals & Reference 1/2 Screens */}
      <ProductOptionModal />
      <OrderCheckScreen />
      <MenuManagementModal />
      <ReportsDashboardModal />
      <StaffLockModal />
      <VariantSelectionModal />
      <ModifierSelectionModal />
      <CheckoutPaymentModal />
      <CashDrawerModal />
      <GlobalSearchModal />
      <NotificationsDrawer />
      <ThermalReceiptModal />
      <PosTableManagementModal />
      <GlobalOrderHistoryModal />
    </div>
  );
};

export default function App() {
  return (
    <NexusProvider>
      <NexusPosApp />
    </NexusProvider>
  );
}
