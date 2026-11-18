## ADDED Requirements

### Requirement: A tap does what a click does

On a touch screen, a tap on a municipality SHALL do what a click does: show its details, show its
characteristics in the panel, and outline it. A tap on a lake or outside Switzerland SHALL show
no details, and SHALL keep the panel and the outline as they were.

#### Scenario: Tapping Zürich

- **WHEN** a visitor on a touch screen 412 pixels wide opens `/de/votes/5960/` and taps Zürich
- **THEN** the map shows "Zürich (ZH)" with "Ja-Anteil: 31.85%", the panel shows "Zürich (ZH)"
  with "Einwohner: 396'955", and Zürich is outlined (`investigations/map-data.md`,
  `investigations/characteristics.md`)

#### Scenario: Tapping a lake

- **WHEN** that visitor then taps the middle of the Zürichsee
- **THEN** the map shows no details, and the panel still shows "Zürich (ZH)", outlined on the map

### Requirement: The municipality last clicked or tapped is outlined

The municipality last clicked or tapped, whose characteristics the panel shows, SHALL be
outlined on the map by a black line 3 pixels wide on a white line 7 pixels wide, above the
borders of the cantons, at every zoom the same width on the screen. Pointing alone SHALL NOT
move the outline. Before the first click or tap, no municipality is outlined.

#### Scenario: Before clicking

- **WHEN** a visitor opens `/de/votes/5960/` and the map has loaded
- **THEN** no municipality is outlined

#### Scenario: Clicking, pointing, clicking again

- **WHEN** a visitor on `/de/votes/5960/` clicks Zürich, points at Bern, and then clicks Bern
- **THEN** after the click on Zürich and while pointing at Bern, Zürich is outlined; after the
  click on Bern, Bern is outlined and Zürich is not

#### Scenario: A set-aside municipality

- **WHEN** a visitor on `/de/votes/5960/` moves the upper bound of "Ausländeranteil" to step 327
  and clicks Zürich
- **THEN** Zürich, filled with `#2c2c2c`, is outlined (`investigations/limits.md`, 3)

### Requirement: The budget of fingers

Each frame the browser draws after a step of one finger or two moving on the map, or after a tap
on a municipality, which fills the panel, SHALL take at most 16 ms of work on the page's main
thread, as for the map's other inputs. The browser tests measure it on a touch screen's
emulation, and once more when a frame exceeds it.

#### Scenario: Pinching, moving and tapping

- **WHEN** the browser tests, on a touch screen 412 pixels wide, open `/de/votes/5960/`, wait
  until the characteristics have loaded, zoom in twice with two fingers, move the map with one
  finger, and tap three municipalities, each after showing the whole of Switzerland
- **THEN** no frame after these inputs took more than 16 ms of work on the main thread, in the
  first measurement or, when a frame exceeded it, in the second

## MODIFIED Requirements

### Requirement: Zoom

The map SHALL first show the whole of Switzerland. The buttons "+" and "−" SHALL zoom in and
out by a factor of 2 around the centre of the view, the mouse wheel over the map around the point
under the pointer, and two fingers by the ratio of their distance to that when both touched,
around the point midway between them; always between the whole of Switzerland and 16 times. The button "Ganze Schweiz" SHALL show the whole of Switzerland again.
Borders SHALL keep their width on the screen.

#### Scenario: Zooming in with the button

- **WHEN** a visitor presses "+" once
- **THEN** the map shows the area around the same centre, half as wide and half as high

#### Scenario: The limits of the zoom

- **WHEN** a visitor presses "+" five times, then "Ganze Schweiz", then "−" once
- **THEN** after the presses of "+" the map shows a sixteenth of the width of Switzerland, and
  after "Ganze Schweiz" and "−" it shows the whole of Switzerland

#### Scenario: Zooming with the wheel

- **WHEN** a visitor turns the mouse wheel away from them over Zürich
- **THEN** the map zooms in, and Zürich stays under the pointer within one pixel

#### Scenario: Zooming with two fingers

- **WHEN** a visitor on a touch screen opens `/de/votes/5960/`, puts two fingers on the map 100
  pixels apart with Zürich midway between them, and moves them apart to 200 pixels, keeping
  their midpoint
- **THEN** the map shows an area half as wide and half as high, and Zürich stays midway between
  the fingers within one pixel

#### Scenario: Two fingers at the limits

- **WHEN** a visitor on a touch screen, the map showing the whole of Switzerland, moves two
  fingers on the map from 200 to 100 pixels apart
- **THEN** the map still shows the whole of Switzerland

### Requirement: Moving the map

Dragging the map with a pointer or one finger SHALL move it with the pointer or the finger, and
two fingers SHALL move it with the point midway between them. The centre of the view SHALL stay
inside the smallest rectangle that holds Switzerland. A drag or two fingers SHALL NOT show a
municipality's details by themselves. A finger on the map SHALL neither scroll nor zoom the page;
elsewhere, fingers scroll and zoom the page as the browser does.

#### Scenario: Dragging the map

- **WHEN** a visitor zoomed in four times drags the map 100 pixels to the left
- **THEN** the map shows the area 100 pixels further east

#### Scenario: Dragging past the edge

- **WHEN** a visitor zoomed in twice drags the map far to the right, past the western border
- **THEN** the centre of the view stops at the western edge of the rectangle around
  Switzerland

#### Scenario: Moving with a finger

- **WHEN** a visitor on a touch screen, zoomed in four times on `/de/votes/5960/`, moves one
  finger on the map 100 pixels to the left
- **THEN** the map shows the area 100 pixels further east, the page has not scrolled, and the map
  shows no details

#### Scenario: Two fingers moving together

- **WHEN** a visitor on a touch screen, zoomed in four times, moves two fingers on the map, 100
  pixels apart, 60 pixels to the left together
- **THEN** the map shows the area 60 pixels further east, as wide as before

#### Scenario: A finger beside the map

- **WHEN** a visitor on a phone moves a finger up over the limits, and then over the map
- **THEN** over the limits the page scrolls; over the map the map moves and the page does not
  scroll (checked by hand on a phone: `investigations/small-screens.md`, 4)
