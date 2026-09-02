"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { courseSections } from "@/lib/course";

export function CourseMobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-border lg:hidden">
      <div className="px-6 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-6">
          <div>
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Learn AI Agents
            </Link>

            <p className="mt-1 text-base text-muted-foreground">
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

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-accent"
            aria-expanded={isOpen}
            aria-controls="mobile-course-navigation"
          >
            <span
              className={`transition-transform duration-300 ${
                isOpen ? "rotate-90" : "rotate-0"
              }`}
            >
              {isOpen ? (
                <X className="size-5" aria-hidden="true" />
              ) : (
                <Menu className="size-5" aria-hidden="true" />
              )}
            </span>

            {isOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <nav
              id="mobile-course-navigation"
              className="mt-6 border-t border-border pt-4"
              aria-label="Course sections"
              aria-hidden={!isOpen}
            >
              <ul className="space-y-1">
                {courseSections.map((section) => (
                  <li key={section.number}>
                    <Link
                      href={section.href}
                      onClick={() => setIsOpen(false)}
                      tabIndex={isOpen ? 0 : -1}
                      className="flex items-center gap-5 rounded-lg px-4 py-3.5 text-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <span className="w-7 font-mono text-base">
                        {section.number}
                      </span>

                      <span className="font-medium">{section.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
