import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { mediaUrl } from "@/lib/media";

/** Preview images shown when a link to the site is shared (Open Graph). */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

// The site palette (src/app/globals.css).
const COLOR = {
  background: "#09090b",
  surface: "#111114",
  foreground: "#f4f4f5",
  muted: "#a1a1aa",
  subtle: "#71717a",
  border: "#27272a",
  accent: "#8b84c9",
};

/** The image is generated on demand and reused by browsers and the CDN for an hour. */
const CACHE_HEADERS = { "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400" };

async function logoUri(): Promise<string> {
  const png = await readFile(join(process.cwd(), "public/brand/replay-logo.png"));
  return `data:image/png;base64,${png.toString("base64")}`;
}

/**
 * A cover as a small JPEG data URI. Covers are stored as WebP, which the image renderer may not read,
 * and shrinking them keeps the generated image light.
 */
export async function coverUri(path: string | null | undefined): Promise<string | null> {
  const url = mediaUrl(path);
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const jpeg = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(360, 480, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function coverUris(paths: (string | null | undefined)[], max: number): Promise<string[]> {
  const all = await Promise.all(paths.slice(0, max * 2).map((p) => coverUri(p)));
  return all.filter((c): c is string => c !== null).slice(0, max);
}

export type OgPanel =
  | { kind: "covers"; covers: string[] }
  | { kind: "cover"; cover: string }
  | { kind: "stats"; items: { label: string; value: string }[] };

function titleSize(title: string, narrow: boolean): number {
  const n = title.length;
  // With a panel on the right the title has less room: short titles stay on one line, long ones shrink.
  if (narrow && n <= 14) return 76;
  const base = n <= 14 ? 112 : n <= 24 ? 92 : n <= 40 ? 70 : n <= 56 ? 60 : 52;
  return narrow ? Math.round(base * 0.88) : base;
}

function CoverTile({ src, width, height }: { src: string; width: number; height: number }) {
  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${COLOR.border}`,
        background: COLOR.surface,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={width} height={height} alt="" style={{ objectFit: "cover" }} />
    </div>
  );
}

function PanelView({ panel }: { panel: OgPanel }) {
  if (panel.kind === "cover") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 400 }}>
        <CoverTile src={panel.cover} width={360} height={480} />
      </div>
    );
  }
  if (panel.kind === "covers") {
    const [a, b, c, d] = panel.covers;
    const w = 190;
    const h = 253;
    return (
      <div style={{ display: "flex", width: 400, gap: 20, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {a && <CoverTile src={a} width={w} height={h} />}
          {b && <CoverTile src={b} width={w} height={h} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 70 }}>
          {c && <CoverTile src={c} width={w} height={h} />}
          {d && <CoverTile src={d} width={w} height={h} />}
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 36,
        width: 400,
        paddingLeft: 48,
        borderLeft: `2px solid ${COLOR.border}`,
      }}
    >
      {panel.items.map((item) => (
        <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: COLOR.subtle, textTransform: "uppercase" }}>
            {item.label}
          </div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 700, color: COLOR.foreground, lineHeight: 1 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** One layout for every section: logo, a small label, a big title, a line of context and an optional panel. */
export async function renderOg({
  eyebrow,
  title,
  subtitle,
  panel,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  panel?: OgPanel | null;
}) {
  const logo = await logoUri();
  const hasPanel = Boolean(panel);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: COLOR.background,
          color: COLOR.foreground,
          padding: "56px 72px",
          gap: 56,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={258} height={64} alt="Re:Play" />

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", width: 44, height: 3, background: COLOR.accent }} />
              <div style={{ display: "flex", fontSize: 26, letterSpacing: 5, color: COLOR.muted, textTransform: "uppercase" }}>
                {eyebrow}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: titleSize(title, hasPanel),
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: -2,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ display: "flex", fontSize: 30, lineHeight: 1.35, color: COLOR.muted, maxWidth: 640 }}>
                {subtitle}
              </div>
            )}
          </div>

          <div style={{ display: "flex", fontSize: 24, color: COLOR.subtle }}>My journey through gaming</div>
        </div>

        {panel && <PanelView panel={panel} />}
      </div>
    ),
    { ...ogSize, headers: CACHE_HEADERS },
  );
}
