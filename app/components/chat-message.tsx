"use client";

import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { ComponentType } from "react";
import { useState, useEffect } from "react";
import { ChevronDown, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageContent, TextContent, ImageContent } from "@/types/chat";
import "katex/dist/katex.min.css";

interface ChatMessageProps {
  message: {
    content: MessageContent;
    isUser: boolean;
    reasoning?: string;
    model?: string;
  };
  isSelected?: boolean;
  isRecent?: boolean;
  inInsertMode?: boolean;
  isLoading?: boolean;
}

const MarkdownComponents: Record<string, ComponentType<any>> = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    };

    return match ? (
      <div className="relative">
        <div className="absolute top-0 right-0 flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground bg-muted-foreground/10 rounded-bl">
          {language}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-muted-foreground/20"
                  onClick={() => copyToClipboard(String(children))}
                >
                  {copied ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy code"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <SyntaxHighlighter
          style={oneDark}
          language={language}
          PreTag="div"
          className="mt-2 rounded-md"
          {...props}
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    ) : (
      <code
        className="bg-muted-foreground/20 rounded px-1 py-[2px] text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
  p({ children, ...props }) {
    return (
      <p className="mb-2 last:mb-0" {...props}>
        {children}
      </p>
    );
  },
  ul({ children, ...props }) {
    return (
      <ul className="list-disc pl-6 mb-2 space-y-1" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }) {
    return (
      <ol className="list-decimal pl-6 mb-2 space-y-1" {...props}>
        {children}
      </ol>
    );
  },
  li({ children, ...props }) {
    return (
      <li className="mb-1 last:mb-0 marker:text-foreground/70" {...props}>
        {children}
      </li>
    );
  },
  blockquote({ children, ...props }) {
    return (
      <blockquote
        className="border-l-4 border-muted-foreground/40 pl-4 italic my-2"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  h1({ children, ...props }) {
    return (
      <h1 className="text-2xl font-bold mb-4" {...props}>
        {children}
      </h1>
    );
  },
  h2({ children, ...props }) {
    return (
      <h2 className="text-xl font-bold mb-3" {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }) {
    return (
      <h3 className="text-lg font-bold mb-2" {...props}>
        {children}
      </h3>
    );
  },
  a({ children, href, ...props }) {
    return (
      <a
        href={href}
        className="text-blue-500 underline hover:text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    );
  },
  strong({ children, ...props }) {
    return (
      <strong className="font-bold" {...props}>
        {children}
      </strong>
    );
  },
  em({ children, ...props }) {
    return (
      <em className="italic" {...props}>
        {children}
      </em>
    );
  },
  table({ children, ...props }) {
    return (
      <div className="my-4 overflow-x-auto">
        <table
          className="min-w-full divide-y divide-muted-foreground/20"
          {...props}
        >
          {children}
        </table>
      </div>
    );
  },
  thead({ children, ...props }) {
    return (
      <thead className="bg-muted-foreground/5" {...props}>
        {children}
      </thead>
    );
  },
  tbody({ children, ...props }) {
    return (
      <tbody
        className="divide-y divide-muted-foreground/20 bg-muted-foreground/0"
        {...props}
      >
        {children}
      </tbody>
    );
  },
  tr({ children, ...props }) {
    return (
      <tr className="transition-colors hover:bg-muted-foreground/5" {...props}>
        {children}
      </tr>
    );
  },
  th({ children, ...props }) {
    return (
      <th className="px-4 py-3 text-left text-sm font-semibold" {...props}>
        {children}
      </th>
    );
  },
  td({ children, ...props }) {
    return (
      <td className="px-4 py-2 text-sm whitespace-normal" {...props}>
        {children}
      </td>
    );
  },
};

export function ChatMessage({
  message,
  isSelected = false,
  isRecent = false,
  inInsertMode = false,
  isLoading = false,
}: ChatMessageProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Show full content if selected or if it's the most recent message during insert mode
  useEffect(() => {
    if (isSelected || (isRecent && inInsertMode)) {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [isSelected, isRecent, inInsertMode]);

  const getPreviewContent = (content: string) => {
    if (content.length <= 50) return content;
    return content.slice(0, 50) + "...";
  };

  const getTextContent = (content: MessageContent): string => {
    if (typeof content === "string") {
      return content;
    }

    return content
      .filter((item): item is TextContent => item.type === "text")
      .map((item) => item.text)
      .join(" ");
  };

  const getImageContent = (content: MessageContent): ImageContent[] => {
    if (typeof content === "string") {
      return [];
    }

    return content.filter(
      (item): item is ImageContent => item.type === "image_url"
    );
  };

  const renderImages = (images: ImageContent[]) => {
    if (images.length === 0) return null;

    return (
      <div className="space-y-2 mb-3">
        {images.map((image, index) => (
          <div key={index} className="max-w-sm">
            <img
              src={image.image_url.url}
              alt={`Upload ${index + 1}`}
              className="rounded-lg border max-w-full h-auto"
              style={{ maxHeight: "200px" }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn("flex", message.isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3",
          message.isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        )}
      >
        {!message.isUser && message.model && (
          <div className="text-xs text-gray-500 mb-2 font-mono">
            {message.model.includes("Auto Router") &&
            message.model.includes("(")
              ? message.model
              : message.model}
          </div>
        )}
        {false && message.reasoning && (
          <div className="mb-3">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 mb-2 hover:text-gray-800 transition-colors"
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showReasoning ? "rotate-180" : ""
                )}
              />
              Reasoning Process
            </button>
            {showReasoning && (
              <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3 border border-gray-200 mb-3">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={MarkdownComponents}
                >
                  {isExpanded
                    ? message.reasoning
                    : getPreviewContent(message.reasoning || "")}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
        <div
          className={cn(
            message.reasoning ? "border-t pt-3 border-gray-200" : ""
          )}
        >
          {renderImages(getImageContent(message.content))}
          {isLoading && !getTextContent(message.content) ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={MarkdownComponents}
            >
              {isExpanded
                ? getTextContent(message.content)
                : getPreviewContent(getTextContent(message.content))}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
