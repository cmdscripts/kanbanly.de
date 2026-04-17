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
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
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
              ? 'bg-slate-800 text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Vorschau
        </button>
        <span className="ml-auto text-[10px] text-slate-600 font-mono">
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
          className="w-full rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/60 resize-y font-mono"
        />
      ) : (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700 px-3 py-2 text-sm text-slate-200 min-h-[7rem] prose-markdown">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}
