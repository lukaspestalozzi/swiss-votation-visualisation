// The view of the map (spec result-map, "Zoom" and "Moving the map"), on a made-up map 1000 by
// 600 units.
import { expect, test } from 'vitest';
import { wholeView, zoomAround } from './map-view.ts';

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
