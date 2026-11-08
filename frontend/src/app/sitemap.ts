import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Public, indexable pages only. Signed-in and one-off auth pages are excluded.
const PUBLIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }> = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/invoice-generator", priority: 0.9, changeFrequency: "monthly" },
  { path: "/how-to-use", priority: 0.8, changeFrequency: "monthly" },
  { path: "/register", priority: 0.7, changeFrequency: "yearly" },
  { path: "/login", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
