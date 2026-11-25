// The budget of a step, as the budget tests judge a measurement (spec result-map, "The map's
// performance budget"; design of redesign-site, decision 31): at least nine frames in ten within
// 16 ms, none over 50 ms. No page is opened.
import { expect, test } from '@playwright/test';
import { beyondBudget } from './frames.ts';

const framesOf = (...works: number[]) => works.map((work) => ({ type: 'input', work }));
const quick = Array<number>(36).fill(7);

test('every frame within 16 ms: within the budget', () => {
  expect(beyondBudget(framesOf(...quick, 16, 16, 16, 16))).toEqual([]);
});

test('a tenth of the frames over 16 ms, none over 50: within the budget', () => {
  expect(beyondBudget(framesOf(...quick, 16.1, 20, 33, 50))).toEqual([]);
});

test('more than a tenth of the frames over 16 ms: those frames', () => {
  expect(beyondBudget(framesOf(...quick.slice(1), 16.1, 17, 18, 19, 20))).toEqual(
    framesOf(16.1, 17, 18, 19, 20),
  );
});

test('a frame over 50 ms: that frame, however few are over 16 ms', () => {
  expect(beyondBudget(framesOf(...quick, 7, 7, 20, 50.1))).toEqual(framesOf(50.1));
});

test('no frame measured: within the budget', () => {
  expect(beyondBudget([])).toEqual([]);
});
