import {
  CalendarPlus,
  HelpCircle,
  LucideIcon,
  PenSquare,
  UserPen,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import { PreloadLink } from "@/components/PreloadLink";
import { useAuth } from "@/context/AuthContext";
import { SPRING } from "@/lib/motion";

interface QuickAction {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Two of the three tiles are capability-dependent: only alumni and faculty
// may host events, and only alumni/faculty/admins may publish posts. Rather
// than leave gaps — or send students to a page that turns them away — the
// grid substitutes an action they can actually take, so it is always three
// tiles wide.
const actionsFor = (role?: string): QuickAction[] => {
  const canHost = role === "alumni" || role === "faculty";
  const canPost = ["alumni", "admin", "faculty"].includes(role ?? "");

  return [
    { to: "/dashboard/update-profile", label: "Update Profile", icon: UserPen },
    canHost
      ? { to: "/dashboard/host-event", label: "Host an Event", icon: CalendarPlus }
      : { to: "/dashboard/alumni", label: "Browse Directory", icon: Users },
    canPost
      ? { to: "/dashboard/posts/new", label: "Create Post", icon: PenSquare }
      : { to: "/dashboard/queries", label: "Ask a Query", icon: HelpCircle },
  ];
};

export const QuickActions = () => {
  const { user } = useAuth();
  const actions = actionsFor(user?.role);

  return (
    <section>
      <h2 className="mb-3 text-headline-md text-foreground">Quick Actions</h2>

      {/* The tiles are the most-clicked thing on the page, so they get the only
          real hover choreography on it: the card lifts, and the icon disc grows
          to meet the cursor. `whileHover="hover"` drives both from one gesture. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(({ to, label, icon: Icon }) => (
          <motion.div
            key={to}
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            variants={{ hover: { y: -4 } }}
            transition={SPRING}
          >
            <PreloadLink
              to={to}
              className="group flex h-full flex-col items-center justify-center gap-3 rounded-card border border-border bg-card p-4 text-center shadow-card transition-colors hover:border-primary hover:bg-surface-low"
            >
              <motion.span
                variants={{ hover: { scale: 1.08 } }}
                transition={SPRING}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary-subtle"
              >
                <Icon className="h-5 w-5 text-primary" />
              </motion.span>
              <span className="text-label-md text-foreground">{label}</span>
            </PreloadLink>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default QuickActions;
