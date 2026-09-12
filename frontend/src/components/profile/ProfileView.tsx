import { ComponentType, ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  GraduationCap,
  Globe,
  Github,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import XIcon from "@/components/icons/XIcon";
import { cn } from "@/lib/utils";

/**
 * The read-only profile surface, shared by "My Profile" (showProfile) and the
 * public "Alumni Profile" (viewProfile). Both render identical content; only
 * the header actions and the page heading differ, so those come in as props.
 *
 * Deviations from the Stitch mockup, all driven by the Profile schema:
 * cover photo, Involvement chips, per-role location/description and the
 * multi-entry Education list have no backing data, so the hero drops the
 * banner entirely and Education collapses to the single NSUT record every
 * profile carries.
 */

export interface ProfileViewData {
  user: {
    _id?: string;
    name: string;
    email: string;
    role?: string;
  };
  batch?: string;
  branch?: string;
  department?: string;
  campus?: string;
  bio?: string;
  current_company?: string;
  current_role?: string;
  profile_picture?: string;
  location?: {
    city?: string;
    country?: string;
  };
  social_media?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    personal_website?: string;
  };
  skills?: string[];
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
  }>;
}

interface ProfileViewProps {
  profile: ProfileViewData;
  /** Back link above the hero card. */
  backLabel: string;
  onBack: () => void;
  /** Optional page heading rendered between the back link and the hero. */
  heading?: { title: string; subtitle?: string };
  /** Buttons in the hero's action slot (Message / Connect / Edit Profile). */
  actions?: ReactNode;
  /** Shown in place of the About card when the viewer owns an empty profile. */
  bioFallback?: ReactNode;
  /** Extra sections appended below the grid (e.g. My Posts). */
  children?: ReactNode;
}

const Card = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "rounded-card border border-border bg-card shadow-card",
      className,
    )}
  >
    {children}
  </div>
);

const SectionCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Card className="p-6">
    <h3 className="text-headline-md text-foreground mb-4">{title}</h3>
    {children}
  </Card>
);

// The schema lowercases city/country on write, so they need re-casing here.
const titleCase = (value?: string) =>
  value
    ? value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";

const formatLocation = (location?: { city?: string; country?: string }) =>
  [titleCase(location?.city), titleCase(location?.country)]
    .filter(Boolean)
    .join(", ");

// linkedin.com/in/evance reads better than the full https:// URL in the
// contact list, matching the mockup.
const prettyUrl = (url: string) =>
  url.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

const ContactRow = ({
  icon: Icon,
  label,
  href,
  isEmail = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isEmail?: boolean;
}) => (
  <li>
    <a
      href={href}
      target={isEmail ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors group"
    >
      <Icon className="h-[18px] w-[18px] shrink-0 text-primary/70 group-hover:text-primary transition-colors" />
      <span className="text-body-sm truncate">{label}</span>
    </a>
  </li>
);

const ProfileView = ({
  profile,
  backLabel,
  onBack,
  heading,
  actions,
  bioFallback,
  children,
}: ProfileViewProps) => {
  const social = profile.social_media ?? {};
  const skills = profile.skills ?? [];
  const experience = profile.experience ?? [];
  const locationLabel = formatLocation(profile.location);

  const headline =
    profile.current_role && profile.current_company
      ? `${profile.current_role} at ${profile.current_company}`
      : profile.current_role || profile.current_company || "";

  const classLabel = profile.user.role === "faculty" ? "" : profile.batch || "";
  const departmentLabel = profile.department || "";

  const hasCurrentPosition = Boolean(
    profile.current_role || profile.current_company,
  );

  // The current role is usually *also* an entry in the experience array (with a
  // "… - Present" duration). Pull that entry out so it renders once — in the
  // highlighted panel — and reuse its duration there.
  const norm = (value?: string) => (value ?? "").trim().toLowerCase();
  const currentMatchIndex = hasCurrentPosition
    ? experience.findIndex(
        (exp) =>
          norm(exp.company) === norm(profile.current_company) &&
          norm(exp.role) === norm(profile.current_role),
      )
    : -1;

  const currentDuration =
    currentMatchIndex >= 0 ? experience[currentMatchIndex].duration : "";
  const pastExperience =
    currentMatchIndex >= 0
      ? experience.filter((_, i) => i !== currentMatchIndex)
      : experience;

  const hasContact = Boolean(
    profile.user.email ||
      social.linkedin ||
      social.github ||
      social.twitter ||
      social.personal_website,
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Action */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="h-8 -ml-3 px-3 text-label-sm text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          {backLabel}
        </Button>

        {heading && (
          <div>
            <h1 className="text-headline-lg-mobile md:text-headline-xl text-primary">
              {heading.title}
            </h1>
            {heading.subtitle && (
              <p className="text-body-md text-muted-foreground mt-1">
                {heading.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Hero Card. The mockup's cover photo has no schema field behind it,
            so instead of faking one the card stays flat white and earns its
            weight from the avatar halo, a crimson masthead rule, and the meta
            row promoted to chips. */}
        <Card className="border-t-2 border-t-primary p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-5 min-w-0">
              <UserAvatar
                src={profile.profile_picture}
                name={profile.user.name}
                size="xl"
                className="h-24 w-24 md:h-28 md:w-28 text-3xl border-0 ring-4 ring-primary/10 shadow-card shrink-0"
              />
              <div className="text-center md:text-left min-w-0">
                <h2 className="[overflow-wrap:anywhere] text-headline-lg-mobile md:text-headline-lg text-foreground">
                  {profile.user.name}
                </h2>
                {headline && (
                  <p className="[overflow-wrap:anywhere] text-body-lg text-muted-foreground mt-1">
                    {headline}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
                  {classLabel && (
                    <span className="ap-chip ap-chip-primary">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {classLabel}
                    </span>
                  )}
                  {departmentLabel ? (
                    <span className="ap-chip">{departmentLabel}</span>
                  ) : (
                    profile.branch && <span className="ap-chip">{profile.branch}</span>
                  )}
                  {profile.campus && (
                    <span className="ap-chip">
                      <Building2 className="h-3.5 w-3.5" />
                      {profile.campus}
                    </span>
                  )}
                  {locationLabel && (
                    <span className="ap-chip">
                      <MapPin className="h-3.5 w-3.5" />
                      {locationLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {actions && (
              <div className="flex flex-wrap justify-center md:justify-end gap-2 shrink-0">
                {actions}
              </div>
            )}
          </div>
        </Card>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main Column */}
          <div className="md:col-span-8 space-y-6 min-w-0">
            {profile.bio ? (
              <SectionCard title="About">
                <p className="break-words text-body-md text-muted-foreground leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </SectionCard>
            ) : (
              bioFallback
            )}

            {skills.length > 0 && (
              <SectionCard title="Skills & Expertise">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="max-w-full break-words px-3 py-1 rounded-full border border-primary/20 bg-primary/[0.07] text-primary text-label-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {(hasCurrentPosition || pastExperience.length > 0) && (
              <SectionCard title="Experience">
                {/* Current position leads the card as a filled panel — it is
                    the single most important fact on the profile, so it should
                    not read as just another timeline row. */}
                {hasCurrentPosition && (
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-5 mb-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center shrink-0">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="ap-overline !text-primary">
                            Current
                          </span>
                          {profile.current_role && (
                            <h4 className="[overflow-wrap:anywhere] text-headline-md text-foreground mt-1">
                              {profile.current_role}
                            </h4>
                          )}
                          {profile.current_company && (
                            <p className="[overflow-wrap:anywhere] text-body-md font-medium text-primary">
                              {profile.current_company}
                            </p>
                          )}
                        </div>
                      </div>
                      {currentDuration && (
                        <span className="ap-chip ap-chip-primary shrink-0">
                          {currentDuration}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {pastExperience.length > 0 && (
                  <>
                    {hasCurrentPosition && (
                      <p className="ap-overline mb-4">Previously</p>
                    )}
                    <ol className="relative space-y-7">
                      {/* The rail sits at x=8px; each dot is 16px wide at
                          left-0, so their centres line up exactly. */}
                      <span
                        aria-hidden
                        className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border"
                      />
                      {pastExperience.map((exp, index) => (
                        <li
                          key={`${exp.company}-${exp.role}-${index}`}
                          className="relative pl-8"
                        >
                          <span
                            className={cn(
                              "absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-card shadow-sm",
                              !hasCurrentPosition && index === 0
                                ? "bg-primary"
                                : "bg-border",
                            )}
                          />
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 mb-1">
                            <h4 className="text-body-lg font-semibold text-foreground min-w-0 [overflow-wrap:anywhere]">
                              {exp.role || "—"}
                            </h4>
                            {exp.duration && (
                              <span className="shrink-0 text-body-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                {exp.duration}
                              </span>
                            )}
                          </div>
                          {exp.company && (
                            <p
                              className={cn(
                                "break-words text-body-md font-medium",
                                !hasCurrentPosition && index === 0
                                  ? "text-primary"
                                  : "text-muted-foreground",
                              )}
                            >
                              {exp.company}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </SectionCard>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-4 space-y-6 min-w-0">
            {hasContact && (
              <SectionCard title="Contact Information">
                <ul className="space-y-3">
                  {profile.user.email && (
                    <ContactRow
                      icon={Mail}
                      label={profile.user.email}
                      href={`mailto:${profile.user.email}`}
                      isEmail
                    />
                  )}
                  {/* Links are stored absolute — normalised on save in
                      updateProfile — so they can be used as hrefs directly. */}
                  {social.linkedin && (
                    <ContactRow
                      icon={Linkedin}
                      label={prettyUrl(social.linkedin)}
                      href={social.linkedin}
                    />
                  )}
                  {social.github && (
                    <ContactRow
                      icon={Github}
                      label={prettyUrl(social.github)}
                      href={social.github}
                    />
                  )}
                  {/* Stored under `social_media.twitter`; presented as X. */}
                  {social.twitter && (
                    <ContactRow
                      icon={XIcon}
                      label={prettyUrl(social.twitter)}
                      href={social.twitter}
                    />
                  )}
                  {social.personal_website && (
                    <ContactRow
                      icon={Globe}
                      label={prettyUrl(social.personal_website)}
                      href={social.personal_website}
                    />
                  )}
                </ul>
              </SectionCard>
            )}

            {/* Education — one entry, since the schema stores a single NSUT record. Hidden for faculty (department shown via hero chips instead). */}
            {(profile.branch || profile.department || profile.batch || profile.campus) &&
              profile.user.role !== "faculty" && (
              <SectionCard title="Education">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-subtle text-primary-subtle-foreground flex items-center justify-center shrink-0">
                    <GraduationCap className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    {(profile.department || profile.branch) && (
                      <h4 className="text-label-md text-foreground">
                        {profile.department || profile.branch}
                      </h4>
                    )}
                    <p className="text-body-sm text-muted-foreground">
                      Netaji Subhas University of Technology
                    </p>
                    <p className="text-label-sm text-muted-foreground/80 mt-0.5">
                      {[profile.campus, classLabel].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </SectionCard>
            )}

          </div>
        </div>

        {children}
      </div>
    </div>
  );
};

export default ProfileView;
