(function () {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizeUrl(raw) {
    const url = String(raw || "").trim();
    if (!url) return "";
    const lower = url.toLowerCase();
    if (lower.startsWith("javascript:")) return "";
    if (lower.startsWith("data:")) {
      if (/^data:image\/(png|jpe?g|gif|webp);/i.test(lower)) return url;
      return "";
    }
    if (lower.startsWith("http://") || lower.startsWith("https://")) return url;
    if (lower.startsWith("mailto:")) return url;
    if (lower.startsWith("/") || lower.startsWith("./") || lower.startsWith("../")) return url;
    if (lower.startsWith("#")) return url;
    return "";
  }

  function renderInline(escapedText) {
    let text = String(escapedText);

    text = text.replace(/`([^`]+)`/g, function (_, code) {
      return "<code>" + code + "</code>";
    });

    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (_, alt, url) {
      const safe = sanitizeUrl(url);
      if (!safe) return "<span>![ " + alt + " ]</span>";
      return '<img src="' + escapeHtml(safe) + '" alt="' + alt + '" />';
    });

    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, label, url) {
      const safe = sanitizeUrl(url);
      if (!safe) return "<span>[" + label + "]</span>";
      return (
        '<a href="' +
        escapeHtml(safe) +
        '" target="_blank" rel="noopener noreferrer">' +
        label +
        "</a>"
      );
    });

    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    return text;
  }

  function renderMarkdownToHtml(md) {
    const src = String(md || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const lines = src.split("\n");
    const out = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      const fence = line.match(/^```(\w+)?\s*$/);
      if (fence) {
        const lang = fence[1] ? String(fence[1]) : "";
        i += 1;
        const codeLines = [];
        while (i < lines.length && !/^```\s*$/.test(lines[i])) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length && /^```\s*$/.test(lines[i])) i += 1;
        const code = escapeHtml(codeLines.join("\n"));
        const cls = lang ? ' class="language-' + escapeHtml(lang) + '"' : "";
        out.push("<pre><code" + cls + ">" + code + "</code></pre>");
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)\s*$/);
      if (heading) {
        const level = heading[1].length;
        const body = renderInline(escapeHtml(heading[2]));
        out.push("<h" + level + ">" + body + "</h" + level + ">");
        i += 1;
        continue;
      }

      const ul = line.match(/^\s*[-*]\s+(.+)\s*$/);
      if (ul) {
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(/^\s*[-*]\s+(.+)\s*$/);
          if (!m) break;
          items.push("<li>" + renderInline(escapeHtml(m[1])) + "</li>");
          i += 1;
        }
        out.push("<ul>" + items.join("") + "</ul>");
        continue;
      }

      const ol = line.match(/^\s*\d+\.\s+(.+)\s*$/);
      if (ol) {
        const items = [];
        while (i < lines.length) {
          const m = lines[i].match(/^\s*\d+\.\s+(.+)\s*$/);
          if (!m) break;
          items.push("<li>" + renderInline(escapeHtml(m[1])) + "</li>");
          i += 1;
        }
        out.push("<ol>" + items.join("") + "</ol>");
        continue;
      }

      if (!line.trim()) {
        i += 1;
        continue;
      }

      const pLines = [];
      while (i < lines.length && lines[i].trim() && !/^```/.test(lines[i])) {
        pLines.push(lines[i]);
        i += 1;
      }
      const paragraph = renderInline(escapeHtml(pLines.join("\n"))).replace(/\n/g, "<br/>");
      out.push("<p>" + paragraph + "</p>");
    }

    return '<div class="assistant-markdown">' + out.join("") + "</div>";
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { renderMarkdownToHtml };
  } else if (typeof window !== "undefined") {
    window.renderMarkdownToHtml = renderMarkdownToHtml;
  }
})();

