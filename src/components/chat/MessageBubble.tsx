"use client";

import { marked } from "marked";
import { useMemo, useState } from "react";
import TaskGroup from "./TaskBlock";
import type { DisplayMessage } from "@/lib/chat/use-chat";

marked.setOptions({ breaks: true, gfm: true });

/** Extract source URLs and strip the Sources block from content */
function extractSources(text: string): { sources: { domain: string; url: string; title: string }[]; cleanText: string } {
  const sources: { domain: string; url: string; title: string }[] = [];
  const seen = new Set<string>();

  // Strip "Sources:" / "**Sources:**" block at the end (list of URLs)
  const cleanText = text.replace(/\n*(?:\*{0,2}Sources?\*{0,2}:?\s*\n)((?:\s*[-–•*]?\s*\[?[^\n]*https?:\/\/[^\n]+\n?)+)/gi, "").trim();

  // Extract all URLs from the original text
  const urlRegex = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)|(?<!\()https?:\/\/[^\s)]+/g;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[2] || match[0];
    try {
      const u = new URL(url);
      const domain = u.hostname.replace(/^www\./, "");
      if (!seen.has(domain)) {
        seen.add(domain);
        // Use markdown link text, or derive a readable title from the path
        const pathTitle = u.pathname.replace(/\//g, " ").replace(/[-_]/g, " ").trim().slice(0, 60);
        sources.push({ domain, url, title: match[1] || pathTitle || domain });
      }
    } catch { /* */ }
  }
  return { sources, cleanText };
}

function renderMarkdown(text: string): string {
  // Auto-embed standalone image URLs
  const withImages = text.replace(
    /(?<![(\[!])\bhttps?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg)(?:\?\S*)?/gi,
    (url) => `![](${url})`
  );
  return marked.parse(withImages) as string;
}

interface MessageBubbleProps {
  message: DisplayMessage;
  onRetry?: () => void;
}

export default function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const { sources, cleanText } = useMemo(() => {
    if (isUser) return { sources: [], cleanText: message.content };
    return extractSources(message.content);
  }, [message.content, isUser]);
  const html = useMemo(() => (isUser ? null : renderMarkdown(cleanText)), [cleanText, isUser]);
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<"like" | "dislike" | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // User message — right aligned, dark bubble
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%]">
          {message.images?.map((img, i) => (
            <img key={i} src={img} alt="" className="rounded-xl mb-2 max-w-full max-h-48 object-cover ml-auto" />
          ))}
          <div className="bg-neutral-800 text-white rounded-2xl rounded-br-md px-4 py-3 text-sm leading-relaxed shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message — left/center, no bubble bg
  return (
    <div className="max-w-3xl">
      {/* Task group — single collapsible header for all tasks */}
      {message.taskBlocks && message.taskBlocks.length > 0 && (
        <TaskGroup tasks={message.taskBlocks} isStreaming={!!message.isStreaming} />
      )}

      {/* Main content */}
      {message.content ? (
        <div
          className="prose prose-neutral prose-sm max-w-none text-neutral-800 leading-relaxed
            [&_img]:rounded-xl [&_img]:my-3 [&_img]:max-h-80
            [&_a]:text-blue-600 [&_a]:no-underline [&_a:hover]:underline
            [&_code]:bg-neutral-100 [&_code]:text-neutral-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px]
            [&_pre]:bg-neutral-900 [&_pre]:text-neutral-100 [&_pre]:rounded-xl [&_pre]:p-4
            [&_pre_code]:bg-transparent [&_pre_code]:text-neutral-100 [&_pre_code]:p-0
            [&_blockquote]:border-l-neutral-300 [&_blockquote]:text-neutral-600
            [&_table]:text-sm [&_th]:bg-neutral-50 [&_td]:border-neutral-200
            [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold"
          dangerouslySetInnerHTML={{ __html: html || "" }}
        />
      ) : message.isStreaming ? (
        <div className="flex gap-1.5 py-2">
          <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-neutral-300 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      ) : null}

      {/* Streaming cursor */}
      {message.isStreaming && message.content && (
        <span className="inline-block w-0.5 h-4 bg-neutral-500 animate-pulse rounded-full align-text-bottom" />
      )}

      {/* Source chips */}
      {!message.isStreaming && sources.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-4">
          {sources.slice(0, 6).map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors w-fit max-w-sm"
            >
              <img src={`https://www.google.com/s2/favicons?domain=${s.domain}&sz=32`} alt="" width={16} height={16} className="rounded-sm flex-shrink-0 opacity-70" />
              <span className="text-[13px] text-neutral-200 truncate">{s.title}</span>
            </a>
          ))}
        </div>
      )}

      {/* Action buttons — only show when done */}
      {!message.isStreaming && message.content && (
        <div className="flex items-center gap-1 mt-3">
          {/* Copy */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Copy"
          >
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
            )}
          </button>

          {/* Like */}
          <button
            onClick={() => setLiked(liked === "like" ? null : "like")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${liked === "like" ? "text-green-500 bg-green-50" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"}`}
            title="Good response"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked === "like" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" /></svg>
          </button>

          {/* Dislike */}
          <button
            onClick={() => setLiked(liked === "dislike" ? null : "dislike")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${liked === "dislike" ? "text-red-500 bg-red-50" : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"}`}
            title="Bad response"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill={liked === "dislike" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3zm7-13h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" /></svg>
          </button>

          {/* Retry */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              title="Retry"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
