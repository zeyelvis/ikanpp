/**
 * Site Configuration
 * Handles environment variables for site branding and customization
 */

export interface SiteConfig {
  title: string;
  description: string;
  name: string;
}

/**
 * Site configuration object
 * Uses environment variables with fallback to default values
 * Note: NEXT_PUBLIC_ environment variables are statically embedded at build time
 */
export const siteConfig: SiteConfig = {
  title: process.env.NEXT_PUBLIC_SITE_TITLE || "iKanPP",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "爱看片片 · 精彩无限",
  name: process.env.NEXT_PUBLIC_SITE_NAME || "iKanPP",
};