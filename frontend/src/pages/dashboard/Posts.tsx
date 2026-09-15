import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessagesSquare, PenSquare, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/ui/SegmentedToggle";
import { FadeIn } from "@/components/ui/motion";
import CommunityPostsPanel from "@/components/posts/CommunityPostsPanel";
import MyPostsPanel from "@/components/posts/MyPostsPanel";
import { useAuth } from "@/context/AuthContext";
import { DURATION, SPRING, popVariants, switchVariants } from "@/lib/motion";

type Tab = "all" | "my";

const TAB_OPTIONS: readonly SegmentedToggleOption<Tab>[] = [
  { value: "all", label: "All Posts", icon: MessagesSquare },
  { value: "my", label: "My Posts", icon: User },
];

export default function Posts() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Only alumni, faculty (and admins) can publish, so only they get the My Posts half.
  const canPost = ["alumni", "admin", "faculty"].includes(user?.role ?? "");
  const tab: Tab = canPost && searchParams.get("tab") === "my" ? "my" : "all";

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "my") params.set("tab", "my");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  const createButton = canPost ? (
    <Link to="/dashboard/posts/new" className="hidden sm:block">
      <Button className="gap-2 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover">
        <PenSquare className="h-4 w-4" />
        Create Post
      </Button>
    </Link>
  ) : undefined;

  return (
    // No page-level wrapper animation: the header's fade and the panel's own
    // entrance below already cover the page, and stacking a third rise on top
    // of them just moves the same pixels twice.
    <div className="text-foreground">
      <div className="mx-auto max-w-7xl pb-12">
        {/* Header — the title block is keyed on the tab so the heading and its
            description cross-fade together with the panel below, rather than
            the words changing under a stationary toggle. */}
        <FadeIn className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: DURATION.fast }}
            >
              <h1 className="mb-2 text-headline-lg-mobile text-primary md:text-headline-xl">
                {tab === "my" ? "My Posts" : "Community Posts"}
              </h1>
              <p className="text-body-lg text-muted-foreground">
                {tab === "my"
                  ? "Manage your contributions to the alumni network."
                  : "Insights and discussions from the network."}
              </p>
            </motion.div>
          </AnimatePresence>

          {canPost && (
            <SegmentedToggle
              label="Post view"
              value={tab}
              onChange={setTab}
              options={TAB_OPTIONS}
            />
          )}
        </FadeIn>

        {/* `mode="wait"` matters here: the two panels have very different
            heights, and overlapping them would make the page jump. No
            `initial={false}`: that would propagate "skip your entrance" to
            every descendant and flatten the row cascades inside. */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            variants={switchVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {tab === "my" ? (
              <MyPostsPanel action={createButton} />
            ) : (
              <CommunityPostsPanel
                initialTag={searchParams.get("tag") || ""}
                action={createButton}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile compose shortcut */}
      {canPost && (
        <motion.div
          variants={popVariants}
          initial="hidden"
          animate="visible"
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
          className="fixed bottom-20 right-4 z-30 sm:hidden"
        >
          <Link to="/dashboard/posts/new">
            <Button
              aria-label="Create a post"
              className="h-14 w-14 rounded-full bg-primary p-0 text-primary-foreground shadow-overlay hover:bg-primary-hover"
            >
              <PenSquare className="h-6 w-6" />
            </Button>
          </Link>
        </motion.div>
      )}
    </div>
  );
}
