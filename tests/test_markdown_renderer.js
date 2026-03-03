const test = require("node:test")
const assert = require("node:assert")

const { renderMarkdownToHtml } = require("../markdown.js")

test("renders headings, lists, code, links, images", () => {
  const md = [
    "# 标题一",
    "",
    "## 标题二",
    "",
    "- 列表项1",
    "- 列表项2",
    "",
    "1. 有序1",
    "2. 有序2",
    "",
    "这是`行内代码`，以及一个[链接](https://example.com)。",
    "",
    "```js",
    "const a = 1",
    "```",
    "",
    "![图片](https://example.com/a.png)",
  ].join("\n")

  const html = renderMarkdownToHtml(md)
  assert.match(html, /<h1>.*标题一.*<\/h1>/)
  assert.match(html, /<h2>.*标题二.*<\/h2>/)
  assert.match(html, /<ul>.*<li>列表项1<\/li>.*<\/ul>/s)
  assert.match(html, /<ol>.*<li>有序1<\/li>.*<\/ol>/s)
  assert.match(html, /<code>行内代码<\/code>/)
  assert.match(html, /<a[^>]+href="https:\/\/example\.com"/)
  assert.match(html, /<pre><code class="language-js">/)
  assert.match(html, /<img[^>]+src="https:\/\/example\.com\/a\.png"/)
})

test("blocks javascript: links", () => {
  const md = "[x](javascript:alert(1))"
  const html = renderMarkdownToHtml(md)
  assert.doesNotMatch(html, /href="javascript:/)
})

