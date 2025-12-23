// src/SupadataLoader.ts
import {Document} from "@langchain/core/documents";
import {BaseDocumentLoader} from "@langchain/core/document_loaders/base";
import {getEnvironmentVariable} from "@langchain/core/utils/env";
import {Supadata} from "@supadata/js";

export type SupadataOperation = "metadata" | "transcript";

export type SupadataTranscriptMode = "native" | "auto" | "generate";

export interface SupadataLoaderInit {
    apiKey?: string;
}

export interface SupadataLoaderLoadInput {
    url: string;
    operation?: SupadataOperation;
    lang?: string;
    text?: boolean;
    mode?: SupadataTranscriptMode;
    params?: Record<string, unknown>;
}

/**
 * SupadataLoader integrates Supadata’s video/post scraping endpoints with LangChain JS.
 *
 * Supported operations:
 * - "transcript": Fetch transcript for a supported social media URL.
 * - "metadata": Fetch structured metadata for a supported social media URL.
 *
 * Supported URLs are video/post URLs from: YouTube, TikTok, Instagram, Facebook, Twitter/X.
 *
 * This loader does NOT perform generic web scraping and does NOT call any web scrape APIs.
 *
 * The loader is instantiated once (with optional API key), and request-specific parameters
 * are provided to `load(...)`.
 */
export class SupadataLoader extends BaseDocumentLoader {
    private readonly apiKey?: string;

    constructor(init: SupadataLoaderInit = {}) {
        super();
        this.apiKey = init.apiKey;
    }

    async load(input: SupadataLoaderLoadInput): Promise<Document[]> {
        if (!input?.url) {
            throw new Error("SupadataLoader.load: `url` is required.");
        }

        const url = input.url;
        if (!this.isSupportedSocialUrl(url)) {
            throw new Error(
                "SupadataLoader: only social media video/post URLs are supported (YouTube, TikTok, Instagram, Facebook, Twitter/X).",
            );
        }

        const operation: SupadataOperation = input.operation ?? "transcript";
        const client = this.getClient();

        if (operation === "transcript") {
            const doc = await this.loadTranscript(client, input);
            return [doc];
        }

        if (operation === "metadata") {
            const doc = await this.loadMetadata(client, input);
            return [doc];
        }

        throw new Error(
            `SupadataLoader: unsupported operation "${operation}". Use "metadata" or "transcript".`,
        );
    }

    private resolveApiKey(): string {
        if (this.apiKey) return this.apiKey;

        const envKey = getEnvironmentVariable("SUPADATA_API_KEY");
        if (!envKey) {
            throw new Error(
                "SupadataLoader: Supadata API key not found. Pass `apiKey` to the loader or set the SUPADATA_API_KEY environment variable.",
            );
        }
        return envKey;
    }

    private getClient(): Supadata {
        const apiKey = this.resolveApiKey();
        return new Supadata({apiKey});
    }

    private isSupportedSocialUrl(url: string): boolean {
        try {
            const host = new URL(url).hostname.toLowerCase();
            return (
                this.isHost(host, "youtube.com") ||
                this.isHost(host, "youtu.be") ||
                this.isHost(host, "tiktok.com") ||
                this.isHost(host, "instagram.com") ||
                this.isHost(host, "facebook.com") ||
                this.isHost(host, "fb.watch") ||
                this.isHost(host, "twitter.com") ||
                this.isHost(host, "x.com")
            );
        } catch {
            return false;
        }
    }

    private isHost(host: string, domain: string): boolean {
        return host === domain || host.endsWith(`.${domain}`);
    }

    private async loadTranscript(
        client: Supadata,
        input: SupadataLoaderLoadInput,
    ): Promise<Document> {
        const payload: Record<string, unknown> = {
            url: input.url,
            text: input.text ?? true,
            ...(input.params ?? {}),
        };

        if (input.lang) payload.lang = input.lang;
        if (input.mode) payload.mode = input.mode;

        const result: any = await (client as any).transcript(payload);

        if (result?.jobId) {
            return new Document({
                pageContent: `Transcript processing. Job ID: ${result.jobId}`,
                metadata: {
                    source: input.url,
                    supadataOperation: "transcript_job",
                    jobId: result.jobId,
                },
            });
        }

        return new Document({
            pageContent: result?.content ?? "",
            metadata: {
                source: input.url,
                supadataOperation: "transcript",
                lang: result?.lang ?? input.lang,
            },
        });
    }

    private async loadMetadata(
        client: Supadata,
        input: SupadataLoaderLoadInput,
    ): Promise<Document> {
        const payload: Record<string, unknown> = {
            url: input.url,
            ...(input.params ?? {}),
        };

        let result: unknown;

        if (typeof (client as any).metadata === "function") {
            result = await (client as any).metadata(payload);
        } else {
            const isYoutube = this.isSupportedSocialUrl(input.url) && this.isYoutubeUrl(input.url);
            if (isYoutube && (client as any).youtube?.video) {
                result = await (client as any).youtube.video(payload);
            } else {
                throw new Error(
                    "SupadataLoader: Supadata SDK does not expose a metadata method for this operation. Please upgrade @supadata/js.",
                );
            }
        }

        return new Document({
            pageContent: JSON.stringify(result, null, 2),
            metadata: {
                source: input.url,
                supadataOperation: "metadata",
            },
        });
    }

    private isYoutubeUrl(url: string): boolean {
        try {
            const host = new URL(url).hostname.toLowerCase();
            return this.isHost(host, "youtube.com") || this.isHost(host, "youtu.be");
        } catch {
            return false;
        }
    }
}
