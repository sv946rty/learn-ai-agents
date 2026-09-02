import { CourseLayout } from "@/components/learn/course-layout";

type CourseSectionPlaceholderProps = {
  number: string;
  title: string;
  description: string;
};

export function CourseSectionPlaceholder({
  number,
  title,
  description,
}: CourseSectionPlaceholderProps) {
  return (
    <CourseLayout>
      <div className="space-y-10">
        <header className="space-y-5">
          <p className="font-mono text-base text-muted-foreground">
            Section {number}
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
            {description}
          </p>
        </header>

        <div className="rounded-xl border bg-card p-7">
          <p className="text-base leading-7 text-muted-foreground">
            This section will be built incrementally as the course progresses.
          </p>
        </div>
      </div>
    </CourseLayout>
  );
}
