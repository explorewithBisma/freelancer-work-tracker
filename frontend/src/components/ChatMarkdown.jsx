import React from "react";

/**
 * Minimal, safe markdown for chat bubbles.
 *
 * Supports: **bold**, *italic*, `inline code`, "# headings" (shown bold), bullet
 * lists (-, *, •), numbered lists (1.), blank-line paragraphs and line breaks.
 *
 * Safety: the text is turned into React elements; it is NEVER injected as HTML, so
 * "<img onerror=…>" or "<script>" in a message is shown as plain text. Links are not
 * rendered as links (no href is ever created from message text).
 */

const INLINE = /\*\*(.+?)\*\*|`([^`]+?)`|\*([^*\s][^*]*?)\*/g;

function parseInline(text, keyPrefix) {
  const nodes = [];
  let last = 0;
  let m;
  let i = 0;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const key = `${keyPrefix}-${i++}`;
    if (m[1] !== undefined) {
      nodes.push(<strong key={key}>{parseItalic(m[1], key)}</strong>);
    } else if (m[2] !== undefined) {
      nodes.push(
        <code key={key} style={{ background: "rgba(0,0,0,0.08)", padding: "1px 4px", borderRadius: 4, fontSize: "0.92em" }}>
          {m[2]}
        </code>
      );
    } else {
      nodes.push(<em key={key}>{m[3]}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// italics inside bold (**text *x* text**)
function parseItalic(text, keyPrefix) {
  const parts = text.split(/\*([^*\s][^*]*?)\*/g);
  return parts.map((p, idx) => (idx % 2 === 1 ? <em key={`${keyPrefix}-i${idx}`}>{p}</em> : p));
}

const BULLET = /^\s*(?:[-*•])\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const HEADING = /^\s*#{1,6}\s+(.*)$/;

function parseBlocks(text) {
  const lines = String(text ?? "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let para = [];
  let list = null;

  const flushPara = () => { if (para.length) { blocks.push({ type: "p", lines: para }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };

  for (const line of lines) {
    const bullet = line.match(BULLET);
    const numbered = line.match(NUMBERED);
    const heading = line.match(HEADING);
    if (bullet || numbered) {
      flushPara();
      const type = bullet ? "ul" : "ol";
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((bullet || numbered)[1]);
    } else if (heading) {
      flushPara(); flushList();
      blocks.push({ type: "h", text: heading[1] });
    } else if (line.trim() === "") {
      flushPara(); flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return blocks;
}

const gap = { margin: "0 0 6px" };
const listStyle = { margin: "2px 0 6px", paddingLeft: 18 };

export default function ChatMarkdown({ text, plain = false }) {
  const raw = String(text ?? "");

  // The user's own messages stay plain text (only line breaks).
  if (plain) {
    const lines = raw.split("\n");
    return lines.map((line, j) => (
      <span key={j}>{line}{j < lines.length - 1 && <br />}</span>
    ));
  }

  const blocks = parseBlocks(raw);
  return (
    <>
      {blocks.map((b, bi) => {
        const last = bi === blocks.length - 1;
        const style = last ? { ...gap, marginBottom: 0 } : gap;
        if (b.type === "ul" || b.type === "ol") {
          const Tag = b.type;
          return (
            <Tag key={bi} style={last ? { ...listStyle, marginBottom: 0 } : listStyle}>
              {b.items.map((it, ii) => <li key={ii}>{parseInline(it, `${bi}-${ii}`)}</li>)}
            </Tag>
          );
        }
        if (b.type === "h") {
          return <p key={bi} style={style}><strong>{parseInline(b.text, `${bi}h`)}</strong></p>;
        }
        return (
          <p key={bi} style={style}>
            {b.lines.map((line, li) => (
              <React.Fragment key={li}>
                {parseInline(line, `${bi}-${li}`)}
                {li < b.lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
