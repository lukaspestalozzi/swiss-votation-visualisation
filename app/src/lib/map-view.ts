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
  return {
    x: point.x - (point.x - view.x) * scale,
    y: point.y - (point.y - view.y) * scale,
    width: view.width * scale,
    height: view.height * scale,
  };
}
