import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../../tests/axe';
import { ColorPicker } from './ColorPicker';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb } from './colorConversions';
import { AIProvider } from '../../providers/AIProvider';
import type { AIClient } from '../../contexts/AIContext';

describe('color conversions', () => {
  it('hexToRgb parses 6-digit and 3-digit hex, with or without "#"', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#00f')).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('hexToRgb returns null for invalid input', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
  });

  it('rgbToHex round-trips with hexToRgb', () => {
    expect(rgbToHex({ r: 59, g: 130, b: 246 })).toBe('#3b82f6');
    expect(hexToRgb(rgbToHex({ r: 59, g: 130, b: 246 }))).toEqual({ r: 59, g: 130, b: 246 });
  });

  it('rgbToHsl converts pure red correctly', () => {
    expect(rgbToHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('hslToRgb round-trips with rgbToHsl for a known color', () => {
    const rgb = { r: 59, g: 130, b: 246 };
    const hsl = rgbToHsl(rgb);
    const roundTripped = hslToRgb(hsl);
    // Rounding through HSL can be off by a shade — assert closeness, not exact equality.
    expect(Math.abs(roundTripped.r - rgb.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(roundTripped.g - rgb.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(roundTripped.b - rgb.b)).toBeLessThanOrEqual(2);
  });

  it('rgbToHsv converts pure blue correctly', () => {
    expect(rgbToHsv({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, v: 100 });
  });

  it('hsvToRgb round-trips with rgbToHsv for a known color', () => {
    const rgb = { r: 59, g: 130, b: 246 };
    const hsv = rgbToHsv(rgb);
    const roundTripped = hsvToRgb(hsv);
    expect(Math.abs(roundTripped.r - rgb.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(roundTripped.g - rgb.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(roundTripped.b - rgb.b)).toBeLessThanOrEqual(2);
  });

  it('rgbToHsl/rgbToHsv treat pure gray as zero saturation with no defined hue', () => {
    expect(rgbToHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
    expect(rgbToHsv({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });
});

describe('ColorPicker', () => {
  it('renders the saturation/brightness square and hue slider', () => {
    render(<ColorPicker defaultValue="#3b82f6" />);
    expect(screen.getByRole('slider', { name: 'Saturation and brightness' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Hue' })).toBeInTheDocument();
  });

  it('shows the current value in the hex field', () => {
    render(<ColorPicker defaultValue="#3b82f6" />);
    expect(screen.getByLabelText('Hex')).toHaveValue('#3b82f6');
  });

  it('shows the current RGB channels', () => {
    render(<ColorPicker defaultValue="#3b82f6" />);
    expect(screen.getByLabelText('R')).toHaveValue(59);
    expect(screen.getByLabelText('G')).toHaveValue(130);
    expect(screen.getByLabelText('B')).toHaveValue(246);
  });

  it('typing a valid hex and blurring commits it and calls onChange', () => {
    const onChange = vi.fn();
    render(<ColorPicker defaultValue="#3b82f6" onChange={onChange} />);
    const hexField = screen.getByLabelText('Hex');
    fireEvent.change(hexField, { target: { value: '#ff0000' } });
    fireEvent.blur(hexField);
    expect(onChange).toHaveBeenCalledWith('#ff0000');
    expect(screen.getByLabelText('R')).toHaveValue(255);
  });

  it('reverts an invalid hex on blur instead of committing it', () => {
    const onChange = vi.fn();
    render(<ColorPicker defaultValue="#3b82f6" onChange={onChange} />);
    const hexField = screen.getByLabelText('Hex');
    fireEvent.change(hexField, { target: { value: 'not-a-color' } });
    fireEvent.blur(hexField);
    expect(onChange).not.toHaveBeenCalled();
    expect(hexField).toHaveValue('#3b82f6');
  });

  it('changing an RGB channel updates the hex value', () => {
    const onChange = vi.fn();
    render(<ColorPicker defaultValue="#000000" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('R'), { target: { value: '255' } });
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('ArrowRight/ArrowLeft on the square adjust saturation', async () => {
    const user = userEvent.setup();
    render(<ColorPicker defaultValue="#808080" />);
    const square = screen.getByRole('slider', { name: 'Saturation and brightness' });
    square.focus();
    const before = square.getAttribute('aria-valuenow');
    await user.keyboard('{ArrowRight}');
    expect(square.getAttribute('aria-valuenow')).not.toBe(before);
  });

  it('ArrowRight/ArrowLeft on the hue track adjust hue', async () => {
    const user = userEvent.setup();
    render(<ColorPicker defaultValue="#ff0000" />);
    const hue = screen.getByRole('slider', { name: 'Hue' });
    hue.focus();
    expect(hue).toHaveAttribute('aria-valuenow', '0');
    await user.keyboard('{ArrowRight}');
    expect(hue).toHaveAttribute('aria-valuenow', '1');
  });

  it('applies a preset when clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ColorPicker defaultValue="#000000" onChange={onChange} presets={['#ff0000', '#00ff00']} />,
    );
    await user.click(screen.getByRole('button', { name: '#ff0000' }));
    expect(onChange).toHaveBeenCalledWith('#ff0000');
  });

  it('marks the matching preset as pressed', () => {
    render(<ColorPicker defaultValue="#ff0000" presets={['#ff0000', '#00ff00']} />);
    expect(screen.getByRole('button', { name: '#ff0000' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '#00ff00' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('disables all controls when disabled', () => {
    render(<ColorPicker defaultValue="#3b82f6" presets={['#ff0000']} disabled />);
    expect(screen.getByRole('slider', { name: 'Saturation and brightness' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(screen.getByRole('slider', { name: 'Hue' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByLabelText('Hex')).toBeDisabled();
    expect(screen.getByRole('button', { name: '#ff0000' })).toBeDisabled();
  });

  it('supports controlled usage', () => {
    function Controlled() {
      const [value, setValue] = useState('#3b82f6');
      return (
        <>
          <ColorPicker value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue('#00ff00')}>
            Set green
          </button>
        </>
      );
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole('button', { name: 'Set green' }));
    expect(screen.getByLabelText('Hex')).toHaveValue('#00ff00');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ColorPicker defaultValue="#3b82f6" presets={['#ff0000']} />);
    await expectNoA11yViolations(container);
  });

  describe('aiSuggest', () => {
    it('renders no AI trigger when aiSuggest is omitted', () => {
      render(<ColorPicker defaultValue="#3b82f6" />);
      expect(screen.queryByRole('button', { name: 'Suggest with AI' })).not.toBeInTheDocument();
    });

    it('renders no AI trigger when aiSuggest is true but no AIProvider is mounted', () => {
      render(<ColorPicker defaultValue="#3b82f6" aiSuggest />);
      expect(screen.queryByRole('button', { name: 'Suggest with AI' })).not.toBeInTheDocument();
    });

    it('renders the AI trigger when a provider is mounted', () => {
      const client: AIClient = { complete: vi.fn() };
      render(
        <AIProvider client={client}>
          <ColorPicker defaultValue="#3b82f6" aiSuggest />
        </AIProvider>,
      );
      expect(screen.getByRole('button', { name: 'Suggest with AI' })).toBeInTheDocument();
    });

    it('triggers the AI client on open with the current hex, and accepting applies a valid suggestion', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const complete = vi.fn().mockResolvedValue('#ff8800');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <ColorPicker defaultValue="#3b82f6" onChange={onChange} aiSuggest />
        </AIProvider>,
      );

      await user.click(screen.getByRole('button', { name: 'Suggest with AI' }));
      expect(complete).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: expect.stringContaining('#3b82f6') }),
      );
      await user.click(await screen.findByRole('button', { name: 'Accept' }));
      expect(screen.getByLabelText('Hex')).toHaveValue('#ff8800');
      expect(onChange).toHaveBeenCalledWith('#ff8800');
    });

    it('ignores an accepted suggestion that does not parse as a valid hex color', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const complete = vi.fn().mockResolvedValue('not a color');
      const client: AIClient = { complete };
      render(
        <AIProvider client={client}>
          <ColorPicker defaultValue="#3b82f6" onChange={onChange} aiSuggest />
        </AIProvider>,
      );
      await user.click(screen.getByRole('button', { name: 'Suggest with AI' }));
      await user.click(await screen.findByRole('button', { name: 'Accept' }));
      expect(screen.getByLabelText('Hex')).toHaveValue('#3b82f6');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('has no accessibility violations with the AI trigger rendered', async () => {
      const client: AIClient = { complete: vi.fn() };
      const { container } = render(
        <AIProvider client={client}>
          <ColorPicker defaultValue="#3b82f6" aiSuggest />
        </AIProvider>,
      );
      await expectNoA11yViolations(container);
    });
  });
});
