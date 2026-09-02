import { CourseSectionPlaceholder } from "@/components/learn/course-section-placeholder";
import { courseSections } from "@/lib/course";

export default function AgentsPage() {
  const section = courseSections[1];

  return (
    <CourseSectionPlaceholder
      number={section.number}
      title={section.title}
      description={section.description}
    />
  );
}
