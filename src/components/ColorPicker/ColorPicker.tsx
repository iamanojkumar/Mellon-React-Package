import { useEffect, useId, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useControllableState } from '../../hooks/useControllableState';
import { clamp } from '../Slider/Slider';
import { mergeClasses } from '../../utilities/mergeClasses';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from './colorConversions';
import type { HSV, RGB } from './colorConversions';
import { useAI } from '../../hooks/useAI';
import { useAIAction } from '../../hooks/useAIAction';
import { AISuggestionPopover } from '../AISuggestionPopover/AISuggestionPopover';
import styles from './ColorPicker.module.css';

export interface ColorPickerProps {
  /** Hex color, e.g. `"#3b82f6"`. */
  value?: string;
  defaultValue?: string;
  onChange?: (hex: string) => void;
  /** Swatch shortcuts shown below the picker. */
  presets?: string[];
  disabled?: boolean;
  className?: string;
  /**
   * Adds an AI-powered "Suggest with AI" trigger — suggests a matching/
   * complementary hex color for the current one. Off by default, and a
   * no-op even when `true` unless an ancestor `AIProvider` is mounted —
   * the rendered output is byte-identical to today's whenever this
   * doesn't apply. Same accept/reject shape as `TextArea`'s `aiRewrite`;
   * an accepted suggestion only applies if it parses as a valid hex color
   * (an invalid AI response is silently ignored, not applied).
   */
  aiSuggest?: boolean;
  /** Builds the prompt sent to the AI client from the current hex value. Defaults to a generic complementary-color instruction. */
  buildAIPrompt?: (hex: string) => string;
  /** Accessible label for the AI trigger button. Defaults to `'Suggest with AI'`. */
  aiSuggestLabel?: string;
}

function defaultBuildAIPrompt(hex: string): string {
  return `Suggest a single complementary or matching color for ${hex}. Respond with only a hex color code, e.g. #3b82f6.`;
}

const DEFAULT_COLOR = '#3b82f6';

/**
 * A saturation/brightness square + hue slider, both built on
 * `usePointerDrag` the same way `Slider` is: `getBoundingClientRect()` read
 * fresh on every move (not cached at drag start) and converted straight to
 * an absolute value, so pointerdown anywhere jumps there and a mid-drag
 * layout shift can't desync the thumb from the pointer. Reuses `Slider`'s
 * exported `clamp` helper directly rather than redefining it.
 *
 * Internally tracks HSV (hue/saturation/*value*-brightness), not HSL,
 * because the square's background is two exact, literal CSS gradients only
 * in HSV space (white->transparent horizontally for saturation, black->
 * transparent vertically for brightness) — HSL's saturation/lightness pair
 * doesn't decompose into two independent linear gradients the same way.
 * `value`/`onChange` are hex regardless — HSV is purely an implementation
 * detail of the square's math, and `colorConversions.ts` exports the full
 * HEX/RGB/HSL/HSV conversion set docs/SPEC.md's Phase 17 note calls for.
 * Hue/saturation are kept as their own state, only re-derived from an
 * *externally* changed `value` (not on every internally-driven update) —
 * the same "sync display state only on outside changes" shape `Combobox`
 * already established — because HSV round-trips through hex are lossy at
 * the grayscale boundary (0% saturation encodes no hue at all), which
 * would otherwise make the hue thumb jump unpredictably while dragging
 * toward the square's white edge.
 *
 * The square's white/black gradient stops and the hue track's rainbow
 * stops are hardcoded raw colors, not `--ds-*` tokens — a deliberate
 * exception CLAUDE.md's token rule itself carves out for "genuinely
 * component-intrinsic" values: white=0%-saturation and black=0%-brightness
 * are color-science constants this picker's math depends on, not a
 * themeable decorative choice, and must stay literally white/black in
 * every theme or the picker becomes mathematically wrong.
 *
 * The 2D square has no standard WAI-ARIA widget pattern (`role="slider"`
 * only carries one `aria-valuenow`) — it's exposed as a single
 * `role="slider"` with `aria-valuenow` set to saturation and
 * `aria-valuetext` describing *both* axes in words, a pragmatic choice
 * over inventing a non-standard multi-value role. Arrow keys still cover
 * both axes (Left/Right adjust saturation, Up/Down adjust brightness), so
 * keyboard access isn't lost even though the ARIA value exposure is
 * necessarily approximate.
 */
export function ColorPicker({
  value,
  defaultValue = DEFAULT_COLOR,
  onChange,
  presets,
  disabled = false,
  className,
  aiSuggest = false,
  buildAIPrompt = defaultBuildAIPrompt,
  aiSuggestLabel = 'Suggest with AI',
}: ColorPickerProps) {
  const [hex, setHex] = useControllableState<string>({ value, defaultValue, onChange });
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(hexToRgb(hex) ?? { r: 0, g: 0, b: 0 }));
  const [hexInput, setHexInput] = useState(hex);

  const squareRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const hexInputId = useId();

  // Re-derive hsv only when `hex` changes from *outside* this component's
  // own drag/keyboard/hex-input updates (all of which call `updateFromHsv`,
  // which sets `hsv` directly) — see this component's own doc comment for
  // why re-deriving on every render would lose hue at the grayscale edge.
  useEffect(() => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    setHsv((current) => {
      const next = rgbToHsv(rgb);
      return next.s === 0 && next.v !== 0 ? { ...next, h: current.h } : next;
    });
    setHexInput(hex);
  }, [hex]);

  function updateFromHsv(next: HSV) {
    setHsv(next);
    setHex(rgbToHex(hsvToRgb(next)));
  }

  function updateFromRgb(next: RGB) {
    updateFromHsv(rgbToHsv(next));
  }

  function squareValueFromPointer(clientX: number, clientY: number): HSV {
    const rect = squareRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return hsv;
    const s = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const v = clamp(100 - ((clientY - rect.top) / rect.height) * 100, 0, 100);
    return { ...hsv, s, v };
  }

  function hueValueFromPointer(clientX: number): number {
    const rect = hueRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return hsv.h;
    return clamp(((clientX - rect.left) / rect.width) * 360, 0, 360);
  }

  const square = usePointerDrag({
    disabled,
    onDragStart: (event) => updateFromHsv(squareValueFromPointer(event.clientX, event.clientY)),
    onDragMove: (event) => updateFromHsv(squareValueFromPointer(event.clientX, event.clientY)),
  });

  const hueDrag = usePointerDrag({
    disabled,
    onDragStart: (event) => updateFromHsv({ ...hsv, h: hueValueFromPointer(event.clientX) }),
    onDragMove: (event) => updateFromHsv({ ...hsv, h: hueValueFromPointer(event.clientX) }),
  });

  function handleSquareKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowRight':
        updateFromHsv({ ...hsv, s: clamp(hsv.s + step, 0, 100) });
        break;
      case 'ArrowLeft':
        updateFromHsv({ ...hsv, s: clamp(hsv.s - step, 0, 100) });
        break;
      case 'ArrowUp':
        updateFromHsv({ ...hsv, v: clamp(hsv.v + step, 0, 100) });
        break;
      case 'ArrowDown':
        updateFromHsv({ ...hsv, v: clamp(hsv.v - step, 0, 100) });
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function handleHueKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const step = event.shiftKey ? 10 : 1;
    switch (event.key) {
      case 'ArrowRight':
        updateFromHsv({ ...hsv, h: (hsv.h + step) % 360 });
        break;
      case 'ArrowLeft':
        updateFromHsv({ ...hsv, h: (hsv.h - step + 360) % 360 });
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function commitHexInput(raw: string) {
    const rgb = hexToRgb(raw);
    if (rgb) {
      updateFromRgb(rgb);
    } else {
      setHexInput(hex);
    }
  }

  function handleRgbChannelChange(channel: keyof RGB, raw: string) {
    const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
    const parsed = clamp(Number(raw) || 0, 0, 255);
    updateFromRgb({ ...rgb, [channel]: parsed });
  }

  const currentRgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };

  const aiClient = useAI();
  const aiAction = useAIAction();
  const showAI = aiSuggest && !!aiClient;

  function applyAISuggestion(suggested: string) {
    const rgb = hexToRgb(suggested.trim());
    if (rgb) updateFromRgb(rgb);
  }

  return (
    <div
      className={mergeClasses(styles.colorPicker, className)}
      data-disabled={disabled || undefined}
    >
      <div
        ref={squareRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Saturation and brightness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(hsv.s)}
        aria-valuetext={`Saturation ${Math.round(hsv.s)}%, brightness ${Math.round(hsv.v)}%`}
        aria-disabled={disabled || undefined}
        className={styles.square}
        style={{ background: `hsl(${hsv.h}, 100%, 50%)` }}
        onKeyDown={handleSquareKeyDown}
        {...square.handlers}
      >
        <div className={styles.squareWhiteLayer} />
        <div className={styles.squareBlackLayer} />
        <div className={styles.squareThumb} style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }} />
      </div>

      <div
        ref={hueRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        aria-disabled={disabled || undefined}
        className={styles.hueTrack}
        onKeyDown={handleHueKeyDown}
        {...hueDrag.handlers}
      >
        <div className={styles.hueThumb} style={{ left: `${(hsv.h / 360) * 100}%` }} />
      </div>

      <div className={styles.fields}>
        <div className={styles.preview} style={{ background: hex }} aria-hidden="true" />
        <label className={styles.hexLabel} htmlFor={hexInputId}>
          <span className={styles.fieldLabel}>Hex</span>
          <input
            id={hexInputId}
            type="text"
            className={styles.hexInput}
            value={hexInput}
            disabled={disabled}
            onChange={(event: ChangeEvent<HTMLInputElement>) => setHexInput(event.target.value)}
            onBlur={(event) => commitHexInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitHexInput(event.currentTarget.value);
            }}
          />
        </label>
        {(['r', 'g', 'b'] as const).map((channel) => (
          <label key={channel} className={styles.rgbLabel}>
            <span className={styles.fieldLabel}>{channel.toUpperCase()}</span>
            <input
              type="number"
              min={0}
              max={255}
              className={styles.rgbInput}
              value={currentRgb[channel]}
              disabled={disabled}
              onChange={(event) => handleRgbChannelChange(channel, event.target.value)}
            />
          </label>
        ))}
      </div>

      {showAI && (
        <div className={styles.aiRow}>
          <AISuggestionPopover
            triggerLabel={aiSuggestLabel}
            status={aiAction.status}
            result={aiAction.result}
            error={aiAction.error}
            onOpenChange={(open) => {
              if (open) {
                aiAction.trigger({ prompt: buildAIPrompt(hex) });
              } else {
                aiAction.reset();
              }
            }}
            onAccept={applyAISuggestion}
            onReject={() => aiAction.reset()}
            onRetry={() => aiAction.trigger({ prompt: buildAIPrompt(hex) })}
          />
        </div>
      )}

      {presets && presets.length > 0 && (
        <div role="group" aria-label="Preset colors" className={styles.presets}>
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={styles.presetSwatch}
              style={{ background: preset }}
              aria-label={preset}
              aria-pressed={preset.toLowerCase() === hex.toLowerCase()}
              disabled={disabled}
              onClick={() => {
                const rgb = hexToRgb(preset);
                if (rgb) updateFromRgb(rgb);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

ColorPicker.displayName = 'ColorPicker';
