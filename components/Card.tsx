'use client';
import { memo } from 'react';
import { useBoard } from '@/store/boardStore';

type Props = { id: string; isDragging: boolean };

function CardInner({ id, isDragging }: Props) {
  const card = useBoard((s) => s.cards[id]);
  const toggleTask = useBoard((s) => s.toggleTask);

  if (!card) return null;

  const totalTasks = card.tasks.length;
  const doneTasks = card.tasks.filter((t) => t.done).length;
  const progress = totalTasks ? (doneTasks / totalTasks) * 100 : 0;

  return (
    <div
      className={`rounded-xl bg-slate-800/80 border p-3 transition-shadow duration-150 ${
        isDragging
          ? 'shadow-xl shadow-violet-500/30 border-violet-400/60 ring-1 ring-violet-400/40'
          : 'border-slate-700/60 shadow-sm hover:border-slate-600 hover:shadow-md'
      }`}
    >
      <h3 className="text-sm font-medium text-slate-100 leading-snug break-words">
        {card.title}
      </h3>

      {totalTasks > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>
              {doneTasks}/{totalTasks} Tasks
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-700/50 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-emerald-400 transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <ul className="mt-2 space-y-1">
            {card.tasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(id, t.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="w-full flex items-center gap-2 text-left text-[12px] text-slate-300 hover:text-slate-100"
                >
                  <span
                    className={`h-3.5 w-3.5 shrink-0 rounded border transition-colors ${
                      t.done
                        ? 'bg-emerald-500/80 border-emerald-400'
                        : 'border-slate-600'
                    }`}
                  />
                  <span className={t.done ? 'line-through text-slate-500' : ''}>
                    {t.title}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const Card = memo(CardInner);
