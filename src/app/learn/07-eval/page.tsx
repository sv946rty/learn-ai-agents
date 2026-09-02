import { CourseSectionPlaceholder } from "@/components/learn/course-section-placeholder";
import { courseSections } from "@/lib/course";

export default function EvalPage() {
  const section = courseSections[6];

  return (
    <CourseSectionPlaceholder
      number={section.number}
      title={section.title}
      description={section.description}
    />
  );
}
