import { CourseSectionPlaceholder } from "@/components/learn/course-section-placeholder";
import { courseSections } from "@/lib/course";

export default function LLMsPage() {
  const section = courseSections[0];

  return (
    <CourseSectionPlaceholder
      number={section.number}
      title={section.title}
      description={section.description}
    />
  );
}
