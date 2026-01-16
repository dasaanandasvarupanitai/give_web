"use client";

import React from "react";

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with clickable links.
 * Detects URLs (http://, https://, www.) and converts them to clickable links.
 * Preserves line breaks and whitespace.
 */
export function LinkifiedText({ text, className = "" }: LinkifiedTextProps) {
  // Enhanced regex to match URLs:
  // - http:// or https:// URLs
  // - www. URLs (without protocol)
  // - Handles common TLDs and special characters
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+)/gi;

  // Split text by URLs and create elements
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  // Reset regex
  urlRegex.lastIndex = 0;

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        parts.push(
          <span key={`text-${keyCounter++}`}>{textBefore}</span>
        );
      }
    }

    // Add the URL as a clickable link
    const url = match[0];
    let href = url;

    // Add https:// if it starts with www.
    if (url.toLowerCase().startsWith("www.")) {
      href = `https://${url}`;
    }

    // Clean up URL (remove trailing punctuation that might not be part of the URL)
    const cleanUrl = url.replace(/[.,;:!?]+$/, "");
    const trailingPunctuation = url.slice(cleanUrl.length);

    parts.push(
      <React.Fragment key={`link-${keyCounter++}`}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {cleanUrl}
        </a>
        {trailingPunctuation && (
          <span key={`punctuation-${keyCounter++}`}>{trailingPunctuation}</span>
        )}
      </React.Fragment>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(
        <span key={`text-${keyCounter++}`}>{remainingText}</span>
      );
    }
  }

  // If no URLs found, just return the text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return <span className={className}>{parts}</span>;
}
