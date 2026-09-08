import type { Chunk, Document } from "./document";

/*
 * PAST — 003-002
 * A loader converted a raw source file into a Document.
 *
 * NOW — 003-003
 * This function splits a Document into smaller overlapping chunks
 * while preserving the original document metadata.
 *
 * NEXT — 003-004
 * Each chunk will be converted into an embedding.
 *
 * TEST CASES
 * chunkSize = 80, overlap = 20
 *
 * - Every chunk is at most 80 characters.
 * - Neighboring chunks overlap by 20 characters.
 * - Every chunk preserves source and type metadata.
 * - chunkIndex starts at 0 and increases by 1.
 */

export function chunkDocument(
    document: Document,
    chunkSize = 80,
    overlap = 20,
): Chunk[] {
    if (chunkSize <= 0) {
        throw new Error("chunkSize must be greater than 0.");
    }

    if (overlap < 0 || overlap >= chunkSize) {
        throw new Error(
            "overlap must be greater than or equal to 0 and smaller than chunkSize.",
        );
    }

    const chunks: Chunk[] = [];
    const step = chunkSize - overlap;

    for (
        let start = 0, chunkIndex = 0;
        start < document.content.length;
        start += step, chunkIndex += 1
    ) {
        const content = document.content.slice(start, start + chunkSize);

        chunks.push({
            content,
            metadata: {
                ...document.metadata,
                chunkIndex,
            },
        });

        if (start + chunkSize >= document.content.length) {
            break;
        }
    }

    return chunks;
}