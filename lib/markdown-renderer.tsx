export function renderCustomMarkdown(markdown: string) {
  // Simple markdown renderer for blog content
  return markdown.split("\n").map((line, index) => {
    // Headers
    if (line.startsWith("# ")) {
      return (
        <h1 key={index} className="text-3xl font-bold mb-4 text-foreground">
          {line.substring(2)}
        </h1>
      );
    }
    if (line.startsWith("## ")) {
      return (
        <h2 key={index} className="text-2xl font-bold mb-3 text-foreground">
          {line.substring(3)}
        </h2>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h3 key={index} className="text-xl font-bold mb-2 text-foreground">
          {line.substring(4)}
        </h3>
      );
    }

    // Lists
    if (line.startsWith("- ")) {
      return (
        <li key={index} className="mb-1 text-foreground">
          {line.substring(2)}
        </li>
      );
    }
    if (/^\d+\.\s/.test(line)) {
      return (
        <li key={index} className="mb-1 text-foreground">
          {line.replace(/^\d+\.\s/, "")}
        </li>
      );
    }

    // Quotes
    if (line.startsWith("> ")) {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4"
        >
          {line.substring(2)}
        </blockquote>
      );
    }

    // Bold and italic
    let processedLine = line;
    processedLine = processedLine.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold text-foreground">$1</strong>'
    );
    processedLine = processedLine.replace(
      /\*(.*?)\*/g,
      '<em class="italic text-foreground">$1</em>'
    );

    // Links
    processedLine = processedLine.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Empty lines
    if (line.trim() === "") {
      return <br key={index} />;
    }

    return (
      <p
        key={index}
        className="mb-4 text-foreground leading-relaxed"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  });
}
