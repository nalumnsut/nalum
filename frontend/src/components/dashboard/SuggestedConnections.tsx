import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";
import { ConnectionMessageDialog } from "@/components/ConnectionMessageDialog";
import { PreloadLink } from "@/components/PreloadLink";
import { PanelCard } from "@/components/dashboard/PanelCard";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { EXIT_ROW, SPRING, rowEntrance } from "@/lib/motion";
import { apiErrorMessage } from "@/lib/utils";

interface SuggestionProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
  batch?: string;
  branch?: string;
  campus?: string;
  current_role?: string;
  current_company?: string;
  profile_picture?: string;
}

// Rail rows are two lines, never three: the batch rides on the same meta line
// as the job rather than in a chip of its own, which is what kept this card
// tall enough to push Upcoming Events off the fold.
const headline = (profile: SuggestionProfile) => {
  const job = [profile.current_role, profile.current_company]
    .filter(Boolean)
    .join(" at ");
  return (
    [profile.batch, job || profile.branch]
      .filter(Boolean)
      .join(" • ") || "Alumni network"
  );
};

// Five rows overflow the rail on a laptop. Four keeps the second card visible.
const VISIBLE = 4;

const RowSkeleton = () => (
  <div className="flex items-center gap-3">
    <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
    <div className="flex-1 space-y-1.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-36" />
    </div>
  </div>
);

// Right-rail module: who the viewer should meet next, straight from
// /profile/suggestions (already ranked and capped at five by the API).
export const SuggestedConnections = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );

  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["profile", "suggestions"],
    queryFn: async (): Promise<SuggestionProfile[]> => {
      const { data } = await api.get("/profile/suggestions");
      return data?.suggestions ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const sendRequest = async (message: string) => {
    if (!selected) return;
    try {
      await api.post("/chat/connections/request", {
        recipientId: selected.id,
        requestMessage: message,
      });
      toast.success("Connection request sent");
      queryClient.invalidateQueries({ queryKey: ["profile", "suggestions"] });
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to send request"));
    } finally {
      setSelected(null);
    }
  };

  // Profiles whose user document went missing would render as an empty row.
  const rows = suggestions
    .filter((profile) => profile.user?._id)
    .slice(0, VISIBLE);

  return (
    <PanelCard
      title="Suggested Connections"
      subtitle="Based on your batch, branch and campus"
      footer={
        <PreloadLink
          to="/dashboard/alumni"
          className="text-label-md text-primary transition-colors hover:text-primary-hover"
        >
          Browse directory
        </PreloadLink>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : rows.length === 0 ? (
        <div className="py-4 text-center">
          <Users className="mx-auto mb-2 h-9 w-9 text-muted-foreground/50" />
          <p className="text-body-sm text-muted-foreground">
            No suggestions right now — you're connected with everyone we'd match
            you to.
          </p>
        </div>
      ) : (
        // `layout` + an exit that slides right is the payoff here: once a
        // request is sent the profile drops out of the refetched list, and the
        // rows below close the gap instead of snapping upward.
        <ul className="divide-y divide-border">
          <AnimatePresence>
            {rows.map((profile, index) => (
              <motion.li
                key={profile._id}
                layout
                {...rowEntrance(index)}
                exit={EXIT_ROW}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/dashboard/alumni/${profile.user!._id}`)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <UserAvatar
                    src={profile.profile_picture}
                    name={profile.user!.name}
                    size="md"
                    className="shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-label-md text-foreground transition-colors hover:text-primary">
                      {profile.user!.name}
                    </span>
                    <span className="mt-0.5 block truncate text-body-sm text-muted-foreground">
                      {headline(profile)}
                    </span>
                  </span>
                </button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING}
                  onClick={() =>
                    setSelected({
                      id: profile.user!._id,
                      name: profile.user!.name,
                    })
                  }
                  aria-label={`Connect with ${profile.user!.name}`}
                  title={`Connect with ${profile.user!.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:border-primary hover:bg-primary-subtle"
                >
                  <UserPlus className="h-4 w-4" />
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ConnectionMessageDialog
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        onConfirm={sendRequest}
        recipientName={selected?.name || "User"}
      />
    </PanelCard>
  );
};

export default SuggestedConnections;
