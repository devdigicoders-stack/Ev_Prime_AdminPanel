import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginView from './views/auth/LoginView';
import AdminLayout from './layouts/AdminLayout';
import DashboardView from './views/dashboard/DashboardView';
import UserManagementView from './views/users/UserManagementView';
import StationManagementView from './views/stations/StationManagementView';
import PartnerManagementView from './views/partners/PartnerManagementView';
import FranchiseManagementView from './views/franchise/FranchiseManagementView';
import PaymentMonitoringView from './views/payments/PaymentMonitoringView';
import RefundManagementView from './views/refunds/RefundManagementView';
import AnalyticsView from './views/analytics/AnalyticsView';
import CarbonDashboardView from './views/carbon/CarbonDashboardView';
import GovernmentDashboardView from './views/gov/GovernmentDashboardView';
import HeatmapView from './views/heatmap/HeatmapView';
import CityAnalyticsView from './views/analytics/CityAnalyticsView';
import CMSView from './views/cms/CMSView';
import TicketManagementView from './views/tickets/TicketManagementView';
import ReportsView from './views/reports/ReportsView';
import SupportCenterView from './views/support/SupportCenterView';
import AuditLogView from './views/audit/AuditLogView';
import SecurityCenterView from './views/security/SecurityCenterView';
import SettingsView from './views/settings/SettingsView';
import NotificationsView from './views/notifications/NotificationsView';
import ProfileView from './views/profile/ProfileView';
import OfferManagementView from './views/offers/OfferManagementView';
import NewsManagementView from './views/news/NewsManagementView';
import BookingManagementView from './views/bookings/BookingManagementView';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Toaster 
        position="top-right" 
        toastOptions={{ 
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          },
          success: {
            style: { background: '#10b981' } // Emerald-500
          },
          error: {
            style: { background: '#ef4444' } // Red-500
          }
        }} 
      />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        
        {/* Admin Layout Routes */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardView />} />
          <Route path="users" element={<UserManagementView />} />
          <Route path="stations" element={<StationManagementView />} />
          <Route path="partners" element={<PartnerManagementView />} />
          <Route path="franchise" element={<FranchiseManagementView />} />
          <Route path="payments" element={<PaymentMonitoringView />} />
          <Route path="refunds" element={<RefundManagementView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="carbon" element={<CarbonDashboardView />} />
          <Route path="gov" element={<GovernmentDashboardView />} />
          <Route path="heatmap" element={<HeatmapView />} />
          <Route path="cities" element={<CityAnalyticsView />} />
          <Route path="cms" element={<CMSView />} />
          <Route path="tickets" element={<TicketManagementView />} />
          <Route path="offers" element={<OfferManagementView />} />
          <Route path="news" element={<NewsManagementView />} />
          <Route path="bookings" element={<BookingManagementView />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="support" element={<SupportCenterView />} />
          <Route path="audit" element={<AuditLogView />} />
          <Route path="security" element={<SecurityCenterView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="profile" element={<ProfileView />} />
          {/* Add more routes here as needed */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
