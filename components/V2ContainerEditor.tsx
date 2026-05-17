'use client';

import { useState } from 'react';
import type {
  V2Container,
  V2Block,
  V2Accessory,
} from '@/app/(app)/integrations/discord/[guildId]/actions';
import { Button } from './ui/Button';
import { ColorPicker } from './ui/ColorPicker';
import { FormRow } from './ui/FormSection';

type Role = { id: string; name: string; color: number };

function colorToHex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}
function hexToColor(hex: string): number | null {
  if (!/^#?[0-9a-f]{6}$/i.test(hex)) return null;
  return parseInt(hex.replace('#', ''), 16);
}

function emptyContainer(): V2Container {
  return {
    accentColor: 0x5865f2,
    children: [{ type: 'text', content: '' }],
  };
}

const BLOCK_LABELS: Record<V2Block['type'], string> = {
  text: 'Text',
  separator: 'Trenner',
  section: 'Sektion (Text + Accessory)',
  media: 'Bilder-Galerie',
  file: 'Datei',
  buttons: 'Buttons',
};

function defaultBlock(type: V2Block['type']): V2Block {
  switch (type) {
    case 'text':
      return { type: 'text', content: '' };
    case 'separator':
      return { type: 'separator', divider: true, spacing: 1 };
    case 'section':
      return { type: 'section', text: '' };
    case 'media':
      return { type: 'media', items: [{ url: '' }] };
    case 'file':
      return { type: 'file', url: '' };
    case 'buttons':
      return { type: 'buttons', buttons: [{ kind: 'link', label: '', url: '' }] };
  }
}

type Props = {
  containers: V2Container[];
  onChange: (containers: V2Container[]) => void;
  roles?: Role[];
};

export function V2ContainerEditor({ containers, onChange, roles = [] }: Props) {
  const updateContainer = (idx: number, patch: Partial<V2Container>) => {
    onChange(containers.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const removeContainer = (idx: number) => {
    onChange(containers.filter((_, i) => i !== idx));
  };

  const addContainer = () => {
    if (containers.length >= 10) return;
    onChange([...containers, emptyContainer()]);
  };

  const moveContainer = (idx: number, dir: -1 | 1) => {
    const next = [...containers];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h3 className="text-[15px] font-semibold text-fg">
            Container <span className="text-subtle">({containers.length}/10)</span>
          </h3>
          <p className="text-[12px] text-muted mt-0.5">
            Jeder Container ist ein „Embed-Ersatz“ mit Accent-Strip. Inhalt sind beliebige
            Blöcke (Text, Trenner, Sektion, Media, Datei, Buttons).
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addContainer}
          disabled={containers.length >= 10}
        >
          + Container
        </Button>
      </div>

      {containers.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-elev/30 px-4 py-6 text-center">
          <p className="text-[12.5px] text-fg-soft">
            Noch keine Container. Füge einen hinzu, um zu starten.
          </p>
        </div>
      )}

      {containers.map((container, idx) => (
        <ContainerCard
          key={idx}
          index={idx}
          container={container}
          roles={roles}
          onChange={(patch) => updateContainer(idx, patch)}
          onRemove={() => removeContainer(idx)}
          onMoveUp={() => moveContainer(idx, -1)}
          onMoveDown={() => moveContainer(idx, 1)}
          canMoveUp={idx > 0}
          canMoveDown={idx < containers.length - 1}
        />
      ))}
    </div>
  );
}

function ContainerCard({
  index,
  container,
  roles,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  index: number;
  container: V2Container;
  roles: Role[];
  onChange: (patch: Partial<V2Container>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [open, setOpen] = useState(true);
  const accent = container.accentColor ?? 0x5865f2;

  const updateBlock = (bIdx: number, next: V2Block) => {
    onChange({
      children: container.children.map((b, i) => (i === bIdx ? next : b)),
    });
  };
  const removeBlock = (bIdx: number) => {
    onChange({ children: container.children.filter((_, i) => i !== bIdx) });
  };
  const moveBlock = (bIdx: number, dir: -1 | 1) => {
    const next = [...container.children];
    const target = bIdx + dir;
    if (target < 0 || target >= next.length) return;
    [next[bIdx], next[target]] = [next[target], next[bIdx]];
    onChange({ children: next });
  };
  const addBlock = (type: V2Block['type']) => {
    onChange({ children: [...container.children, defaultBlock(type)] });
  };

  return (
    <div
      className="rounded-xl border border-line bg-surface overflow-hidden"
      style={{ borderLeft: `4px solid ${colorToHex(accent)}` }}
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-line bg-elev/30 cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] text-subtle font-mono">
            Container {index + 1}
          </span>
          <span className="text-[12px] text-fg-soft">
            · {container.children.length} Block{container.children.length === 1 ? '' : 'e'}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            ↓
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            Entfernen
          </Button>
        </div>
      </div>

      {open && (
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <FormRow label="Accent-Color">
              <ColorPicker
                value={colorToHex(accent)}
                onChange={(v) => {
                  const n = hexToColor(v);
                  if (n !== null) onChange({ accentColor: n });
                }}
              />
            </FormRow>
            <label className="inline-flex items-center gap-2 text-[12px] text-fg-soft mt-5">
              <input
                type="checkbox"
                checked={Boolean(container.spoiler)}
                onChange={(e) => onChange({ spoiler: e.target.checked })}
                className="h-3.5 w-3.5"
              />
              Spoiler (Container verbergen)
            </label>
          </div>

          <div className="space-y-2">
            {container.children.map((block, bIdx) => (
              <BlockCard
                key={bIdx}
                block={block}
                roles={roles}
                onChange={(next) => updateBlock(bIdx, next)}
                onRemove={() => removeBlock(bIdx)}
                onMoveUp={() => moveBlock(bIdx, -1)}
                onMoveDown={() => moveBlock(bIdx, 1)}
                canMoveUp={bIdx > 0}
                canMoveDown={bIdx < container.children.length - 1}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-line">
            <span className="text-[11px] text-subtle mr-1">+ Block:</span>
            {(Object.keys(BLOCK_LABELS) as V2Block['type'][]).map((t) => (
              <Button
                key={t}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => addBlock(t)}
              >
                {BLOCK_LABELS[t]}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============== Einzelne Blöcke ==============

function BlockCard({
  block,
  roles,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: V2Block;
  roles: Role[];
  onChange: (next: V2Block) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-elev/20 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-subtle font-mono">{BLOCK_LABELS[block.type]}</span>
        <div className="flex items-center gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={onMoveUp} disabled={!canMoveUp}>
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            ↓
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
            ×
          </Button>
        </div>
      </div>
      <BlockBody block={block} roles={roles} onChange={onChange} />
    </div>
  );
}

function BlockBody({
  block,
  roles,
  onChange,
}: {
  block: V2Block;
  roles: Role[];
  onChange: (next: V2Block) => void;
}) {
  if (block.type === 'text') {
    return (
      <div className="relative">
        <textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value.slice(0, 4000) })}
          rows={4}
          placeholder="Markdown wird unterstützt: **fett**, *kursiv*, `code`, # Header, > Quote, etc."
          className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-y transition-all"
        />
        <span className="absolute right-2 bottom-2 text-[10px] text-subtle font-mono tabular-nums">
          {block.content.length}/4000
        </span>
      </div>
    );
  }

  if (block.type === 'separator') {
    return (
      <div className="flex items-center gap-4 text-[12px] text-fg-soft">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={block.divider ?? true}
            onChange={(e) => onChange({ ...block, divider: e.target.checked })}
            className="h-3.5 w-3.5"
          />
          Linie sichtbar
        </label>
        <label className="inline-flex items-center gap-2">
          Abstand:
          <select
            value={block.spacing ?? 1}
            onChange={(e) =>
              onChange({ ...block, spacing: Number(e.target.value) as 1 | 2 })
            }
            className="rounded-md bg-elev border border-line-strong px-2 py-1 text-[12px] text-fg"
          >
            <option value={1}>Klein</option>
            <option value={2}>Groß</option>
          </select>
        </label>
      </div>
    );
  }

  if (block.type === 'section') {
    const acc = block.accessory;
    return (
      <div className="space-y-2">
        <textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value.slice(0, 4000) })}
          rows={3}
          placeholder="Sektions-Text (Markdown unterstützt)"
          className="w-full rounded-md bg-elev border border-line-strong px-3 py-2 text-sm text-fg font-mono focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-y transition-all"
        />
        <div className="flex items-center gap-2 text-[12px] text-fg-soft">
          <span>Accessory:</span>
          <select
            value={acc?.kind ?? 'none'}
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'none') {
                const { accessory: _ignored, ...rest } = block;
                void _ignored;
                onChange(rest as V2Block);
              } else if (v === 'thumbnail') {
                onChange({ ...block, accessory: { kind: 'thumbnail', url: '' } });
              } else {
                onChange({
                  ...block,
                  accessory: { kind: 'button', label: '', url: '', style: 'secondary' },
                });
              }
            }}
            className="rounded-md bg-elev border border-line-strong px-2 py-1 text-[12px] text-fg"
          >
            <option value="none">— keine —</option>
            <option value="thumbnail">Thumbnail</option>
            <option value="button">Button</option>
          </select>
        </div>
        {acc?.kind === 'thumbnail' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="url"
              value={acc.url}
              onChange={(e) => onChange({ ...block, accessory: { ...acc, url: e.target.value } })}
              placeholder="Thumbnail-URL"
              className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
            />
            <input
              type="text"
              value={acc.description ?? ''}
              onChange={(e) =>
                onChange({
                  ...block,
                  accessory: { ...acc, description: e.target.value.slice(0, 1024) },
                })
              }
              placeholder="Alt-Text (optional)"
              className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
            />
          </div>
        )}
        {acc?.kind === 'button' && (
          <ButtonAccessoryEditor accessory={acc} roles={roles} onChange={(next) => onChange({ ...block, accessory: next })} />
        )}
      </div>
    );
  }

  if (block.type === 'media') {
    return (
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              type="url"
              value={item.url}
              onChange={(e) => {
                const next = [...block.items];
                next[i] = { ...next[i], url: e.target.value };
                onChange({ ...block, items: next });
              }}
              placeholder="Bild-URL"
              className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
            />
            <input
              type="text"
              value={item.description ?? ''}
              onChange={(e) => {
                const next = [...block.items];
                next[i] = { ...next[i], description: e.target.value.slice(0, 1024) };
                onChange({ ...block, items: next });
              }}
              placeholder="Alt-Text"
              className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
            >
              ×
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange({ ...block, items: [...block.items, { url: '' }] })}
          disabled={block.items.length >= 10}
        >
          + Bild ({block.items.length}/10)
        </Button>
      </div>
    );
  }

  if (block.type === 'file') {
    return (
      <input
        type="url"
        value={block.url}
        onChange={(e) => onChange({ ...block, url: e.target.value })}
        placeholder="Datei-URL (attachment://… oder https://…)"
        className="w-full rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
      />
    );
  }

  if (block.type === 'buttons') {
    return (
      <div className="space-y-2">
        {block.buttons.map((btn, i) => (
          <ButtonRow
            key={i}
            button={btn}
            roles={roles}
            onChange={(next) => {
              const arr = [...block.buttons];
              arr[i] = next;
              onChange({ ...block, buttons: arr });
            }}
            onRemove={() =>
              onChange({ ...block, buttons: block.buttons.filter((_, j) => j !== i) })
            }
          />
        ))}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange({
              ...block,
              buttons: [...block.buttons, { kind: 'link', label: '', url: '' }],
            })
          }
          disabled={block.buttons.length >= 5}
        >
          + Button ({block.buttons.length}/5)
        </Button>
      </div>
    );
  }

  return null;
}

function ButtonAccessoryEditor({
  accessory,
  roles,
  onChange,
}: {
  accessory: Extract<V2Accessory, { kind: 'button' }>;
  roles: Role[];
  onChange: (next: Extract<V2Accessory, { kind: 'button' }>) => void;
}) {
  const isRole = Boolean(accessory.roleId);
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[12px]">
        <label className="inline-flex items-center gap-1.5">
          <input
            type="radio"
            checked={!isRole}
            onChange={() => onChange({ ...accessory, roleId: undefined, url: accessory.url ?? '' })}
          />
          Link
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input
            type="radio"
            checked={isRole}
            onChange={() => onChange({ ...accessory, url: undefined, roleId: roles[0]?.id ?? '' })}
          />
          Rolle togglen
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={accessory.label}
          onChange={(e) => onChange({ ...accessory, label: e.target.value.slice(0, 80) })}
          placeholder="Label"
          className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
        />
        {isRole ? (
          <select
            value={accessory.roleId ?? ''}
            onChange={(e) => onChange({ ...accessory, roleId: e.target.value })}
            className="rounded-md bg-elev border border-line-strong px-2 py-1.5 text-[12.5px] text-fg"
          >
            <option value="">— Rolle wählen —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="url"
            value={accessory.url ?? ''}
            onChange={(e) => onChange({ ...accessory, url: e.target.value })}
            placeholder="https://…"
            className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
          />
        )}
      </div>
      {isRole && (
        <select
          value={accessory.style ?? 'secondary'}
          onChange={(e) =>
            onChange({ ...accessory, style: e.target.value as Extract<V2Accessory, { kind: 'button' }>['style'] })
          }
          className="rounded-md bg-elev border border-line-strong px-2 py-1.5 text-[12.5px] text-fg"
        >
          <option value="primary">Primary (blau)</option>
          <option value="secondary">Secondary (grau)</option>
          <option value="success">Success (grün)</option>
          <option value="danger">Danger (rot)</option>
        </select>
      )}
    </div>
  );
}

function ButtonRow({
  button,
  roles,
  onChange,
  onRemove,
}: {
  button: { kind?: 'link' | 'role'; label: string; url?: string; roleId?: string; style?: 'primary' | 'secondary' | 'success' | 'danger' | 'link'; emoji?: string };
  roles: Role[];
  onChange: (next: typeof button) => void;
  onRemove: () => void;
}) {
  const kind = button.kind ?? 'link';
  return (
    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-center">
      <select
        value={kind}
        onChange={(e) => {
          const k = e.target.value as 'link' | 'role';
          onChange({
            ...button,
            kind: k,
            ...(k === 'link' ? { roleId: undefined } : { url: undefined }),
          });
        }}
        className="rounded-md bg-elev border border-line-strong px-2 py-1.5 text-[12.5px] text-fg"
      >
        <option value="link">Link</option>
        <option value="role">Rolle</option>
      </select>
      <input
        type="text"
        value={button.label}
        onChange={(e) => onChange({ ...button, label: e.target.value.slice(0, 80) })}
        placeholder="Label"
        className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
      />
      {kind === 'link' ? (
        <input
          type="url"
          value={button.url ?? ''}
          onChange={(e) => onChange({ ...button, url: e.target.value })}
          placeholder="https://…"
          className="rounded-md bg-elev border border-line-strong px-2.5 py-1.5 text-[12.5px] text-fg"
        />
      ) : (
        <select
          value={button.roleId ?? ''}
          onChange={(e) => onChange({ ...button, roleId: e.target.value })}
          className="rounded-md bg-elev border border-line-strong px-2 py-1.5 text-[12.5px] text-fg"
        >
          <option value="">— Rolle —</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      )}
      <Button type="button" size="sm" variant="ghost" onClick={onRemove}>
        ×
      </Button>
    </div>
  );
}

export function emptyV2Container(): V2Container {
  return emptyContainer();
}
