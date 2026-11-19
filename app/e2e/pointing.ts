// Helpers of the browser tests that point at the map.
import type { Page } from '@playwright/test';

// A point on the screen inside a shape of the map, where the shape is the topmost element. The
// shape is scrolled into view first: outside the window no element is found at a point. With a
// `margin`, the points that many pixels to the left, right, top and bottom are the shape's too:
// a finger's point on a phone is rounded to its screen's pixels, and a point at the shape's
// border could fall on its neighbour.
export async function pointIn(
  page: Page,
  selector: string,
  margin = 0,
): Promise<{ x: number; y: number }> {
  await page.locator('.municipalities path').nth(2000).waitFor();
  await page.locator(selector).scrollIntoViewIfNeeded();
  return page.locator(selector).evaluate((element, around) => {
    const path = element as SVGPathElement;
    const box = path.getBBox();
    const matrix = path.getScreenCTM();
    if (matrix === null) throw new Error('the shape is not on the screen');
    const offsets =
      around === 0
        ? [[0, 0]]
        : [
            [0, 0],
            [-around, 0],
            [around, 0],
            [0, -around],
            [0, around],
          ];
    for (let i = 1; i < 40; i += 1) {
      for (let j = 1; j < 40; j += 1) {
        const inside = new DOMPoint(box.x + (box.width * i) / 40, box.y + (box.height * j) / 40);
        if (!path.isPointInFill(inside)) continue;
        const onScreen = inside.matrixTransform(matrix);
        const onTop = offsets.every(
          ([dx = 0, dy = 0]) =>
            document.elementFromPoint(onScreen.x + dx, onScreen.y + dy) === path,
        );
        if (onTop) return { x: onScreen.x, y: onScreen.y };
      }
    }
    throw new Error('no point inside the shape is on top');
  }, margin);
}
