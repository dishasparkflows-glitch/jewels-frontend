import PropTypes from 'prop-types';

/**
 * Renders product description and care/specification content formatted with clean bullet lists
 * matching luxury typography (exact match to Neirah design).
 */
export default function FormattedContent({ content }) {
  if (!content || typeof content !== 'string') return null;

  const rawLines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return null;

  const renderInline = (str) => {
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(<strong key={match.index} className="font-semibold text-stone-900">{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('*') && token.endsWith('*')) {
        parts.push(<em key={match.index} className="italic text-stone-800">{token.slice(1, -1)}</em>);
      } else if (token.startsWith('<u>') && token.endsWith('</u>')) {
        parts.push(<u key={match.index} className="underline">{token.slice(3, -4)}</u>);
      }
      lastIndex = match.index + token.length;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-2 text-stone-700 text-xs sm:text-[13px] leading-relaxed my-0.5">
          {currentList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="text-stone-700 select-none text-[13px] leading-relaxed shrink-0">•</span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  rawLines.forEach((line) => {
    const bulletMatch = line.match(/^[•\-*]\s*(.+)$/);
    if (bulletMatch) {
      currentList.push(bulletMatch[1]);
    } else {
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="text-stone-700 text-xs sm:text-[13px] leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-2">{elements}</div>;
}

FormattedContent.propTypes = {
  content: PropTypes.string,
};
