import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Document } from "./document";

/*
 * PAST
 * Our knowledge exists as a raw .txt file on disk.
 *
 * NOW — 003-002
 * This loader reads that source and converts it into our
 * application's standard Document representation.
 *
 * Because this project uses Next.js Cache Components, the loader
 * uses "use cache" so this project resource can be read during
 * prerendering without making the lesson page runtime-dynamic.
 *
 * The cache applies to loading the document resource.
 * It does not cache any LLM or AI runtime request.
 *
 * NEXT — 003-003
 * The loaded Document will be split into chunks.
 */

export async function loadTextFile(filePath: string): Promise<Document> {
    "use cache";

    const content = await readFile(filePath, "utf8");

    return {
        content,
        metadata: {
            source: path.basename(filePath),
            type: "text/plain",
        },
    };
}