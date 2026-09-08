/*
 * PAST — 003-002
 * A Document gave loaded source content a consistent shape
 * inside our application.
 *
 * NOW — 003-003
 * A Chunk represents a smaller piece derived from a Document.
 * Each chunk preserves the source metadata so we still know
 * where that piece of knowledge came from.
 *
 * NEXT — 003-004
 * Chunks will be converted into embeddings.
 */

export type Document = {
  content: string;
  metadata: {
    source: string;
    type: string;
  };
};

export type Chunk = {
  content: string;
  metadata: Document["metadata"] & {
    chunkIndex: number;
  };
};