"use client";

import { cn } from "@/lib/utils";
import { Bold, CheckSquare, Italic, Link as LinkIcon, List, ListOrdered, Underline, X } from "lucide-react";
import { useEffect, useRef } from "react";

type RichTextEditorProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || "";
        }
    }, [value]);

    const exec = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
    };

    const handleLink = () => {
        const url = prompt("Enter URL");
        if (url) {
            exec("createLink", url);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleClear = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = "";
            onChange("");
        }
    };

    const insertChecklist = () => {
        if (!editorRef.current) return;

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        let node: Node | null = range.commonAncestorContainer;

        // Check if we're inside a checklist
        while (node && node !== editorRef.current) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                if (element.tagName === "UL" && element.classList.contains("checklist")) {
                    // We're in a checklist, remove it (convert to normal text)
                    document.execCommand("outdent");
                    editorRef.current?.focus();
                    handleInput();
                    return;
                }
                if (element.tagName === "LI" && element.closest("ul.checklist")) {
                    // We're in a checklist item, remove it
                    document.execCommand("outdent");
                    editorRef.current?.focus();
                    handleInput();
                    return;
                }
            }
            node = node.parentNode;
        }

        // Not in a checklist, create one
        const selectedText = selection.toString().trim();
        const items = selectedText
            ? selectedText.split(/\n+/).map((line) => line.trim()).filter(Boolean)
            : ["Checklist item"];

        const listHtml = `<ul class="checklist">${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;

        document.execCommand("insertHTML", false, listHtml);
        editorRef.current?.focus();
        handleInput();
    };

    return (
        <div className={cn("border rounded-md bg-white", className)}>
            <div className="flex flex-wrap gap-2 px-3 py-2 border-b bg-muted/50">
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("bold")} aria-label="Bold">
                    <Bold className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("italic")} aria-label="Italic">
                    <Italic className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("underline")} aria-label="Underline">
                    <Underline className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={insertChecklist} aria-label="Checklist">
                    <CheckSquare className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    className="p-1 hover:text-primary"
                    onClick={() => exec("fontSize", "2")}
                    aria-label="Smaller text"
                >
                    <span className="text-sm leading-none align-middle">A<sup className="text-[10px]">▼</sup></span>
                </button>
                <button
                    type="button"
                    className="p-1 hover:text-primary"
                    onClick={() => exec("fontSize", "4")}
                    aria-label="Larger text"
                >
                    <span className="text-sm leading-none align-middle">A<sup className="text-[10px]">▲</sup></span>
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("insertUnorderedList")} aria-label="Bullet list">
                    <List className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={() => exec("insertOrderedList")} aria-label="Numbered list">
                    <ListOrdered className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={handleLink} aria-label="Insert link">
                    <LinkIcon className="h-4 w-4" />
                </button>
                <button type="button" className="p-1 hover:text-primary" onClick={handleClear} aria-label="Clear">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div
                ref={editorRef}
                className="min-h-[200px] px-3 py-3 outline-none prose prose-lg max-w-none text-foreground/80 space-y-6 [&_p]:my-0 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_li]:my-1 [&_a]:text-primary [&_a]:underline [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul.checklist]:list-none [&_ul.checklist]:pl-0 [&_ul.checklist>li]:relative [&_ul.checklist>li]:ps-6 [&_ul.checklist>li]:my-2 [&_ul.checklist>li]:before:content-['✔'] [&_ul.checklist>li]:before:text-primary [&_ul.checklist>li]:before:absolute [&_ul.checklist>li]:before:left-0 [&_ul.checklist>li]:before:top-0"
                contentEditable
                onInput={handleInput}
                suppressContentEditableWarning
                aria-placeholder={placeholder}
            />
        </div>
    );
}

