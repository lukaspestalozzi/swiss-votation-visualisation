// The part of the map that is shown, as the view box of its SVG (spec result-map, "Zoom" and
// "Moving the map"; design of add-result-map, decision 15). Coordinates are those of map.json:
// metres from the top left corner of the rectangle around Switzerland.

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface View extends Point, Size {}

// The closest zoom: a sixteenth of the width of Switzerland.
export const MAX_ZOOM = 16;

/** The whole of Switzerland. */
export function wholeView(map: Size): View {
  return { x: 0, y: 0, width: map.width, height: map.height };
}

/** The view zoomed by `factor` (above 1 in, below 1 out) around `point`, which stays put. */
export function zoomAround(view: View, factor: number, point: Point, map: Size): View {
  const width = Math.min(map.width, Math.max(map.width / MAX_ZOOM, view.width / factor));
  if (width === map.width) return wholeView(map);
  const scale = width / view.width;
  const zoomed = {
    x: point.x - (point.x - view.x) * scale,
    y: point.y - (point.y - view.y) * scale,
    width: view.width * scale,
    height: view.height * scale,
  };
  return withinMap(zoomed, map);
}

/**
 * The view after a drag of `dx` and `dy` pixels on a map shown `pixelsWide` pixels wide: the map
 * follows the pointer.
 */
export function moveBy(view: View, dx: number, dy: number, pixelsWide: number, map: Size): View {
  const unitsPerPixel = view.width / pixelsWide;
  return withinMap(
    { ...view, x: view.x - dx * unitsPerPixel, y: view.y - dy * unitsPerPixel },
    map,
  );
}

/** Two fingers on the map, in pixels from its top left corner. */
export interface Fingers {
  readonly a: Point;
  readonly b: Point;
}

/**
 * The view while two fingers pinch (design of add-small-screens, decision 9): from the view when
 * the second finger touched, zoomed by the ratio of the fingers' distances, between the whole of
 * Switzerland and 16 times, and placed so that the point of the map that was then midway between
 * them is midway between them now, on a map shown `pixelsWide` pixels wide. The view is kept
 * inside the map once, at the end, so that a pinch near an edge does not jump. Taken from the
 * start, not step by step, so that rounding does not drift.
 */
export function pinchFrom(
  start: Fingers & { readonly view: View },
  now: Fingers,
  pixelsWide: number,
  map: Size,
): View {
  const distance = ({ a, b }: Fingers): number => Math.hypot(b.x - a.x, b.y - a.y);
  const midpoint = ({ a, b }: Fingers): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const from = midpoint(start);
  const to = midpoint(now);
  const before = start.view.width / pixelsWide;
  const point = { x: start.view.x + from.x * before, y: start.view.y + from.y * before };
  const factor = distance(start) === 0 ? 1 : distance(now) / distance(start);
  const width = Math.min(map.width, Math.max(map.width / MAX_ZOOM, start.view.width / factor));
  const after = width / pixelsWide;
  return withinMap(
    {
      x: point.x - to.x * after,
      y: point.y - to.y * after,
      width,
      height: (start.view.height * width) / start.view.width,
    },
    map,
  );
}

/** The view moved so that its centre lies inside the map's rectangle. */
function withinMap(view: View, map: Size): View {
  const clamp = (value: number, low: number, high: number): number =>
    Math.min(high, Math.max(low, value));
  return {
    ...view,
    x: clamp(view.x, -view.width / 2, map.width - view.width / 2),
    y: clamp(view.y, -view.height / 2, map.height - view.height / 2),
  };
}
