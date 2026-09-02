import type { ReactNode } from "react";

import { CourseMobileNav } from "@/components/learn/course-mobile-nav";
import { CourseSidebar } from "@/components/learn/course-sidebar";

type CourseLayoutProps = {
  children: ReactNode;
};

export function CourseLayout({ children }: CourseLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <CourseMobileNav />

      <div className="flex min-h-screen">
        <CourseSidebar />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:px-8 lg:px-12 lg:py-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
