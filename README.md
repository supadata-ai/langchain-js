# Supadata LangChain JS Loader

Supadata document loader integration for LangChain JS.

This package provides a `SupadataLoader` that wraps the official `@supadata/js` SDK and exposes it as a LangChain `BaseDocumentLoader`.

Supported operations:

- Transcript: fetch transcript for a supported social media video/post URL.
- Metadata: fetch structured metadata for a supported social media video/post URL.

Supported URLs are video/post URLs from: YouTube, TikTok, Instagram, Facebook, Twitter/X.

Set your Supadata API key:

```bash
export SUPADATA_API_KEY="your_api_key_here"
```

## Usage

```ts
import { SupadataLoader } from "@supadata/langchain-js";

const loader = new SupadataLoader({
  apiKey: process.env.SUPADATA_API_KEY,
});

const docs = await loader.load({
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  operation: "transcript",
  lang: "en",
  text: true,
  mode: "auto",
});

console.log(docs[0].pageContent);
console.log(docs[0].metadata);
```

### Metadata example

```ts
import { SupadataLoader } from "@supadata/langchain-js";

const loader = new SupadataLoader({
  apiKey: process.env.SUPADATA_API_KEY,
});

const docs = await loader.load({
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  operation: "metadata",
});

console.log(docs[0].pageContent);
```

## API

```ts
type SupadataOperation = "metadata" | "transcript";

type SupadataTranscriptMode = "native" | "auto" | "generate";

interface SupadataLoaderInit {
  apiKey?: string;
}

interface SupadataLoaderLoadInput {
  url: string;
  operation?: SupadataOperation;
  lang?: string;
  text?: boolean;
  mode?: SupadataTranscriptMode;
  params?: Record<string, unknown>;
}

class SupadataLoader extends BaseDocumentLoader {
  constructor(init?: SupadataLoaderInit);

  load(input: SupadataLoaderLoadInput): Promise<Document[]>;
}
```
