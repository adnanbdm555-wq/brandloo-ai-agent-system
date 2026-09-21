import {
  LayoutDashboard,
  Building2,
  Megaphone,
  CalendarDays,
  PenSquare,
  Palette,
  Clapperboard,
  CheckCircle2,
  Send,
  BarChart3,
  Sparkles,
  Bot,
  Workflow,
  Link2,
  Image as ImageIcon,
  LayoutTemplate,
  Bell,
  Users,
  ScrollText,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  status: "live" | "phase";
  phaseLabel?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, status: "live" },
    ],
  },
  {
    label: "Plan",
    items: [
      { label: "Brands", href: "/brands", icon: Building2, status: "live" },
      { label: "Campaigns", href: "/campaigns", icon: Megaphone, status: "live" },
      { label: "Content Calendar", href: "/content-calendar", icon: CalendarDays, status: "live" },
    ],
  },
  {
    label: "Create",
    items: [
      { label: "Pipeline", href: "/pipeline", icon: Link2, status: "live" },
      { label: "Content Studio", href: "/content-studio", icon: PenSquare, status: "live" },
      { label: "Creative Studio", href: "/creative-studio", icon: Palette, status: "live" },
      { label: "Video Studio", href: "/video-studio", icon: Clapperboard, status: "live" },
    ],
  },
  {
    label: "Review & publish",
    items: [
      { label: "Approval Center", href: "/approvals", icon: CheckCircle2, status: "live" },
      { label: "Publishing", href: "/publishing", icon: Send, status: "live" },
    ],
  },
  {
    label: "Learn",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3, status: "live" },
      { label: "AI Insights", href: "/insights", icon: Sparkles, status: "live" },
    ],
  },
  {
    label: "Operate",
    items: [
      { label: "Agents", href: "/agents", icon: Bot, status: "live" },
      { label: "Automation", href: "/automation", icon: Workflow, status: "live" },
      { label: "Media Library", href: "/media", icon: ImageIcon, status: "phase", phaseLabel: "Planned" },
      { label: "Templates", href: "/templates", icon: LayoutTemplate, status: "live" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, status: "live" },
      { label: "Billing", href: "/billing", icon: CreditCard, status: "live" },
      { label: "Users & Roles", href: "/users", icon: Users, status: "live" },
      { label: "Activity Log", href: "/activity", icon: ScrollText, status: "phase", phaseLabel: "Planned" },
      { label: "Settings", href: "/settings", icon: Settings, status: "phase", phaseLabel: "Planned" },
    ],
  },
];
