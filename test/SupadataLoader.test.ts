// test/SupadataLoader.test.ts
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { SupadataLoader } from "../src/SupadataLoader.js";

// All mock functions must be created inside vi.hoisted
// so they're available when the hoisted vi.mock() runs.
const {
  mockTranscript,
  mockYoutubeVideo,
  mockSupadataConstructor,
} = vi.hoisted(() => {
  const mockTranscript = vi.fn();
  const mockYoutubeVideo = vi.fn();

  const mockSupadataConstructor = vi.fn().mockImplementation(() => ({
    transcript: mockTranscript,
    youtube: {
      video: mockYoutubeVideo,
    },
  }));

  return { mockTranscript, mockYoutubeVideo, mockSupadataConstructor };
});

// Mock the Supadata SDK using the hoisted mocks above
vi.mock("@supadata/js", () => ({
  Supadata: mockSupadataConstructor,
}));

const REAL_ENV = process.env;

beforeEach(() => {
  process.env = { ...REAL_ENV };
  mockTranscript.mockReset();
  mockYoutubeVideo.mockReset();
  mockSupadataConstructor.mockClear();
});

afterEach(() => {
  process.env = REAL_ENV;
});

describe("SupadataLoader", () => {
  it("initializes with explicit API key", async () => {
    mockTranscript.mockResolvedValue({ content: "test", lang: "en" });

    const loader = new SupadataLoader({
      urls: ["https://www.youtube.com/watch?v=123"],
      apiKey: "test-key",
    });

    await loader.load();

    expect(mockSupadataConstructor).toHaveBeenCalledWith({ apiKey: "test-key" });
  });

  it("fetches transcript successfully", async () => {
    mockTranscript.mockResolvedValue({
      content: "Hello world",
      lang: "en",
    });

    const loader = new SupadataLoader({
      urls: ["https://www.youtube.com/watch?v=123"],
      apiKey: "test-key",
      operation: "transcript",
    });

    const docs = await loader.load();

    expect(mockTranscript).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://www.youtube.com/watch?v=123",
        text: true,
      }),
    );
    expect(docs).toHaveLength(1);
    expect(docs[0].pageContent).toBe("Hello world");
  });

  it("fetches metadata successfully", async () => {
    mockYoutubeVideo.mockResolvedValue({ title: "Awesome Video" });

    const loader = new SupadataLoader({
      urls: ["https://www.youtube.com/watch?v=123"],
      apiKey: "test-key",
      operation: "metadata",
    });

    const docs = await loader.load();

    expect(mockYoutubeVideo).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "https://www.youtube.com/watch?v=123",
      }),
    );
    expect(docs).toHaveLength(1);
    expect(docs[0].pageContent).toContain("Awesome Video");
    expect(docs[0].metadata.supadataOperation).toBe("metadata");
  });
});
