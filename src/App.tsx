import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import SplashScreen from "@/components/SplashScreen";
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
import Explorer from "./pages/Explorer";
import AdminDashboard from "./pages/AdminDashboard";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

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
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/workout" element={<Workout />} />
                <Route path="/nutrition" element={<Nutrition />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/measurements" element={<Measurements />} />
                <Route path="/records" element={<Records />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/reminders" element={<Reminders />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/history" element={<History />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/member/:id" element={<MemberProfile />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/support" element={<Support />} />
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
