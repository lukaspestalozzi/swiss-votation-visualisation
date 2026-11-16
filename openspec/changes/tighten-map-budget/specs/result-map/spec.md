## MODIFIED Requirements

### Requirement: The map's performance budget

Each frame the browser draws after a zoom step, a move of the map, pointing at a municipality
(the first time after the page has loaded included) or clicking one, which fills the panel,
SHALL take at most 16 ms of work on the page's main thread: the handling of the input and the
drawing that follows. The browser tests measure it with 50 ms between a pointer's arrival and a
click, as a person leaves, and once more when a frame exceeds it, as their machine may be busy.

#### Scenario: Zooming, moving and pointing

- **WHEN** the browser tests open `/votes/5960/`, wait until the characteristics have loaded,
  move the pointer onto the map, zoom in four times, drag the map, and point at three
  municipalities
- **THEN** no frame after these inputs, the first pointing at a municipality included, took
  more than 16 ms of work on the main thread, in the first measurement or, when a frame
  exceeded it, in the second

#### Scenario: Clicking municipalities

- **WHEN** the browser tests click three municipalities on `/votes/5960/` once the
  characteristics have loaded, each after showing the whole of Switzerland, pointing at it and
  waiting 50 ms
- **THEN** no frame after these inputs took more than 16 ms of work on the main thread, in the
  first measurement or, when a frame exceeded it, in the second
