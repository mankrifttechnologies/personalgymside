import {
  Dumbbell, Brain, Utensils, Trophy, Flame, Swords,
  Users, MessageCircle, Award, TrendingUp, Target,
  BarChart3, DollarSign, Calendar, ClipboardList,
  Bell, Mail, MessageSquare, Megaphone,
  CreditCard, BookOpen, Activity, Gift,
  ChevronRight, Zap, Shield, Smartphone,
  Heart, Star, ArrowRight, CheckCircle2,
  PieChart, UserCheck, AlertTriangle, LineChart
} from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/* ── helpers ── */
const Slide = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`w-[1920px] h-[1080px] flex flex-col justify-center items-center p-24 ${className}`}>
    {children}
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <div className="bg-[hsl(222,30%,12%)]/80 border border-[hsl(222,30%,20%)] rounded-2xl p-8 flex flex-col gap-4 hover:border-primary/50 transition-colors">
    <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
      <Icon className="w-7 h-7 text-primary" />
    </div>
    <h3 className="text-[28px] font-bold text-[hsl(0,0%,95%)]">{title}</h3>
    <p className="text-[20px] text-[hsl(0,0%,60%)] leading-relaxed">{desc}</p>
  </div>
);

const SectionTag = ({ text }: { text: string }) => (
  <div className="px-6 py-2 rounded-full bg-primary/15 text-primary text-[20px] font-semibold tracking-wide uppercase mb-6">
    {text}
  </div>
);

/* ── slides ── */

export function Slide1() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(222,47%,11%)] to-[hsl(260,40%,12%)] text-center relative overflow-hidden">
      {/* decorative circles */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 -top-40 -right-40" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-primary/5 -bottom-20 -left-20" />
      
      <div className="flex items-center gap-5 mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-[hsl(var(--primary)/0.6)] flex items-center justify-center">
          <Dumbbell className="w-10 h-10 text-primary-foreground" />
        </div>
        <span className="text-[56px] font-bold text-[hsl(0,0%,95%)] tracking-tight">FitAI Coach</span>
      </div>
      <h1 className="text-[72px] font-extrabold text-[hsl(0,0%,98%)] leading-tight max-w-[1400px] mb-6">
        The Complete Gym<br />Management Platform
      </h1>
      <p className="text-[28px] text-[hsl(0,0%,55%)] max-w-[900px] leading-relaxed">
        AI-powered workouts · Smart analytics · Social engagement · All in one app
      </p>
      <div className="flex gap-3 mt-12">
        {["Members", "Trainers", "Owners"].map(r => (
          <div key={r} className="px-6 py-3 rounded-full border border-[hsl(222,30%,25%)] text-[20px] text-[hsl(0,0%,70%)]">
            For {r}
          </div>
        ))}
      </div>
    </Slide>
  );
}

export function Slide2() {
  const problems = [
    { icon: ClipboardList, text: "Attendance tracked on paper or spreadsheets" },
    { icon: DollarSign, text: "Payments managed across multiple platforms" },
    { icon: MessageSquare, text: "Member communication through scattered channels" },
    { icon: BarChart3, text: "No real-time analytics or insights" },
    { icon: Users, text: "Zero member engagement or retention tools" },
    { icon: AlertTriangle, text: "Can't predict churn or optimize revenue" },
  ];
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,11%)]">
      <SectionTag text="The Problem" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-4">
        Gyms Juggle 10+ Disconnected Tools
      </h2>
      <p className="text-[24px] text-[hsl(0,0%,55%)] text-center mb-14 max-w-[900px]">
        From attendance to payments, classes to communication — gym owners are overwhelmed.
      </p>
      <div className="grid grid-cols-3 gap-6 w-full max-w-[1500px]">
        {problems.map((p, i) => (
          <div key={i} className="flex items-center gap-5 bg-[hsl(0,70%,15%)]/20 border border-[hsl(0,50%,25%)]/30 rounded-xl p-6">
            <p.icon className="w-8 h-8 text-[hsl(0,70%,65%)] shrink-0" />
            <span className="text-[22px] text-[hsl(0,0%,75%)]">{p.text}</span>
          </div>
        ))}
      </div>
    </Slide>
  );
}

export function Slide3() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(260,40%,12%)] text-center">
      <SectionTag text="The Solution" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] mb-6">
        One Platform. Everything You Need.
      </h2>
      <p className="text-[24px] text-[hsl(0,0%,55%)] max-w-[900px] mb-16">
        FitAI Coach unifies member experience, gym operations, and business intelligence into a single, beautiful application.
      </p>
      <div className="flex gap-8">
        {[
          { icon: Smartphone, title: "Member App", desc: "Workout tracking, nutrition, social features, and gamification" },
          { icon: Shield, title: "Admin Dashboard", desc: "Revenue, analytics, attendance, class management, and communications" },
          { icon: Brain, title: "AI Engine", desc: "Smart workouts, food analysis, churn prediction, and exercise demos" },
        ].map((item, i) => (
          <div key={i} className="flex-1 bg-[hsl(222,30%,12%)]/80 border border-[hsl(222,30%,20%)] rounded-2xl p-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
              <item.icon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-[32px] font-bold text-[hsl(0,0%,95%)] mb-3">{item.title}</h3>
            <p className="text-[20px] text-[hsl(0,0%,55%)] leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}

export function Slide4() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,11%)]">
      <SectionTag text="For Members" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-12">
        Powerful Member Features
      </h2>
      <div className="grid grid-cols-3 gap-6 w-full max-w-[1500px]">
        <FeatureCard icon={Brain} title="AI Workouts" desc="Personalized workout plans generated by AI based on goals and fitness level" />
        <FeatureCard icon={Utensils} title="Nutrition Tracking" desc="Log calories, macros, scan food with AI, and follow custom meal plans" />
        <FeatureCard icon={Dumbbell} title="Workout Logging" desc="Track every set, rep, and weight with progressive overload suggestions" />
        <FeatureCard icon={Flame} title="Streaks & XP" desc="Daily streaks, experience points, and level progression to stay motivated" />
        <FeatureCard icon={Award} title="Badges & Rewards" desc="Earn badges for milestones and redeem points for real gym rewards" />
        <FeatureCard icon={Swords} title="Workout Duels" desc="Challenge friends to real-time workout competitions" />
      </div>
    </Slide>
  );
}

export function Slide5() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(260,40%,12%)]">
      <SectionTag text="Social & Engagement" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-12">
        Built-In Social Platform
      </h2>
      <div className="grid grid-cols-3 gap-6 w-full max-w-[1500px]">
        <FeatureCard icon={Heart} title="Stories" desc="Share workout moments with Instagram-style stories that expire in 24h" />
        <FeatureCard icon={Users} title="Friends & Follows" desc="Follow other members, view profiles, and build a fitness community" />
        <FeatureCard icon={Trophy} title="Leaderboards" desc="Weekly and all-time rankings for attendance, streaks, and workouts" />
        <FeatureCard icon={Target} title="Group Challenges" desc="Team-based challenges with live scoreboards and XP rewards" />
        <FeatureCard icon={MessageCircle} title="Messaging" desc="WhatsApp-style real-time chat with read receipts and typing indicators" />
        <FeatureCard icon={Star} title="Photo Feed" desc="Share progress photos with likes, comments, and community engagement" />
      </div>
    </Slide>
  );
}

export function Slide6() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,11%)]">
      <SectionTag text="For Gym Owners" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-12">
        Complete Admin Dashboard
      </h2>
      <div className="grid grid-cols-2 gap-8 w-full max-w-[1400px]">
        {[
          { icon: BarChart3, title: "Real-Time Analytics", desc: "Member activity, attendance trends, and engagement metrics at a glance" },
          { icon: DollarSign, title: "Revenue Tracking", desc: "Payment records, invoice generation, and financial summaries with tax reports" },
          { icon: UserCheck, title: "Attendance System", desc: "Biometric check-in support, streak tracking, and automated checkout" },
          { icon: Calendar, title: "Class Management", desc: "Schedule classes, manage bookings, assign instructors, and track capacity" },
        ].map((item, i) => (
          <div key={i} className="bg-[hsl(222,30%,12%)]/80 border border-[hsl(222,30%,20%)] rounded-2xl p-10 flex gap-8 items-start">
            <div className="w-16 h-16 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <item.icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-[28px] font-bold text-[hsl(0,0%,95%)] mb-2">{item.title}</h3>
              <p className="text-[20px] text-[hsl(0,0%,55%)] leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

export function Slide7() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(260,40%,12%)]">
      <SectionTag text="Intelligence" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-12">
        Advanced Analytics & AI
      </h2>
      <div className="grid grid-cols-2 gap-8 w-full max-w-[1400px]">
        <FeatureCard icon={PieChart} title="Churn Prediction" desc="AI identifies at-risk members before they leave, enabling proactive retention" />
        <FeatureCard icon={LineChart} title="Revenue Forecasting" desc="Project future revenue based on trends, plans, and member growth patterns" />
        <FeatureCard icon={Users} title="Member Segmentation" desc="Automatically segment members by behavior, plan type, and engagement level" />
        <FeatureCard icon={ClipboardList} title="Custom Reports" desc="Build and export custom reports with flexible filters and date ranges" />
      </div>
    </Slide>
  );
}

export function Slide8() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(222,47%,11%)]">
      <SectionTag text="Communication" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-12">
        Powerful Communication Hub
      </h2>
      <div className="grid grid-cols-2 gap-8 w-full max-w-[1400px]">
        <FeatureCard icon={Bell} title="Bulk Notifications" desc="Send targeted notifications to all members or specific segments instantly" />
        <FeatureCard icon={CreditCard} title="Payment Reminders" desc="Automated reminders for upcoming and overdue payments" />
        <FeatureCard icon={Mail} title="Feedback Collection" desc="Create custom surveys and collect member feedback to improve services" />
        <FeatureCard icon={Megaphone} title="Announcements" desc="Push announcements with pop-up alerts and mark-as-read tracking" />
      </div>
    </Slide>
  );
}

export function Slide9() {
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] to-[hsl(260,40%,12%)]">
      <SectionTag text="And More" />
      <h2 className="text-[56px] font-bold text-[hsl(0,0%,95%)] text-center mb-12">
        Everything Else Built In
      </h2>
      <div className="grid grid-cols-3 gap-6 w-full max-w-[1500px]">
        <FeatureCard icon={CreditCard} title="Membership Plans" desc="Create and manage flexible plans with Stripe-powered payments" />
        <FeatureCard icon={UserCheck} title="PT Sessions" desc="Book, manage, and track personal training sessions" />
        <FeatureCard icon={BookOpen} title="Exercise Library" desc="Searchable library with AI-generated video demonstrations" />
        <FeatureCard icon={Activity} title="Mobility Routines" desc="Pre-built warm-up and cooldown routines for injury prevention" />
        <FeatureCard icon={Gift} title="Rewards System" desc="Points wallet, catalog, and redemption with admin fulfillment" />
        <FeatureCard icon={TrendingUp} title="Progress Tracking" desc="Body measurements, personal records, and visual progress charts" />
      </div>
    </Slide>
  );
}

export function Slide10() {
  const highlights = [
    "AI-Powered Workouts & Nutrition",
    "Complete Social Platform",
    "Advanced Business Analytics",
    "Automated Communications",
    "Gamification & Rewards",
    "Mobile-First Design",
  ];
  return (
    <Slide className="bg-gradient-to-br from-[hsl(222,47%,8%)] via-[hsl(260,40%,12%)] to-[hsl(222,47%,8%)] text-center relative overflow-hidden">
      <div className="absolute w-[800px] h-[800px] rounded-full bg-primary/5 -top-60 -left-60" />
      <div className="absolute w-[600px] h-[600px] rounded-full bg-primary/5 -bottom-40 -right-40" />

      <SectionTag text="Let's Talk" />
      <h2 className="text-[64px] font-extrabold text-[hsl(0,0%,98%)] mb-6">
        Ready to Transform Your Gym?
      </h2>
      <p className="text-[24px] text-[hsl(0,0%,55%)] max-w-[800px] mb-14">
        Join the next generation of gym management with a platform your members will love.
      </p>
      <div className="grid grid-cols-3 gap-4 max-w-[1100px] mb-14">
        {highlights.map((h, i) => (
          <div key={i} className="flex items-center gap-3 bg-[hsl(222,30%,12%)]/60 border border-[hsl(222,30%,20%)] rounded-xl px-6 py-4">
            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
            <span className="text-[20px] text-[hsl(0,0%,80%)]">{h}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 px-10 py-5 rounded-2xl bg-gradient-to-r from-primary to-[hsl(var(--primary)/0.7)] text-primary-foreground">
        <Zap className="w-8 h-8" />
        <span className="text-[28px] font-bold">Get Started Today</span>
        <ArrowRight className="w-8 h-8" />
      </div>
    </Slide>
  );
}

export const slides = [Slide1, Slide2, Slide3, Slide4, Slide5, Slide6, Slide7, Slide8, Slide9, Slide10];
