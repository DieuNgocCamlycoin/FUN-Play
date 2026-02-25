import { useEffect } from "react";

interface ChannelJsonLdProps {
  name: string;
  username: string;
  description: string | null;
  avatarUrl: string | null;
  subscriberCount: number;
  socialLinks?: {
    facebook?: string | null;
    youtube?: string | null;
    twitter?: string | null;
    tiktok?: string | null;
    telegram?: string | null;
    instagram?: string | null;
    linkedin?: string | null;
  };
}

/**
 * Chèn dữ liệu cấu trúc JSON-LD (Person) theo chuẩn Schema.org
 * để hỗ trợ Google hiển thị Knowledge Panel cho trang kênh.
 */
export const ChannelJsonLd = ({
  name,
  username,
  description,
  avatarUrl,
  subscriberCount,
  socialLinks,
}: ChannelJsonLdProps) => {
  useEffect(() => {
    const scriptId = "channel-jsonld";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const sameAs: string[] = [];
    if (socialLinks) {
      const links = [
        socialLinks.facebook,
        socialLinks.youtube,
        socialLinks.twitter,
        socialLinks.tiktok,
        socialLinks.telegram,
        socialLinks.instagram,
        socialLinks.linkedin,
      ];
      links.forEach((link) => {
        if (link) sameAs.push(link);
      });
    }

    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Person",
      name,
      url: `https://play.fun.rich/${username}`,
      description: description || `Trang kênh của ${name} trên FUN Play`,
      image: avatarUrl || "https://play.fun.rich/images/funplay-og-image.jpg",
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/FollowAction",
        userInteractionCount: subscriberCount,
      },
    };

    if (sameAs.length > 0) {
      jsonLd.sameAs = sameAs;
    }

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
  }, [name, username, description, avatarUrl, subscriberCount, socialLinks]);

  return null;
};
