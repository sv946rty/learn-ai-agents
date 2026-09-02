import { CourseSectionPlaceholder } from "@/components/learn/course-section-placeholder";
import { courseSections } from "@/lib/course";

export default function RAGPage() {
  const section = courseSections[2];

  return (
    <CourseSectionPlaceholder
      number={section.number}
      title={section.title}
      description={section.description}
    />
  );
}
