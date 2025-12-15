import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
export type SupadataOperation = "metadata" | "transcript";
export interface SupadataLoaderParams {
    /** URLs to load (YouTube, web pages, etc.). */
    urls: string[];
    /**
     * Supadata API key. If omitted, falls back to SUPADATA_API_KEY env var.
     */
    apiKey?: string;
    /**
     * Operation to perform. "metadata" returns structured info,
     * "transcript" returns textual content. Default: "transcript".
     */
    operation?: SupadataOperation;
    /** Preferred transcript language, e.g. "en". */
    lang?: string;
    /**
     * If true, return plain-text transcript instead of timestamped chunks.
     * Default: true.
     */
    text?: boolean;
    /** Transcript mode, e.g. "native", "auto", or "generate". */
    mode?: "native" | "auto" | "generate";
    /** Extra parameters forwarded directly to the Supadata SDK. */
    params?: Record<string, unknown>;
}
/**
 * Supadata document loader for LangChain JS.
 *
 * Supports two operations:
 *  - "transcript": fetch a transcript for the given URL
 *  - "metadata": fetch metadata for the given URL
 *
 * API key is read either from the `apiKey` parameter or from
 * the `SUPADATA_API_KEY` environment variable.
 */
export declare class SupadataLoader extends BaseDocumentLoader {
    private readonly urls;
    private readonly apiKey?;
    private readonly operation;
    private readonly lang?;
    private readonly text;
    private readonly mode?;
    private readonly params;
    constructor(params: SupadataLoaderParams);
    load(): Promise<Document[]>;
    private resolveApiKey;
    private getClient;
    private loadMetadata;
    private loadTranscript;
}
//# sourceMappingURL=SupadataLoader.d.ts.map