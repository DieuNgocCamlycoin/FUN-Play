import { useEffect } from "react";

interface DynamicMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "music.song" | "video.other" | "profile";
  audio?: string;
  siteName?: string;
  keywords?: string;
  author?: string;
}

/**
 * Component to dynamically update Open Graph and Twitter meta tags
 * for better social media sharing previews.
 * 
 * Note: For proper Facebook/Twitter crawling, server-side rendering is needed.
 * This component updates client-side meta tags for browsers.
 */
export const DynamicMeta = ({
  title = "FUN Play: Web3 AI Social",
  description = "The place where every soul turns value into digital assets forever – Rich Rich Rich",
  image = "https://play.fun.rich/images/funplay-og-image.jpg",
  url,
  type = "website",
  audio,
  siteName = "FUN Play",
  keywords,
  author,
}: DynamicMetaProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to update or create meta tag
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (meta) {
        meta.setAttribute("content", content);
      } else {
        meta = document.createElement("meta");
        meta.setAttribute(isName ? "name" : "property", property);
        meta.setAttribute("content", content);
        document.head.appendChild(meta);
      }
    };

    // Update standard meta tags
    updateMetaTag("description", description, true);
    if (keywords) {
      updateMetaTag("keywords", keywords, true);
    }
    if (author) {
      updateMetaTag("author", author, true);
    }

    // Update Open Graph tags
    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:image", image);
    updateMetaTag("og:image:width", "1200");
    updateMetaTag("og:image:height", "630");
    updateMetaTag("og:type", type);
    updateMetaTag("og:site_name", siteName);
    updateMetaTag("og:locale", "vi_VN");
    
    if (url) {
      updateMetaTag("og:url", url);
    }

    // For music type, add audio-specific meta
    if (type === "music.song" && audio) {
      updateMetaTag("og:audio", audio);
      updateMetaTag("og:audio:type", "audio/mpeg");
    }

    // For video type
    if (type === "video.other") {
      updateMetaTag("og:video:type", "video/mp4");
    }

    // Update Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image", true);
    updateMetaTag("twitter:title", title, true);
    updateMetaTag("twitter:description", description, true);
    updateMetaTag("twitter:image", image, true);
    updateMetaTag("twitter:site", "@FunPlay", true);

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = "FUN Play: Web3 AI Social";
      updateMetaTag("og:title", "FUN Play: Web3 AI Social");
      updateMetaTag("og:description", "The place where every soul turns value into digital assets forever – Rich Rich Rich");
      updateMetaTag("og:image", "https://play.fun.rich/images/funplay-og-image.jpg");
      updateMetaTag("og:type", "website");
    };
  }, [title, description, image, url, type, audio, siteName, keywords, author]);

  return null;
};
