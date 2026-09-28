import { Fragment, type ReactNode } from "react";

/**
 * Tiny, safe markdown-style renderer for notes: headings, bullet lists, **bold**,
 * *italic* and `code`. Builds React elements (no innerHTML), so user text can't inject markup.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={k} className="font-semibold text-ink">{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k} className="rounded bg-surface-2 px-1 py-0.5 text-[0.9em]">{tok.slice(1, -1)}</code>);
    else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownPreview({ content }: { content: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  const flush = (k: number) => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${k}`} className="my-2 list-disc space-y-1 pl-5 marker:text-brand">
          {list.map((li, j) => <li key={j}>{inline(li, `li-${k}-${j}`)}</li>)}
        </ul>,
      );
      list = [];
    }
  };
  content.split("\n").forEach((line, k) => {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) return void list.push(bullet[1]);
    flush(k);
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const cls = h[1].length === 1 ? "mt-4 text-title font-bold text-ink" : "mt-3 text-headline font-bold text-ink";
      blocks.push(<p key={k} role="heading" aria-level={h[1].length + 1} className={cls}>{inline(h[2], `h-${k}`)}</p>);
    } else if (line.trim() === "") {
      blocks.push(<div key={k} className="h-2" />);
    } else {
      blocks.push(<p key={k}>{inline(line, `p-${k}`)}</p>);
    }
  });
  flush(-1);
  return <div className="text-body leading-relaxed text-ink/90 [&>*:first-child]:mt-0">{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
