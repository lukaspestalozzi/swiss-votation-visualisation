<script lang="ts">
  import { applyingTo, countsOf, panelOf } from '../../../../lib/characteristics.ts';
  import type { Texts } from '../../../../lib/texts/index.ts';
  import type { CharacteristicsFile } from '../../../../lib/vote-data.ts';

  // The characteristics of the municipality last pointed at, clicked or tapped (spec result-map):
  // `file` is null while it loads; `name` is the municipality's name as its details write it.
  let {
    t,
    file,
    failed,
    number,
    name,
    voteDate,
  }: {
    t: Texts;
    file: CharacteristicsFile | null;
    failed: boolean;
    number: number | null;
    name: string | null;
    voteDate: string;
  } = $props();

  const applying = $derived(file === null ? null : applyingTo(file, voteDate));
  // What stands between a line's name and its value, as the texts write a line: ": ". The panel
  // writes the two apart, and this between them, for assistive technology only.
  const between = $derived(t.characteristic('', ''));
  const groups = $derived(
    file === null || applying === null || number === null
      ? null
      : panelOf(countsOf(file, applying, number), applying, t),
  );
</script>

<!-- The panel (spec result-map, "The characteristics of a municipality"; design of redesign-site,
     decision 17): its groups in columns, a line a row of its name, a bar where its value is a
     share, and its value. A line's text is "name: value": the colon is read, and not seen. -->
<section class="panel" aria-labelledby="characteristics-heading">
  <div class="head">
    <h3 id="characteristics-heading">{t.PANEL_HEADING}</h3>
    {#if !failed && file !== null && groups !== null && name !== null}
      <p class="name">{name}</p>
    {/if}
  </div>
  {#if failed}
    <p>{t.PANEL_FAILED}</p>
  {:else if file === null}
    <p>{t.PANEL_LOADING}</p>
  {:else if groups === null || name === null}
    <p>{t.PANEL_PROMPT}</p>
  {:else}
    <div class="groups">
      {#each groups as group (group.heading)}
        <div class="group">
          <h4>{group.heading}</h4>
          <ul>
            {#each group.lines as line (line.name)}
              <li>
                <span class="row-name">{line.name}</span><span class="visually-hidden"
                  >{between}</span
                >{#if line.share !== null}<span class="share" aria-hidden="true"
                    ><span style:width="{line.share}%"></span></span
                  >{/if}<span class="row-value">{line.value}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
    <p class="source secondary">{t.CHARACTERISTICS_SOURCES}</p>
  {/if}
</section>

<style>
  /* The heading and, beside it, the municipality, above a line. */
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 1.5rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--hairline);
  }
  h3 {
    margin: 0;
    font-size: 1.375rem;
    line-height: 1.2;
  }
  .name {
    margin: 0;
    font-weight: 700;
  }
  /* The groups in as many columns of at least 15rem as the panel holds. */
  .groups {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 1.75rem 2.5rem;
  }
  h4 {
    margin: 0 0 0.375rem;
    font-size: 1rem;
    line-height: 1.3;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* A line: its name, the bar of a share, 4rem wide, and its value at the right, in a column of
     one width, so that the bars of a group stand one below the other. */
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 4rem 4.75rem;
    gap: 0.75rem;
    align-items: center;
    padding: 0.1875rem 0;
    border-top: 1px solid var(--hairline);
    font-size: 0.9375rem;
  }
  /* A share's bar takes no side's colour (spec site-style, "The colours of a bar"). */
  .share {
    grid-column: 2;
    height: 0.5rem;
    background: var(--track);
  }
  .share span {
    display: block;
    height: 100%;
    background: var(--text);
  }
  .row-value {
    grid-column: 3;
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .source {
    margin: 1.25rem 0 0;
    font-size: 0.8125rem;
  }
</style>
