import {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  GraduationCap,
  Globe,
  LucideIcon,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import MarkdownEditor from "@/components/posts/MarkdownEditor";
import TagInput, { MAX_TAGS } from "@/components/posts/TagInput";
import { SegmentedToggle } from "@/components/ui/SegmentedToggle";
import { PostVisibility, VISIBILITY_LABELS, getPostImageUrl } from "@/lib/posts";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 2;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const AUDIENCE_ICON: Record<PostVisibility, LucideIcon> = {
  everyone: Globe,
  alumni: Users,
  students: GraduationCap,
};

const Card = ({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) => (
  <section className="rounded-card border border-border bg-card p-6 shadow-card">
    {title && <h2 className="mb-4 text-headline-md text-foreground">{title}</h2>}
    {children}
  </section>
);

export interface PostComposerInitial {
  title?: string;
  content?: string;
  tags?: string[];
  images?: string[];
  visibility?: PostVisibility;
}

export interface PostComposerHandle {
  getFormData: () => FormData | null;
}

interface PostComposerProps {
  mode: "create" | "edit";
  initial?: PostComposerInitial;
  audienceOptions: PostVisibility[];
  sidebar?: ReactNode;
  enableSpecialMentions?: boolean;
}

const PostComposer = forwardRef<PostComposerHandle, PostComposerProps>(
  ({ mode, initial, audienceOptions, sidebar, enableSpecialMentions = false }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const resolverRef = useRef<(text: string) => string>((t) => t);

    const [title, setTitle] = useState(initial?.title ?? "");
    const [content, setContent] = useState(initial?.content ?? "");
    const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
    const [existingImages, setExistingImages] = useState<string[]>(
      initial?.images ?? []
    );
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);
    const [visibility, setVisibility] = useState<PostVisibility>(
      initial?.visibility ?? "everyone"
    );
    const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

    useEffect(() => {
      const urls = files.map((file) => URL.createObjectURL(file));
      setPreviews(urls);
      return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }, [files]);

    const totalImages = existingImages.length + files.length;
    const attachmentUrls = [...existingImages.map(getPostImageUrl), ...previews];

    const addFiles = (incoming: FileList | null) => {
      if (!incoming?.length) return;

      const accepted: File[] = [];
      for (const file of Array.from(incoming)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} isn't an image`);
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          toast.error(`${file.name} is larger than 5MB`);
          continue;
        }
        if (totalImages + accepted.length >= MAX_IMAGES) {
          toast.error(`You can attach up to ${MAX_IMAGES} images`);
          break;
        }
        accepted.push(file);
      }

      if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeExisting = (index: number) => {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    };

    const removeFile = (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    useImperativeHandle(ref, () => ({
      getFormData: () => {
        const nextErrors: typeof errors = {};
        if (!title.trim()) nextErrors.title = "A headline is required.";
        if (!content.trim()) nextErrors.content = "Write something before publishing.";
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length) {
          toast.error("Fill in the highlighted fields");
          return null;
        }

        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("content", resolverRef.current(content));
        formData.append("tags", JSON.stringify(tags));
        formData.append("visibility", visibility);
        files.forEach((file) => formData.append("images", file));
        if (mode === "edit") {
          formData.append("existing_images", JSON.stringify(existingImages));
        }
        return formData;
      },
    }));

    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Post Headline">
            <input
              type="text"
              value={title}
              maxLength={120}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? "title-error" : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              placeholder="Give your post a compelling title…"
              className={cn(
                "h-12 w-full rounded-lg border bg-card px-4 text-body-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2",
                errors.title
                  ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                  : "border-input focus:border-primary focus:ring-ring"
              )}
            />
            {errors.title && (
              <p
                id="title-error"
                className="mt-2 flex items-center gap-1.5 text-body-sm text-destructive"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.title}
              </p>
            )}

            <div
              className={cn(
                "mt-4 rounded-lg",
                errors.content && "ring-2 ring-destructive/40"
              )}
            >
              <MarkdownEditor
                value={content}
                attachments={attachmentUrls}
                onResolverReady={(fn) => { resolverRef.current = fn; }}
                enableSpecialMentions={enableSpecialMentions}
                onChange={(next) => {
                  setContent(next);
                  if (errors.content)
                    setErrors((prev) => ({ ...prev, content: undefined }));
                }}
              />
            </div>
            {enableSpecialMentions && <p className="mt-3 text-body-sm text-muted-foreground">@All, @Alumni, and @Student will send an email to all users in the selected group.</p>}
            {errors.content && (
              <p className="mt-2 flex items-center gap-1.5 text-body-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {errors.content}
              </p>
            )}
          </Card>

          <Card title="Media">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragging
                  ? "border-primary bg-accent"
                  : "border-border hover:border-primary/50 hover:bg-accent/50"
              } ${totalImages >= MAX_IMAGES ? "pointer-events-none opacity-50" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                multiple
                className="hidden"
                onChange={(event) => addFiles(event.target.files)}
              />
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
              </span>
              <span className="text-label-md text-foreground">
                Click to upload or drag and drop
              </span>
              <span className="mt-1 text-body-sm text-muted-foreground">
                PNG, JPG, GIF or WEBP — up to 5MB, {MAX_IMAGES} images max
              </span>
            </label>

            {totalImages > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {attachmentUrls.map((url, index) => {
                  const isExisting = index < existingImages.length;
                  return (
                    <figure key={url} className="relative">
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="h-40 w-full rounded-lg border border-border object-cover"
                      />

                      <span className="absolute left-2 top-2 rounded-full bg-surface-inverse/80 px-2 py-0.5 text-label-sm text-surface-inverse-foreground">
                        Image {index + 1}
                      </span>

                      <button
                        type="button"
                        aria-label={`Remove image ${index + 1}`}
                        onClick={() =>
                          isExisting
                            ? removeExisting(index)
                            : removeFile(index - existingImages.length)
                        }
                        className="absolute right-2 top-2 rounded-full bg-surface-inverse/80 p-1.5 text-surface-inverse-foreground transition-colors hover:bg-surface-inverse"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </figure>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Audience">
            <p className="mb-4 text-body-sm text-muted-foreground">
              Choose who can see this post in the feed.
            </p>
            <SegmentedToggle<PostVisibility>
              label="Audience"
              value={visibility}
              onChange={setVisibility}
              options={audienceOptions.map((value) => ({
                value,
                label: VISIBILITY_LABELS[value],
                icon: AUDIENCE_ICON[value],
              }))}
              trackClassName="bg-surface-container-high"
              className="w-full"
            />
          </Card>

          <Card title="Tags">
            <p className="mb-4 text-body-sm text-muted-foreground">
              Relevant tags help your post reach the right audience and surface
              it in related discussions across the network. Add up to {MAX_TAGS}.
            </p>
            <TagInput value={tags} onChange={setTags} />
          </Card>

          {sidebar}
        </div>
      </div>
    );
  }
);

PostComposer.displayName = "PostComposer";

export default PostComposer;
