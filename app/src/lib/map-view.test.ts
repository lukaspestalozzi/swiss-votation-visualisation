// The view of the map (spec result-map, "Zoom" and "Moving the map"), on a made-up map 1000 by
// 600 units.
import { expect, test } from 'vitest';
import { moveBy, pinchFrom, wholeView, zoomAround } from './map-view.ts';

const MAP = { width: 1000, height: 600 };

test('a zoom in by 2 around the centre halves the width and the height', () => {
  const view = zoomAround(wholeView(MAP), 2, { x: 500, y: 300 }, MAP);
  expect(view).toEqual({ x: 250, y: 150, width: 500, height: 300 });
});

test('a zoom around a point keeps that point in its place in the view', () => {
  const before = wholeView(MAP);
  const point = { x: 200, y: 100 };
  const after = zoomAround(before, 2, point, MAP);
  expect(after).toEqual({ x: 100, y: 50, width: 500, height: 300 });
  expect((point.x - after.x) / after.width).toBe((point.x - before.x) / before.width);
  expect((point.y - after.y) / after.height).toBe((point.y - before.y) / before.height);
});

test('the zoom stays between the whole of Switzerland and 16 times', () => {
  const centre = { x: 500, y: 300 };
  let view = wholeView(MAP);
  for (let i = 0; i < 5; i += 1) view = zoomAround(view, 2, centre, MAP);
  expect(view).toEqual({ x: 468.75, y: 281.25, width: 62.5, height: 37.5 });
  expect(zoomAround(wholeView(MAP), 0.5, centre, MAP)).toEqual(wholeView(MAP));
  // Back out to 1× around a corner: the whole of Switzerland again, not shifted.
  const corner = { x: 100, y: 50 };
  const zoomed = zoomAround(wholeView(MAP), 4, corner, MAP);
  expect(zoomAround(zoomed, 0.25, { x: 900, y: 500 }, MAP)).toEqual(wholeView(MAP));
});

test('a drag moves the view by the distance on the screen', () => {
  // At 4×, the map 500 pixels wide shows 250 units: a pixel is half a unit.
  const view = zoomAround(wholeView(MAP), 4, { x: 500, y: 300 }, MAP);
  expect(view).toEqual({ x: 375, y: 225, width: 250, height: 150 });
  // Dragged 100 pixels to the left, it shows the area 50 units further east.
  expect(moveBy(view, -100, 0, 500, MAP)).toEqual({ x: 425, y: 225, width: 250, height: 150 });
});

test('a drag past the western edge stops with the centre of the view on it', () => {
  const view = zoomAround(wholeView(MAP), 2, { x: 500, y: 300 }, MAP);
  // Dragged far to the right: the view moves west until its centre is at the edge, x = 0.
  expect(moveBy(view, 10000, 0, 500, MAP)).toEqual({ x: -250, y: 150, width: 500, height: 300 });
});

test('two fingers moved apart to twice their distance zoom in by 2 around their midpoint', () => {
  // The map shown 500 pixels wide: at the whole of Switzerland a pixel is 2 units. The fingers'
  // midpoint, pixel (200, 100), is the point (400, 200) of the map.
  const start = { view: wholeView(MAP), a: { x: 150, y: 100 }, b: { x: 250, y: 100 } };
  const now = { a: { x: 100, y: 100 }, b: { x: 300, y: 100 } };
  const view = pinchFrom(start, now, 500, MAP);
  expect(view).toEqual({ x: 200, y: 100, width: 500, height: 300 });
  // The point stays under the midpoint: pixel 200 is unit 200 + 200 × 500 / 500 = 400.
  expect(view.x + (200 * view.width) / 500).toBe(400);
});

test('two fingers moved together move the view by their shift, at the same width', () => {
  // At 4×, the map 500 pixels wide shows 250 units: a pixel is half a unit.
  const view = zoomAround(wholeView(MAP), 4, { x: 500, y: 300 }, MAP);
  const start = { view, a: { x: 200, y: 100 }, b: { x: 300, y: 100 } };
  const now = { a: { x: 140, y: 100 }, b: { x: 240, y: 100 } };
  // Moved 60 pixels to the left: the area 30 units further east, as wide as before.
  expect(pinchFrom(start, now, 500, MAP)).toEqual({ x: 405, y: 225, width: 250, height: 150 });
});

test('two fingers moved together at the whole of Switzerland keep the whole of Switzerland', () => {
  const start = { view: wholeView(MAP), a: { x: 150, y: 100 }, b: { x: 350, y: 100 } };
  const now = { a: { x: 200, y: 100 }, b: { x: 300, y: 100 } };
  expect(pinchFrom(start, now, 500, MAP)).toEqual(wholeView(MAP));
});

test('two fingers moved apart beyond 16 times stop at a sixteenth of the width', () => {
  const start = { view: wholeView(MAP), a: { x: 245, y: 100 }, b: { x: 255, y: 100 } };
  const now = { a: { x: 0, y: 100 }, b: { x: 500, y: 100 } };
  expect(pinchFrom(start, now, 500, MAP).width).toBe(MAP.width / 16);
});

test('a pinch near an edge keeps the point between the fingers under them', () => {
  // At 2×, its centre on the western edge: a pixel is 1 unit. The midpoint, pixel (450, 150), is
  // the point (200, 150). The fingers move together to 80 pixels apart, the midpoint 100 pixels
  // to the left: the view 625 units wide, the point (200, 150) at pixel (350, 150). Zoomed alone
  // around the point, the view's centre would leave the rectangle; with the shift it does not.
  const view = { x: -250, y: 0, width: 500, height: 300 };
  const start = { view, a: { x: 400, y: 150 }, b: { x: 500, y: 150 } };
  const now = { a: { x: 310, y: 150 }, b: { x: 390, y: 150 } };
  expect(pinchFrom(start, now, 500, MAP)).toEqual({
    x: -237.5,
    y: -37.5,
    width: 625,
    height: 375,
  });
});

test('two fingers moved without spreading keep a moved whole of Switzerland', () => {
  // The whole of Switzerland moved 100 pixels to the right: 200 units west.
  const view = moveBy(wholeView(MAP), 100, 0, 500, MAP);
  expect(view).toEqual({ x: -200, y: 0, width: 1000, height: 600 });
  const start = { view, a: { x: 200, y: 100 }, b: { x: 300, y: 100 } };
  expect(pinchFrom(start, start, 500, MAP)).toEqual(view);
});
