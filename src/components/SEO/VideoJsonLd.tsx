import { useEffect } from "react";

interface VideoJsonLdProps {
  title: string;
  description: string;
  thumbnailUrl: string | null;
  uploadDate: string;
  duration: number | null;
  contentUrl: string;
  channelName: string;
  viewCount: number;
  likeCount: number;
  url: string;
}

/**
 * Chèn dữ liệu cấu trúc JSON-LD (VideoObject) theo chuẩn Schema.org
 * để hỗ trợ Google hiển thị Rich Snippets cho video.
 */
export const VideoJsonLd = ({
  title,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  channelName,
  viewCount,
  likeCount,
  url,
}: VideoJsonLdProps) => {
  useEffect(() => {
    const scriptId = "video-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    // Chuyển đổi giây sang định dạng ISO 8601 (PT#H#M#S)
    const formatDuration = (seconds: number | null): string | undefined => {
      if (!seconds || seconds <= 0) return undefined;
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      let iso = "PT";
      if (h > 0) iso += `${h}H`;
      if (m > 0) iso += `${m}M`;
      if (s > 0) iso += `${s}S`;
      return iso === "PT" ? "PT0S" : iso;
    };

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: title,
      description: description || `Xem video "${title}" trên FUN Play`,
      thumbnailUrl: thumbnailUrl || "https://play.fun.rich/images/funplay-og-image.jpg",
      uploadDate: new Date(uploadDate).toISOString(),
      contentUrl,
      url,
      author: {
        "@type": "Person",
        name: channelName,
      },
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/WatchAction",
          userInteractionCount: viewCount,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: likeCount,
        },
      ],
    };

    const dur = formatDuration(duration);
    if (dur) jsonLd.duration = dur;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(jsonLd);

    return () => {
      const el = document.getElementById(scriptId);
      if (el) el.remove();
    };
  }, [title, description, thumbnailUrl, uploadDate, duration, contentUrl, channelName, viewCount, likeCount, url]);

  return null;
};
