import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import SplashScreen from "@/components/SplashScreen";
import BackButtonHandler from "@/components/BackButtonHandler";
import NativeSetup from "@/components/NativeSetup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Workout from "./pages/Workout";
import Nutrition from "./pages/Nutrition";
import Profile from "./pages/Profile";
import Progress from "./pages/Progress";
import Measurements from "./pages/Measurements";
import Records from "./pages/Records";
import Templates from "./pages/Templates";
import Reminders from "./pages/Reminders";
import Schedule from "./pages/Schedule";
import Friends from "./pages/Friends";
import History from "./pages/History";
import Attendance from "./pages/Attendance";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import MemberProfile from "./pages/MemberProfile";
import FollowList from "./pages/FollowList";
import Explorer from "./pages/Explorer";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import TrainerDashboard from "./pages/TrainerDashboard";
import Support from "./pages/Support";
import Messages from "./pages/Messages";
import Membership from "./pages/Membership";
import Install from "./pages/Install";
import Classes from "./pages/Classes";
import Duels from "./pages/Duels";
import Mobility from "./pages/Mobility";
import PTSessions from "./pages/PTSessions";
import NotFound from "./pages/NotFound";
import Demo from "./pages/Demo";
import RegisterOrganization from "./pages/RegisterOrganization";
import RegisterOwner from "./pages/RegisterOwner";
import RegisterMember from "./pages/RegisterMember";
import JoinGym from "./pages/JoinGym";
import QRCheckIn from "./pages/QRCheckIn";
import Market from "./pages/Market";
import GymLanding from "./pages/GymLanding";
import MemberRoute from "./components/MemberRoute";
import FloatingChatButton from "./components/FloatingChatButton";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
            <BrowserRouter>
              <NativeSetup />
              <BackButtonHandler />
              <FloatingChatButton />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/workout" element={<MemberRoute><Workout /></MemberRoute>} />
                <Route path="/nutrition" element={<MemberRoute><Nutrition /></MemberRoute>} />
                <Route path="/profile" element={<MemberRoute><Profile /></MemberRoute>} />
                <Route path="/progress" element={<MemberRoute><Progress /></MemberRoute>} />
                <Route path="/measurements" element={<MemberRoute><Measurements /></MemberRoute>} />
                <Route path="/records" element={<MemberRoute><Records /></MemberRoute>} />
                <Route path="/templates" element={<MemberRoute><Templates /></MemberRoute>} />
                <Route path="/reminders" element={<MemberRoute><Reminders /></MemberRoute>} />
                <Route path="/schedule" element={<MemberRoute><Schedule /></MemberRoute>} />
                <Route path="/friends" element={<MemberRoute><Friends /></MemberRoute>} />
                <Route path="/history" element={<MemberRoute><History /></MemberRoute>} />
                <Route path="/attendance" element={<MemberRoute><Attendance /></MemberRoute>} />
                <Route path="/leaderboard" element={<MemberRoute><Leaderboard /></MemberRoute>} />
                <Route path="/rewards" element={<MemberRoute><Rewards /></MemberRoute>} />
                <Route path="/member/:id" element={<MemberRoute><MemberProfile /></MemberRoute>} />
                <Route path="/follow/:userId/:tab" element={<MemberRoute><FollowList /></MemberRoute>} />
                <Route path="/explorer" element={<MemberRoute><Explorer /></MemberRoute>} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/owner" element={<OwnerDashboard />} />
                <Route path="/trainer" element={<TrainerDashboard />} />
                <Route path="/support" element={<MemberRoute><Support /></MemberRoute>} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/membership" element={<MemberRoute><Membership /></MemberRoute>} />
                <Route path="/install" element={<Install />} />
                <Route path="/classes" element={<MemberRoute><Classes /></MemberRoute>} />
                <Route path="/duels" element={<MemberRoute><Duels /></MemberRoute>} />
                <Route path="/mobility" element={<MemberRoute><Mobility /></MemberRoute>} />
                <Route path="/pt-sessions" element={<MemberRoute><PTSessions /></MemberRoute>} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/register-owner" element={<RegisterOwner />} />
                <Route path="/register" element={<RegisterMember />} />
                <Route path="/register-org" element={<RegisterOrganization />} />
                <Route path="/join-gym" element={<JoinGym />} />
                <Route path="/qr-checkin" element={<QRCheckIn />} />
                <Route path="/market" element={<Market />} />
                <Route path="/g/:gymCode" element={<GymLanding />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
