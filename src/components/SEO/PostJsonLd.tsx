import React from "react";
import { PRODUCTION_URL } from "@/lib/shareUtils";

interface PostJsonLdProps {
  headline: string;
  authorName: string;
  authorUsername: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string | null;
  slug: string;
  description?: string;
}

export const PostJsonLd: React.FC<PostJsonLdProps> = ({
  headline,
  authorName,
  authorUsername,
  datePublished,
  dateModified,
  imageUrl,
  slug,
  description,
}) => {
  const url = `${PRODUCTION_URL}/${authorUsername}/post/${slug}`;
  const authorUrl = `${PRODUCTION_URL}/${authorUsername}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: headline.slice(0, 110),
    description: description || headline,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      "@type": "Person",
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "FUN Play",
      url: PRODUCTION_URL,
    },
    ...(imageUrl && {
      image: {
        "@type": "ImageObject",
        url: imageUrl,
      },
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
};
