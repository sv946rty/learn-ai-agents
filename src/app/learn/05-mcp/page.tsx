import { CourseSectionPlaceholder } from "@/components/learn/course-section-placeholder";
import { courseSections } from "@/lib/course";

export default function MCPPage() {
  const section = courseSections[4];

  return (
    <CourseSectionPlaceholder
      number={section.number}
      title={section.title}
      description={section.description}
    />
  );
}
