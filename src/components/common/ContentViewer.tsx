import { useMemo } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";

interface ContentViewerProps {
  content: string;
}

const HTML_TAG_PATTERN =
  /<(?:p|h[1-6]|strong|em|ul|ol|li|blockquote|pre|code|img|a|br|hr|div|span|table|tr|td|th)\b/i;

function isHtmlContent(content: string): boolean {
  return HTML_TAG_PATTERN.test(content);
}

export function ContentViewer({ content }: ContentViewerProps) {
  const sanitizedHtml = useMemo(() => {
    if (!content) return "";

    if (isHtmlContent(content)) {
      return DOMPurify.sanitize(content);
    }

    const html = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(html);
  }, [content]);

  if (!content) return null;

  return (
    <div
      className="content-viewer"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
