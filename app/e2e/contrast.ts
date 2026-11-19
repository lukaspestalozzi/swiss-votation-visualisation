// The contrast of every text and control on a page (spec site-style; design of add-site-style,
// decision 11), with WCAG 2.2's ratio of relative luminances.
import type { Page } from '@playwright/test';

/** A text below its threshold: its start, its ratio, and its colour and ground as `#rrggbb`. */
export interface LowContrast {
  readonly text: string;
  readonly ratio: number;
  readonly colour: string;
  readonly ground: string;
}

/**
 * A control's contrast: of its border or its fill, whichever is the larger, against the colour
 * behind it (1.4.11), and of its text against its fill or ground (1.4.3), when it has text.
 */
export interface ControlContrast {
  readonly selector: string;
  readonly boundary: number;
  readonly text: number | null;
}

type Request = { readonly kind: 'texts' } | { readonly kind: 'controls'; readonly of: string[] };

// Runs in the page: Playwright sends its source, so everything it uses is inside it.
function measure(request: Request): LowContrast[] | ControlContrast[] {
  type Rgba = readonly [number, number, number, number];
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (context === null) throw new Error('no 2d context');
  // Any CSS colour, `rgb()` or `color(srgb …)` alike, through one pixel of a canvas.
  const parse = (value: string): Rgba => {
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0, a = 0] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const over = (top: Rgba, bottom: Rgba): Rgba => [
    top[0] * top[3] + bottom[0] * (1 - top[3]),
    top[1] * top[3] + bottom[1] * (1 - top[3]),
    top[2] * top[3] + bottom[2] * (1 - top[3]),
    1,
  ];
  const probe = document.createElement('div');
  probe.style.background = 'Canvas';
  document.body.append(probe);
  const canvasColour = parse(getComputedStyle(probe).backgroundColor);
  probe.remove();

  // The first opaque ground behind an element, with the translucent grounds between laid over it.
  const groundOf = (element: Element | null): Rgba => {
    const layers: Rgba[] = [];
    for (let node = element; node !== null; node = node.parentElement) {
      const background = parse(getComputedStyle(node).backgroundColor);
      if (background[3] > 0) layers.push(background);
      if (background[3] === 1) break;
    }
    const outermost = layers.at(-1);
    let ground = outermost?.[3] === 1 ? outermost : canvasColour;
    const translucent = outermost === ground ? layers.slice(0, -1) : layers;
    for (const layer of translucent.reverse()) ground = over(layer, ground);
    return ground;
  };
  const luminance = ([r, g, b]: Rgba) => {
    const [lr, lg, lb] = [r, g, b].map((channel) => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const ratioOf = (a: Rgba, b: Rgba) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  const hex = (colour: Rgba) =>
    `#${colour
      .slice(0, 3)
      .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
      .join('')}`;

  if (request.kind === 'controls') {
    return request.of.map((selector) => {
      // `.track::before` names a pseudo-element, whose fill is the track.
      const [element_, pseudo] = selector.split(/(?=::)/);
      const element = document.querySelector(element_ ?? '');
      if (element === null) throw new Error(`no control ${selector}`);
      const style = getComputedStyle(element, pseudo ?? null);
      const ground = groundOf(pseudo === undefined ? element.parentElement : element);
      const fill = over(parse(style.backgroundColor), ground);
      const bordered = parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none';
      const border = bordered ? over(parse(style.borderTopColor), fill) : fill;
      const text = pseudo === undefined && (element.textContent ?? '').trim() !== '';
      return {
        selector,
        boundary: Math.max(ratioOf(border, ground), ratioOf(fill, ground)),
        text: text ? ratioOf(over(parse(style.color), fill), fill) : null,
      };
    });
  }

  const low: LowContrast[] = [];
  for (const element of document.body.querySelectorAll('*')) {
    if (element.closest('svg, option, :disabled') !== null) continue;
    const own = [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? '')
      .join('')
      .trim();
    if (own === '' || !element.checkVisibility({ visibilityProperty: true })) continue;
    const style = getComputedStyle(element);
    const ground = groundOf(element);
    const colour = over(parse(style.color), ground);
    const size = parseFloat(style.fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
    const ratio = ratioOf(colour, ground);
    if (ratio < (large ? 3 : 4.5)) {
      low.push({ text: own.slice(0, 40), ratio, colour: hex(colour), ground: hex(ground) });
    }
  }
  return low;
}

/**
 * Every text of the page whose contrast is below WCAG 2.2's threshold (1.4.3): 4.5:1, or 3:1 for
 * large text, from 24 pixels or from 18.66 pixels in bold. A text is every element with text of
 * its own that is shown; its colour lies over the first ground behind it that is opaque, with
 * any translucent grounds between them laid over it in turn, and over the canvas where nothing is
 * opaque. The SVG holds no text and is skipped, as are the options of a list, which the browser
 * draws apart, and a control that cannot be used, which WCAG exempts.
 */
export async function lowContrast(page: Page): Promise<LowContrast[]> {
  return (await page.evaluate(measure, { kind: 'texts' })) as LowContrast[];
}

/** The contrast of the first element each selector names, as `ControlContrast` says. */
export async function controlContrast(page: Page, of: string[]): Promise<ControlContrast[]> {
  return (await page.evaluate(measure, { kind: 'controls', of })) as ControlContrast[];
}

/** The colour of one pixel of the page as the screen shows it: `[r, g, b]`, 0 to 255. */
export async function pixelAt(page: Page, x: number, y: number): Promise<number[]> {
  const shot = await page.screenshot({ clip: { x: Math.round(x), y: Math.round(y), width: 1, height: 1 } });
  return page.evaluate(async (png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (context === null) throw new Error('no 2d context');
    context.drawImage(image, 0, 0);
    return [...context.getImageData(0, 0, 1, 1).data.slice(0, 3)];
  }, shot.toString('base64'));
}

/** WCAG 2.2's contrast of two colours `[r, g, b]`, 0 to 255. */
export function ratioOf(a: readonly number[], b: readonly number[]): number {
  const luminance = (colour: readonly number[]) => {
    const [r = 0, g = 0, bl = 0] = colour.map((channel) => {
      const c = channel / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [high = 0, low = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}
