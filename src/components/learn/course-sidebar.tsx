import Link from "next/link";

import { courseSections } from "@/lib/course";

export function CourseSidebar() {
  return (
    <aside className="hidden w-75 border-r border-border lg:block">
      <div className="flex h-full flex-col px-8 py-10">
        <div>
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-foreground"
          >
            Learn AI Agents
          </Link>

          <p className="mt-2 text-lg text-muted-foreground">
            by{" "}
            <a
              href="https://thunkx.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground transition-colors hover:text-muted-foreground"
            >
              Thunkx
            </a>
          </p>
        </div>

        <nav className="mt-12" aria-label="Course sections">
          <ul className="space-y-2">
            {courseSections.map((section) => (
              <li key={section.number}>
                <Link
                  href={section.href}
                  className="group flex items-center gap-5 rounded-lg px-4 py-3.5 text-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <span className="w-7 font-mono text-base text-muted-foreground">
                    {section.number}
                  </span>

                  <span className="font-medium">{section.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
