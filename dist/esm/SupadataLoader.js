// src/SupadataLoader.ts
import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "@langchain/core/document_loaders/base";
import { getEnvironmentVariable } from "@langchain/core/utils/env";
import { Supadata } from "@supadata/js";
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
export class SupadataLoader extends BaseDocumentLoader {
    constructor(params) {
        super();
        if (!params.urls || params.urls.length === 0) {
            throw new Error("SupadataLoader: at least one URL is required in `urls`.");
        }
        this.urls = params.urls;
        this.apiKey = params.apiKey;
        this.operation = params.operation ?? "transcript";
        this.lang = params.lang;
        this.text = params.text ?? true;
        this.mode = params.mode;
        this.params = params.params ?? {};
    }
    async load() {
        const client = this.getClient();
        const docs = [];
        for (const url of this.urls) {
            try {
                if (this.operation === "metadata") {
                    docs.push(await this.loadMetadata(client, url));
                }
                else if (this.operation === "transcript") {
                    docs.push(await this.loadTranscript(client, url));
                }
                else {
                    throw new Error(`SupadataLoader: unsupported operation "${this.operation}". Use "metadata" or "transcript".`);
                }
            }
            catch (e) {
                // Surface the failure but keep processing other URLs
                // eslint-disable-next-line no-console
                console.warn(`SupadataLoader: failed to load ${url}: ${e?.message ?? e}`);
            }
        }
        return docs;
    }
    resolveApiKey() {
        if (this.apiKey) {
            return this.apiKey;
        }
        const envKey = getEnvironmentVariable("SUPADATA_API_KEY");
        if (!envKey) {
            throw new Error("SupadataLoader: Supadata API key not found. Pass `apiKey` to the loader or set the SUPADATA_API_KEY environment variable.");
        }
        return envKey;
    }
    getClient() {
        const apiKey = this.resolveApiKey();
        return new Supadata({ apiKey });
    }
    async loadMetadata(client, url) {
        let isYoutube = false;
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            isYoutube =
                hostname === "youtube.com" ||
                    hostname === "www.youtube.com" ||
                    hostname.endsWith(".youtube.com") ||
                    hostname === "youtu.be";
        }
        catch {
            isYoutube = false;
        }
        let result;
        if (isYoutube && client.youtube?.video) {
            result = await client.youtube.video({ url, ...this.params });
        }
        else if (client.web?.scrape) {
            result = await client.web.scrape({ url, ...this.params });
        }
        else {
            throw new Error("SupadataLoader: could not determine a Supadata SDK method to call for metadata. " +
                "Ensure the SDK version exposes either `youtube.video` or `web.scrape`.");
        }
        return new Document({
            pageContent: JSON.stringify(result, null, 2),
            metadata: {
                source: url,
                supadataOperation: "metadata",
            },
        });
    }
    async loadTranscript(client, url) {
        const payload = {
            url,
            text: this.text,
            ...this.params,
        };
        if (this.lang) {
            payload.lang = this.lang;
        }
        if (this.mode) {
            payload.mode = this.mode;
        }
        const result = await client.transcript(payload);
        if (result.jobId) {
            return new Document({
                pageContent: `Transcript processing. Job ID: ${result.jobId}`,
                metadata: {
                    source: url,
                    supadataOperation: "transcript_job",
                    jobId: result.jobId,
                },
            });
        }
        return new Document({
            pageContent: result.content,
            metadata: {
                source: url,
                supadataOperation: "transcript",
                lang: result.lang,
            },
        });
    }
}
