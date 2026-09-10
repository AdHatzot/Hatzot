/**
 * @team     loop
 * @owner    loop-lead
 * @public   no
 * @updated  2026-09-10
 *
 * A date or time box that reads dd.mm.yyyy / HH:MM:SS regardless of browser
 * locale, backed by a transparent native input laid over it — so clicking
 * anywhere opens the browser's own calendar or clock picker.
 */
import { useRef, type KeyboardEvent } from 'react';
import { displayDate, displayTime } from '../filters';
import { CalendarIcon, ClockIcon } from './LoopIcons';

interface LoopPickerFieldProps {
  kind: 'date' | 'time';
  /** Native value: yyyy-mm-dd or HH:MM:SS. */
  value: string;
  label: string;
  invalid?: boolean;
  min?: string;
  max?: string;
  onChange: (value: string) => void;
}

export function LoopPickerField({ kind, value, label, invalid = false, min, max, onChange }: LoopPickerFieldProps): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = (): void => {
    try {
      inputRef.current?.showPicker();
    } catch {
      // Unsupported or blocked — the focused native input still takes typing.
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  const Icon = kind === 'date' ? CalendarIcon : ClockIcon;

  return (
    <div
      className={`relative flex h-9 items-center gap-3 rounded-md border bg-panel-2 px-3 transition-colors focus-within:border-accent ${
        invalid ? 'border-team-red' : 'border-line-hot hover:border-text-dim'
      } ${kind === 'date' ? 'w-[150px]' : 'w-[124px]'}`}
    >
      <span className="flex-1 text-center font-mono text-sm text-text">
        {kind === 'date' ? displayDate(value) : displayTime(value)}
      </span>
      <Icon className="shrink-0 text-text-dim" />
      <input
        ref={inputRef}
        type={kind}
        step={kind === 'time' ? 1 : undefined}
        value={value}
        min={min}
        max={max}
        aria-label={label}
        aria-invalid={invalid}
        onChange={(event) => {
          // Chrome reports '' while a segment is half-typed; keep the last full value.
          if (event.target.value !== '') onChange(event.target.value);
        }}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        style={{ colorScheme: 'dark' }}
      />
    </div>
  );
}
