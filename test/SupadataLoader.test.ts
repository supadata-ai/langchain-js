// test/SupadataLoader.test.ts
import {describe, it, expect, vi, beforeEach, afterEach} from "vitest";
import {SupadataLoader} from "../src/SupadataLoader.js";

const {
    mockTranscript,
    mockMetadata,
    mockYoutubeVideo,
    mockSupadataConstructor,
} = vi.hoisted(() => {
    const mockTranscript = vi.fn();
    const mockMetadata = vi.fn();
    const mockYoutubeVideo = vi.fn();

    const mockSupadataConstructor = vi.fn().mockImplementation(() => ({
        transcript: mockTranscript,
        metadata: mockMetadata,
        youtube: {video: mockYoutubeVideo},
    }));

    return {mockTranscript, mockMetadata, mockYoutubeVideo, mockSupadataConstructor};
});

vi.mock("@supadata/js", () => ({
    Supadata: mockSupadataConstructor,
}));

const REAL_ENV = process.env;

beforeEach(() => {
    process.env = {...REAL_ENV};
    mockTranscript.mockReset();
    mockMetadata.mockReset();
    mockYoutubeVideo.mockReset();
    mockSupadataConstructor.mockClear();
});

afterEach(() => {
    process.env = REAL_ENV;
});

describe("SupadataLoader", () => {
    it("initializes with explicit API key", async () => {
        mockTranscript.mockResolvedValue({content: "test", lang: "en"});

        const loader = new SupadataLoader({apiKey: "test-key"});
        await loader.load({url: "https://www.youtube.com/watch?v=123"});

        expect(mockSupadataConstructor).toHaveBeenCalledWith({apiKey: "test-key"});
    });

    it("fetches transcript successfully", async () => {
        mockTranscript.mockResolvedValue({content: "Hello world", lang: "en"});

        const loader = new SupadataLoader({apiKey: "test-key"});
        const docs = await loader.load({
            url: "https://www.youtube.com/watch?v=123",
            operation: "transcript",
            text: true,
        });

        expect(mockTranscript).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "https://www.youtube.com/watch?v=123",
                text: true,
            }),
        );
        expect(docs).toHaveLength(1);
        expect(docs[0].pageContent).toBe("Hello world");
        expect(docs[0].metadata.supadataOperation).toBe("transcript");
    });

    it("fetches metadata successfully", async () => {
        mockMetadata.mockResolvedValue({title: "Awesome Video"});

        const loader = new SupadataLoader({apiKey: "test-key"});
        const docs = await loader.load({
            url: "https://www.youtube.com/watch?v=123",
            operation: "metadata",
        });

        expect(mockMetadata).toHaveBeenCalledWith(
            expect.objectContaining({
                url: "https://www.youtube.com/watch?v=123",
            }),
        );
        expect(docs).toHaveLength(1);
        expect(docs[0].pageContent).toContain("Awesome Video");
        expect(docs[0].metadata.supadataOperation).toBe("metadata");
    });

    it("rejects non-social URLs", async () => {
        const loader = new SupadataLoader({apiKey: "test-key"});

        await expect(
            loader.load({url: "https://example.com", operation: "metadata"}),
        ).rejects.toThrow(/only social media video\/post URLs are supported/i);
    });
});
