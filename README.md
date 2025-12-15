# langchain-supadata

Supadata document loader integration for **LangChain JS**.

This package provides a `SupadataLoader` that wraps the official
[`@supadata/js`](https://www.npmjs.com/package/@supadata/js) SDK and exposes it
as a LangChain `BaseDocumentLoader`.

It supports two core Supadata features:

- **Get Transcript** – fetch transcripts (plain text or structured) for a URL.
- **Get Metadata** – fetch structured metadata for a URL (YouTube or generic web page).

---

## Installation

```bash
npm install langchain-supadata @langchain/core
# @supadata/js is installed transitively by this package
or with pnpm:
```
```bash
pnpm add langchain-supadata @langchain/core
```

You also need a Supadata API key from https://supadata.ai.

Set it as an environment variable:

```bash
export SUPADATA_API_KEY="your_api_key_here"
```

You can also pass the API key explicitly to the loader (see examples below).

## Transcript (default operation)

```ts
import { SupadataLoader } from "langchain-supadata";

const loader = new SupadataLoader({
  urls: ["https://www.youtube.com/watch?v=dQw4w9WgXcQ"],
  // optional; will fall back to SUPADATA_API_KEY if omitted
  apiKey: process.env.SUPADATA_API_KEY,
  operation: "transcript", // default
  lang: "en",
  text: true,              // return plain-text transcript
  mode: "auto"             // "native" | "auto" | "generate"
});

const docs = await loader.load();

console.log(docs[0].pageContent.slice(0, 500));
console.log(docs[0].metadata);
// {
//   source: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
//   supadataOperation: "transcript",
//   lang: "en"
// }
```

If Supadata returns a long-running job, the loader will return a Document
whose metadata.supadataOperation === "transcript_job" and metadata.jobId
contains the job identifier. You can then poll Supadata directly using the SDK.

## Metadata
```ts
import { SupadataLoader } from "langchain-supadata";

const loader = new SupadataLoader({
  urls: [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://supadata.ai"
  ],
  operation: "metadata"
});

const docs = await loader.load();

for (const doc of docs) {
  console.log(doc.metadata.source);
  console.log(doc.pageContent); // JSON string of metadata
}
```

For YouTube URLs, the loader calls supadata.youtube.video(...).
For non-YouTube URLs, it calls supadata.web.scrape(...).

You can also pass through additional Supadata options:

```ts
const loader = new SupadataLoader({
  urls: ["https://supadata.ai"],
  operation: "metadata",
  params: {
    // forwarded to Supadata SDK:
    // e.g. custom selectors, language hints, etc.
    timeoutMs: 30000
  }
});
```

## API

```ts
type SupadataOperation = "metadata" | "transcript";

interface SupadataLoaderParams {
  urls: string[];
  apiKey?: string;
  operation?: SupadataOperation;
  lang?: string;
  text?: boolean;
  mode?: "native" | "auto" | "generate";
  params?: Record<string, unknown>;
}

class SupadataLoader extends BaseDocumentLoader {
  constructor(params: SupadataLoaderParams);

  load(): Promise<Document[]>;
}
```

URLs: one or more URLs (YouTube, web pages, etc.). </br>
apiKey: optional, otherwise SUPADATA_API_KEY is used.  </br>
operation:
"transcript" (default): returns Document.pageContent as transcript text. </br>
"metadata": returns Document.pageContent as pretty-printed JSON string. </br>
params: extra options forwarded directly to the Supadata SDK. </br>


