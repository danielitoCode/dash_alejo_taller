import { describe, expect, it } from "vitest";
import { parseProductImages, serializeProductImages } from "../../../../../../core/feature/product/presentation/util/product.image";

describe("product image utilities", () => {
    it("parses a legacy single URL", () => {
        expect(parseProductImages("https://a.test/1.jpg")).toEqual(["https://a.test/1.jpg"]);
    });

    it("parses serialized image JSON and filters invalid values", () => {
        expect(
            parseProductImages(
                JSON.stringify({
                    version: 1,
                    images: ["https://a.test/1.jpg", "", 42, "not-a-url", " http://a.test/2.jpg "]
                })
            )
        ).toEqual(["https://a.test/1.jpg", "http://a.test/2.jpg"]);
    });

    it("serializes one valid image as a legacy single URL", () => {
        expect(serializeProductImages(["https://a.test/1.jpg"])).toBe("https://a.test/1.jpg");
    });

    it("serializes multiple valid images as versioned JSON", () => {
        expect(serializeProductImages(["https://a.test/1.jpg", "https://a.test/2.jpg"])).toBe(
            '{"version":1,"images":["https://a.test/1.jpg","https://a.test/2.jpg"]}'
        );
    });
});