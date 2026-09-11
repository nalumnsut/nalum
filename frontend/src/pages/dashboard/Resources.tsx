import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/motion";

interface ResourceLink {
  label: string;
  url: string;
}

interface ResourceSection {
  heading: string;
  description: string;
  links: ResourceLink[];
}

const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    heading: "Gyansutra",
    description:
      "Structured notes and a companion app to help you prep for exams.",
    links: [
      {
        label: "Resource Doc (PDF)",
        url: "https://drive.google.com/file/d/14Uph7-vkPd4t5WmAe3JokQtCp7iWuHrz/view?usp=drivesdk",
      },
      { label: "GYAN App (iOS)", url: "https://gyansutra-18m.pages.dev" },
      {
        label: "GYAN App (Android)",
        url: "https://github.com/itshimcha/Gyan_App/releases/download/v1.2.1/gyan_r.apk",
      },
    ],
  },
  {
    heading: "Notefy",
    description: "Shared notes platform for quick revision.",
    links: [{ label: "Open Notefy", url: "https://notefyy.onrender.com" }],
  },
  {
    heading: "Fresources",
    description: "Free curated learning resources for students.",
    links: [{ label: "Open Fresources", url: "https://fresources.tech/home" }],
  },
];

export default function Resources() {
  return (
    <div className="text-foreground">
      <div className="mx-auto max-w-7xl pb-12">
        <FadeIn className="mb-8 flex flex-col gap-2 border-b border-border pb-6">
          <h1 className="text-headline-lg-mobile text-primary md:text-headline-xl">
            Resources
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Handy tools and links shared by the community.
          </p>
        </FadeIn>

        <div className="space-y-4">
          {RESOURCE_SECTIONS.map((section) => (
            <div
              key={section.heading}
              className="rounded-card border border-border bg-card p-6 shadow-card"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {section.heading}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {section.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {section.links.map((link) => (
                  <Button
                    key={link.url}
                    asChild
                    className="gap-2 rounded-full bg-primary px-5 text-label-md text-primary-foreground hover:bg-primary-hover"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
