// Vẽ bài viết từ các khối mà utils/markdown.js đã tách sẵn.
import { Link } from "react-router";
import { parseInline } from "../utils/markdown.js";

// một dòng có đậm, nghiêng, link
function Inline({ text }) {
  return parseInline(text).map((part, index) => {
    if (part.type === "strong") return <strong key={index}>{part.text}</strong>;
    if (part.type === "em") return <em key={index}>{part.text}</em>;
    if (part.type === "link") {
      // link nội bộ dùng Link cho khỏi tải lại trang, link ngoài mở tab mới
      return part.href.startsWith("/")
        ? <Link key={index} to={part.href}>{part.text}</Link>
        : <a key={index} href={part.href} target="_blank" rel="noopener noreferrer nofollow">{part.text}</a>;
    }
    return <span key={index}>{part.text}</span>;
  });
}

export default function MarkdownContent({ blocks }) {
  return (
    <div className="post-body">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2": return <h2 key={index} id={block.id}><Inline text={block.text} /></h2>;
          case "h3": return <h3 key={index} id={block.id}><Inline text={block.text} /></h3>;
          case "hr": return <hr key={index} />;
          case "quote": return <blockquote key={index}><Inline text={block.text} /></blockquote>;
          case "image":
            return (
              <figure key={index}>
                <img src={block.src} alt={block.alt} loading="lazy" decoding="async" />
                {block.alt && <figcaption>{block.alt}</figcaption>}
              </figure>
            );
          case "ul": return <ul key={index}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ul>;
          case "ol": return <ol key={index} start={block.start}>{block.items.map((item, i) => <li key={i}><Inline text={item} /></li>)}</ol>;
          default: return <p key={index}><Inline text={block.text} /></p>;
        }
      })}
    </div>
  );
}
