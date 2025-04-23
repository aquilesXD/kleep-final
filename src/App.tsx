import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProfileGeneral from './pages/profile/ProfileGeneral';
import ProfileConnectedAccounts from './pages/profile/ProfileConnectedAccounts';
import ProfileSecurity from './pages/profile/ProfileSecurity';
import ProfilePaymentMethods from './pages/profile/ProfilePaymentMethods';
import ProfileBalance from './pages/profile/ProfileBalance';
import Layout from './components/layout/Layout';
import SignIn from './pages/auth/SignIn';
import SignUp from './pages/auth/SignUp';
import VerifyCode from './pages/auth/VerifyCode';
import { Toaster } from 'react-hot-toast';
import Campaign from './components/camapaign/Campaign';
import CampaignStartHere from './components/camapaign/CampaignStartHere';
import CampaignRewards from './components/camapaign/CampaignRewards';
import { CampaignAds } from './components/camapaign/CampaignAds';
import Home from './components/camapaign/Home';
import { NotificationsPage } from './components/notifications/NotificationsPage';
import CampaignVideos from './components/camapaign/CampaignVideos';
import { AuthProvider } from './AuthContext';


function App() {
  return (
    <AuthProvider>
    <Router>
      <div className="min-h-screen bg-[#0c0c0c]">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#161616',
              color: '#fff',
              border: '1px solid #3f3f3f',
              padding: '12px 16px',
              fontSize: '14px'
            }
          }}
        />

        <Routes>
          {/* Default redirect - Ahora redirige a campaign-home */}
          <Route path="/" element={<Navigate to="/campaign-home" replace />} />

          {/* Auth Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-code" element={<VerifyCode />} />

          {/* Public Campaign Routes */}
          <Route path="/campaign-home" element={<Home />} />
          
          {/* Other Campaign Routes (pueden requerir autenticación) */}
          <Route path="/campaign" element={<Campaign />} />
          <Route path="/campaign/:campaignId" element={<Campaign />} />
          <Route path="/campaign-start-here" element={<CampaignStartHere />} />
          <Route path="/campaign-rewards" element={<CampaignRewards />} />
          <Route path="/campaign-ads" element={<CampaignAds />} />
          <Route path="/campaign-videos" element={<CampaignVideos />} />

          {/* Notifications Route */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Protected Routes with Layout */}
          <Route path="/" element={<Layout />}>
            <Route path="profile" element={<ProfileGeneral />} />
            <Route path="profile-cuentas" element={<ProfileConnectedAccounts />} />
            <Route path="profile-seguridad" element={<ProfileSecurity />} />
            <Route path="profile-formas-de-pago" element={<ProfilePaymentMethods />} />
            <Route path="profile-saldo" element={<ProfileBalance />} />
          </Route>

          {/* Fallback - Redirige a campaign-home en lugar de signin */}
          <Route path="*" element={<Navigate to="/campaign-home" replace />} />
        </Routes>
      </div>
    </Router>
    </AuthProvider>
  );
}

export default App;
