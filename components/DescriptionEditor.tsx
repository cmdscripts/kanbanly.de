'use client';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
};

export function DescriptionEditor({
  value,
  onChange,
  onBlur,
  placeholder,
}: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const hasContent = value.trim().length > 0;

  return (
    <div>
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
            mode === 'edit'
              ? 'bg-elev text-fg'
              : 'text-subtle hover:text-fg-soft'
          }`}
        >
          Schreiben
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          disabled={!hasContent}
          className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            mode === 'preview'
              ? 'bg-elev text-fg'
              : 'text-subtle hover:text-fg-soft'
          }`}
        >
          Vorschau
        </button>
        <span className="ml-auto text-[10px] text-faint font-mono">
          Markdown
        </span>
      </div>

      {mode === 'edit' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={5}
          className="w-full rounded-lg bg-elev/80 border border-line-strong px-3 py-2 text-sm text-fg placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent-hover/60 resize-y font-mono"
        />
      ) : (
        <div className="rounded-lg bg-elev/40 border border-line-strong px-3 py-2 text-sm text-fg-soft min-h-[7rem] prose-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
