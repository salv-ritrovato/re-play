import { expect, test } from "@playwright/test";
import sharp from "sharp";
import { isAcceptedFormat, sniffImageType, unsupportedMessage } from "../src/lib/image-formats";

// Pure rules, no browser: the same ones the form and the server use to accept a cover.
test.describe("cover image formats", () => {
  const base = () => sharp({ create: { width: 64, height: 80, channels: 3, background: "#3355aa" } });

  test("sharp calls an AVIF file heif, and it is accepted", async () => {
    const meta = await sharp(await base().avif().toBuffer()).metadata();
    // The bug: the list of allowed names held "avif", which sharp never reports.
    expect(meta.format).toBe("heif");
    expect(meta.compression).toBe("av1");
    expect(isAcceptedFormat(meta.format, meta.compression)).toBe(true);
  });

  test("JPEG, PNG, WebP, GIF and TIFF are accepted", async () => {
    for (const buffer of [
      await base().jpeg().toBuffer(),
      await base().png().toBuffer(),
      await base().webp().toBuffer(),
      await base().gif().toBuffer(),
      await base().tiff().toBuffer(),
    ]) {
      const { format, compression } = await sharp(buffer).metadata();
      expect(isAcceptedFormat(format, compression), `format ${format}`).toBe(true);
    }
  });

  test("HEIC photos, SVG and unknown files are refused, with a message that says why", () => {
    expect(isAcceptedFormat("heif", "hevc")).toBe(false);
    expect(isAcceptedFormat("svg")).toBe(false);
    expect(isAcceptedFormat(undefined)).toBe(false);
    expect(unsupportedMessage("heif", "hevc")).toContain("HEIC");
    expect(unsupportedMessage("svg")).toContain("SVG");
    expect(unsupportedMessage("pdf")).toBe("Unsupported format. Use JPEG, PNG, WebP or AVIF.");
  });

  test("the real type is read from the first bytes, whatever the name says", async () => {
    const head = async (buffer: Buffer) => new Uint8Array(buffer.subarray(0, 16));
    expect(sniffImageType(await head(await base().jpeg().toBuffer()))).toBe("image/jpeg");
    expect(sniffImageType(await head(await base().png().toBuffer()))).toBe("image/png");
    expect(sniffImageType(await head(await base().webp().toBuffer()))).toBe("image/webp");
    expect(sniffImageType(await head(await base().avif().toBuffer()))).toBe("image/avif");
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniffImageType(new Uint8Array(16))).toBeNull();
  });
});
