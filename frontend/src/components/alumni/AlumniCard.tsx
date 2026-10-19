import { motion } from "framer-motion";
import { GraduationCap, Briefcase } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { ConnectionButton } from "@/components/ui/ConnectionButton";
import type { AlumniProfile } from "@/hooks/useAlumniDirectory";
import { CARD_HOVER, CARD_TAP, SPRING, blockEntrance } from "@/lib/motion";
import { BRANCH_ABBREVIATIONS } from "@/constants/branches";

interface AlumniCardProps {
  alumni: AlumniProfile;
  onConnect: (userId: string, message?: string) => void;
  onClick: () => void;
  /** Position in the grid — staggers this card's entrance behind the last. */
  index?: number;
}

export const AlumniCard = ({
  alumni,
  onConnect,
  onClick,
  index = 0,
}: AlumniCardProps) => {
  const isStudent = alumni.user.role === "student";
  const isFaculty = alumni.user.role === "faculty";
  const classLabel = alumni.batch
    ? `${isStudent ? "Student - " : isFaculty ? "Faculty - " : ""}${alumni.batch}`
    : undefined;

  return (
    // The lift moved from `hover:-translate-y-1` into framer: motion owns this
    // element's `transform` once it animates, so a class-based translate would
    // simply be overwritten. For the same reason the CSS transition lists its
    // properties instead of using `transition-all` — `all` covers `transform`,
    // and CSS smoothing the property framer drives frame by frame makes the
    // lift lag behind the cursor.
    <motion.div
      onClick={onClick}
      {...blockEntrance(index)}
      whileHover={CARD_HOVER}
      whileTap={CARD_TAP}
      transition={SPRING}
      className="group rounded-card border border-border bg-card hover:bg-accent transition-[background-color,border-color,box-shadow] duration-300 cursor-pointer p-6 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/50 flex flex-col h-full min-w-0 overflow-hidden"
    >
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-4 w-full min-w-0">
        <UserAvatar
          src={alumni.profile_picture}
          name={alumni.user.name}
          size="lg"
          className="ring-2 ring-border shrink-0"
        />
        <div className="flex-1 overflow-hidden">
          <h3 className="text-headline-md text-foreground group-hover:text-primary transition-colors truncate">
            {alumni.user.name}
          </h3>
          {classLabel && (
            <p className="text-body-sm text-muted-foreground truncate">
              {classLabel}
            </p>
          )}
        </div>
      </div>

      {/* Body Section */}
      <div className="space-y-3 mb-4 flex-1 w-full min-w-0">
        {/* Branch / Department Block */}
        {(alumni.branch || alumni.department) && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <GraduationCap className="w-[18px] h-[18px] text-primary/70 shrink-0 mt-0.5" />
            <p
              className="text-sm text-foreground flex-1 min-w-0 truncate"
              title={alumni.branch || alumni.department}
            >
              {alumni.branch ? (
                <>
                  <span className="hidden sm:inline">{alumni.branch}</span>
                  <span className="sm:hidden">{BRANCH_ABBREVIATIONS[alumni.branch] || alumni.branch}</span>
                </>
              ) : (
                alumni.department
              )}
            </p>
          </div>
        )}

        {/* Role & Company Block */}
        {(alumni.current_role || alumni.current_company) && (
          <div className="flex items-start gap-3 w-full min-w-0">
            <Briefcase className="w-[18px] h-[18px] text-primary/70 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              {alumni.current_role && (
                <p className="text-body-md text-foreground truncate">
                  {alumni.current_role}
                </p>
              )}
              {alumni.current_company && (
                <p className="text-body-sm text-muted-foreground truncate mt-0.5">
                  {alumni.current_company}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-auto pt-4 border-t border-border/50 w-full min-w-0"
      >
        <ConnectionButton
          status={alumni.connectionStatus}
          userId={alumni.user._id}
          onConnect={onConnect}
          size="default"
          fullWidth
          recipientName={alumni.user.name}
        />
      </div>
    </motion.div>
  );
};
