"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { renderCustomMarkdown } from "@/lib/markdown-renderer";
import {
  Bold,
  Italic,
  Link,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Eye,
  Edit,
} from "lucide-react";

interface CustomMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function CustomMarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content here...",
  className = "",
  error = false,
}: CustomMarkdownEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newText =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      onChange(newText);

      // Set cursor position after insertion
      setTimeout(() => {
        const newCursorPos =
          start + before.length + textToInsert.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    },
    [value, onChange]
  );

  const handleBold = () => insertText("**", "**", "bold text");
  const handleItalic = () => insertText("*", "*", "italic text");
  const handleLink = () => insertText("[", "](url)", "link text");
  const handleH1 = () => insertText("# ", "", "Heading 1");
  const handleH2 = () => insertText("## ", "", "Heading 2");
  const handleH3 = () => insertText("### ", "", "Heading 3");
  const handleBulletList = () => insertText("- ", "", "List item");
  const handleNumberedList = () => insertText("1. ", "", "List item");
  const handleQuote = () => insertText("> ", "", "Quote text");

  return (
    <div
      className={`border-2 rounded-md ${
        error ? "border-destructive" : "border-border"
      } ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH1}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH2}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleH3}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBold}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleItalic}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLink}
            title="Link"
          >
            <Link className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBulletList}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNumberedList}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleQuote}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={mode === "edit" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("edit")}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            variant={mode === "preview" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("preview")}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[300px]">
        {mode === "edit" ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full min-h-[300px] p-4 bg-background text-foreground border-0 resize-none focus:outline-none font-mono text-sm"
            style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace" }}
          />
        ) : (
          <div className="p-4 prose prose-sm max-w-none dark:prose-invert">
            {renderCustomMarkdown(value)}
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Quick Reference:</strong> # Heading • **bold** • *italic* •
          [link](url) • - List • &gt; Quote
        </p>
      </div>
    </div>
  );
}
