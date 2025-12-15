// test/SupadataLoader.test.ts
import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";
import { SupadataLoader } from "../src/SupadataLoader.js";

const mockTranscript = vi.fn();
const mockYoutubeVideo = vi.fn();
const mockSupadataConstructor = vi.fn().mockImplementation(() => ({
  transcript: mockTranscript,
  youtube: { video: mockYoutubeVideo },
}));

vi.mock("@supadata/js", () => ({
  Supadata: mockSupadataConstructor,
}));

const REAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...REAL_ENV };
  vi.clearAllMocks();
  mockTranscript.mockReset();
  mockYoutubeVideo.mockReset();
  mockSupadataConstructor.mockClear();
});

afterAll(() => {
  process.env = REAL_ENV;
});

describe("SupadataLoader", () => {
  it("initializes with explicit API key", async () => {
    mockTranscript.mockResolvedValue({ content: "test", lang: "en" });

    const loader = new SupadataLoader({
      urls: ["https://youtube.com/watch?v=123"],
      apiKey: "test-key",
    });

    await loader.load();

    expect(mockSupadataConstructor).toHaveBeenCalledWith({ apiKey: "test-key" });
  });

  it("fetches transcript", async () => {
    mockTranscript.mockResolvedValue({ content: "Hello world", lang: "en" });

    const loader = new SupadataLoader({
      urls: ["https://youtube.com/watch?v=123"],
      apiKey: "test-key",
      operation: "transcript",
    });

    const docs = await loader.load();

    expect(mockTranscript).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://youtube.com/watch?v=123", text: true }),
    );
    expect(docs).toHaveLength(1);
    expect(docs[0].pageContent).toBe("Hello world");
  });

  it("fetches metadata via youtube.video", async () => {
    mockYoutubeVideo.mockResolvedValue({ title: "Awesome Video" });

    const loader = new SupadataLoader({
      urls: ["https://youtube.com/watch?v=123"],
      apiKey: "test-key",
      operation: "metadata",
    });

    const docs = await loader.load();

    expect(mockYoutubeVideo).toHaveBeenCalled();
    expect(docs).toHaveLength(1);
    expect(docs[0].pageContent).toContain("Awesome Video");
    expect(docs[0].metadata.supadataOperation).toBe("metadata");
  });
});
