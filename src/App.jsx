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
import EmergencyManagementView from './views/emergency/EmergencyManagementView';
import ProductManagementView from './views/marketplace/ProductManagementView';
import OrderManagementView from './views/marketplace/OrderManagementView';
import CategoryManagementView from './views/marketplace/CategoryManagementView';
import FeedbackManagementView from './views/feedback/FeedbackManagementView';
import PricingManagementView from './views/pricing/PricingManagementView';
import PayoutManagementView from './views/payouts/PayoutManagementView';
import ConnectorManagementView from './views/connectors/ConnectorManagementView';
import PartnerComplaintsView from './views/partner-complaints/PartnerComplaintsView';
import PartnerComplaintDetailView from './views/partner-complaints/PartnerComplaintDetailView';
import EnquiriesView from './views/enquiries/EnquiriesView';
import FAQManagementView from './views/faq/FAQManagementView';
import CustomerReviewsView from './views/reviews/CustomerReviewsView';
import BlogManagementView from './views/blog/BlogManagementView';
import NewsletterView from './views/newsletter/NewsletterView';
import TeamManagementView from './views/team/TeamManagementView';
import SubAdminManagementView from './views/subadmin/SubAdminManagementView';
import LiveChatView from './views/live-chat/LiveChatView';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
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
            style: { background: '#10b981' }
          },
          error: {
            style: { background: '#ef4444' }
          }
        }} 
      />
      <Routes>
        <Route path="/login" element={<LoginView />} />
        
        <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<ProtectedRoute permission="dashboard"><DashboardView /></ProtectedRoute>} />
          <Route path="live-chat" element={<ProtectedRoute permission="live-chat"><LiveChatView /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute permission="users"><UserManagementView /></ProtectedRoute>} />
          <Route path="stations" element={<ProtectedRoute permission="stations"><StationManagementView /></ProtectedRoute>} />
          <Route path="partners" element={<ProtectedRoute permission="partners"><PartnerManagementView /></ProtectedRoute>} />
          <Route path="partner-complaints" element={<ProtectedRoute permission="partner-complaints"><PartnerComplaintsView /></ProtectedRoute>} />
          <Route path="partner-complaints/:id" element={<ProtectedRoute permission="partner-complaints"><PartnerComplaintDetailView /></ProtectedRoute>} />
          <Route path="franchise" element={<ProtectedRoute permission="franchise"><FranchiseManagementView /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute permission="payments"><PaymentMonitoringView /></ProtectedRoute>} />
          <Route path="refunds" element={<ProtectedRoute permission="refunds"><RefundManagementView /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute permission="analytics"><AnalyticsView /></ProtectedRoute>} />
          <Route path="carbon" element={<ProtectedRoute permission="carbon"><CarbonDashboardView /></ProtectedRoute>} />
          <Route path="gov" element={<ProtectedRoute permission="gov"><GovernmentDashboardView /></ProtectedRoute>} />
          <Route path="heatmap" element={<ProtectedRoute permission="heatmap"><HeatmapView /></ProtectedRoute>} />
          <Route path="cities" element={<ProtectedRoute permission="cities"><CityAnalyticsView /></ProtectedRoute>} />
          <Route path="cms" element={<ProtectedRoute permission="cms"><CMSView /></ProtectedRoute>} />
          <Route path="enquiries" element={<ProtectedRoute permission="enquiries"><EnquiriesView /></ProtectedRoute>} />
          <Route path="faq" element={<ProtectedRoute permission="faq"><FAQManagementView /></ProtectedRoute>} />
          <Route path="reviews" element={<ProtectedRoute permission="reviews"><CustomerReviewsView /></ProtectedRoute>} />
          <Route path="blog" element={<ProtectedRoute permission="blog"><BlogManagementView /></ProtectedRoute>} />
          <Route path="newsletter" element={<ProtectedRoute permission="newsletter"><NewsletterView /></ProtectedRoute>} />
          <Route path="our-team" element={<ProtectedRoute permission="our-team"><TeamManagementView /></ProtectedRoute>} />
          <Route path="sub-admins" element={<ProtectedRoute superAdminOnly={true}><SubAdminManagementView /></ProtectedRoute>} />
          <Route path="tickets" element={<ProtectedRoute permission="tickets"><TicketManagementView /></ProtectedRoute>} />
          <Route path="offers" element={<ProtectedRoute permission="offers"><OfferManagementView /></ProtectedRoute>} />
          <Route path="news" element={<ProtectedRoute permission="news"><NewsManagementView /></ProtectedRoute>} />
          <Route path="bookings" element={<ProtectedRoute permission="bookings"><BookingManagementView /></ProtectedRoute>} />
          <Route path="emergency" element={<ProtectedRoute permission="emergency"><EmergencyManagementView /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute permission="reports"><ReportsView /></ProtectedRoute>} />
          <Route path="support" element={<ProtectedRoute permission="support"><SupportCenterView /></ProtectedRoute>} />
          <Route path="audit" element={<ProtectedRoute permission="audit"><AuditLogView /></ProtectedRoute>} />
          <Route path="security" element={<ProtectedRoute permission="security"><SecurityCenterView /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute permission="settings"><SettingsView /></ProtectedRoute>} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="profile" element={<ProfileView />} />
          {/* Marketplace Routes */}
          <Route path="marketplace/products" element={<ProtectedRoute permission="marketplace"><ProductManagementView /></ProtectedRoute>} />
          <Route path="marketplace/orders" element={<ProtectedRoute permission="marketplace"><OrderManagementView /></ProtectedRoute>} />
          <Route path="marketplace/categories" element={<ProtectedRoute permission="marketplace"><CategoryManagementView /></ProtectedRoute>} />
          {/* Feedback */}
          <Route path="feedback" element={<ProtectedRoute permission="feedback"><FeedbackManagementView /></ProtectedRoute>} />
          <Route path="pricing" element={<ProtectedRoute permission="pricing"><PricingManagementView /></ProtectedRoute>} />
          <Route path="payouts" element={<ProtectedRoute permission="payouts"><PayoutManagementView /></ProtectedRoute>} />
          <Route path="connectors" element={<ProtectedRoute permission="connectors"><ConnectorManagementView /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
