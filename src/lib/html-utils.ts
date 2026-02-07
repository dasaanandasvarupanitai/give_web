/**
 * Recursively removes inline styles from an element and its children.
 * Also unwraps span elements that have no attributes after style removal.
 */
function cleanInlineStyles(element: Element): void {
    // Process children first (depth-first)
    const children = Array.from(element.children);
    for (const child of children) {
        cleanInlineStyles(child);
    }

    // Remove style attribute
    element.removeAttribute("style");

    // If this is a span with no remaining attributes, unwrap it (replace with its contents)
    if (
        element.tagName.toLowerCase() === "span" &&
        element.attributes.length === 0
    ) {
        const parent = element.parentNode;
        if (parent) {
            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
        }
    }
}

export function parseHtmlToParagraphs(html: string): string[] {
    if (!html) return [];

    // Create a dummy element to parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    // Clean inline styles from all elements
    cleanInlineStyles(body);

    // If the body has no children but has text, treat it as one paragraph
    if (body.children.length === 0 && body.textContent?.trim()) {
        // If it's just text, wrap it in a p tag if it doesn't have one, or just return as is
        // For consistency with RichTextEditor which usually wraps in p, let's just return the raw string
        // or we could wrap it. improved-rich-text-editor usually forces blocks.
        return [html.replace(/<[^>]*style="[^"]*"[^>]*>/g, (match) => match.replace(/style="[^"]*"/g, ""))];
    }

    const results: string[] = [];

    // Iterate through child nodes
    Array.from(body.childNodes).forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            // It's an element (p, ul, div, etc.)
            results.push((node as Element).outerHTML);
        } else if (node.nodeType === Node.TEXT_NODE) {
            // It's a text node. If it's not just whitespace, add it.
            const text = node.textContent?.trim();
            if (text) {
                results.push(`<p>${text}</p>`);
            }
        }
    });

    return results;
}
