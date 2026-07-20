const INLINE_MARKUP_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

const renderInlineText = (text) => String(text || '')
  .split(INLINE_MARKUP_PATTERN)
  .filter(Boolean)
  .map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-[#171717]">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`${part}-${index}`}
          className="rounded bg-[#f0ece4] px-1.5 py-0.5 font-mono text-[0.9em] text-[#6f5e32]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });

const parseBlocks = (content) => {
  const blocks = [];
  let paragraphLines = [];
  let activeList = null;

  const flushParagraph = () => {
    if (paragraphLines.length > 0) {
      blocks.push({ type: 'paragraph', text: paragraphLines.join(' ') });
      paragraphLines = [];
    }
  };

  const flushList = () => {
    if (activeList?.items.length > 0) {
      blocks.push(activeList);
    }
    activeList = null;
  };

  String(content || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trim();

      if (!line) {
        flushParagraph();
        flushList();
        return;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2],
        });
        return;
      }

      const orderedMatch = line.match(/^(\d+)[.)]\s+(.+)$/);
      const bulletMatch = line.match(/^(?:[-*•])\s+(.+)$/);
      if (orderedMatch || bulletMatch) {
        flushParagraph();
        const listType = orderedMatch ? 'ordered-list' : 'unordered-list';
        if (activeList?.type !== listType) {
          flushList();
          activeList = { type: listType, items: [] };
        }
        activeList.items.push(orderedMatch ? orderedMatch[2] : bulletMatch[1]);
        return;
      }

      flushList();
      paragraphLines.push(line);
    });

  flushParagraph();
  flushList();
  return blocks;
};

export default function AiRichText({ content, variant = 'chat', className = '' }) {
  const isAnalyst = variant === 'analyst';
  const blocks = parseBlocks(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div
      className={`${isAnalyst ? 'space-y-4 text-[15px] leading-7' : 'space-y-2.5 text-sm leading-6'} ${className}`}
    >
      {blocks.map((block, blockIndex) => {
        if (block.type === 'heading') {
          return (
            <h4
              key={`heading-${blockIndex}`}
              className={`${
                isAnalyst
                  ? 'border-l-2 border-[#a38b52] pl-3 font-serif text-xl font-semibold text-[#1d1b16] sm:text-2xl'
                  : 'font-serif text-base font-semibold text-[#1d1b16]'
              } ${blockIndex > 0 ? 'pt-2' : ''}`}
            >
              {renderInlineText(block.text)}
            </h4>
          );
        }

        if (block.type === 'ordered-list') {
          return (
            <ol key={`ordered-${blockIndex}`} className="space-y-2.5">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1d1b16] text-[10px] font-bold text-white">
                    {itemIndex + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[#46423a]">{renderInlineText(item)}</span>
                </li>
              ))}
            </ol>
          );
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={`unordered-${blockIndex}`} className="space-y-2.5">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`} className="flex items-start gap-3">
                  <span className="mt-[0.62rem] h-1.5 w-1.5 shrink-0 rotate-45 bg-[#a38b52]" />
                  <span className="min-w-0 flex-1 text-[#46423a]">{renderInlineText(item)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${blockIndex}`} className="text-[#46423a]">
            {renderInlineText(block.text)}
          </p>
        );
      })}
    </div>
  );
}
