/*
 * PAST — 003-001
 * We learned that RAG gives an LLM relevant external knowledge at request time.
 *
 * NOW — 003-002
 * A Document gives loaded source content a consistent shape inside our application.
 *
 * NEXT — 003-003
 * Loaded documents will be split into smaller chunks.
 */

export type Document = {
  content: string;
  metadata: {
    source: string;
    type: string;
  };
};
