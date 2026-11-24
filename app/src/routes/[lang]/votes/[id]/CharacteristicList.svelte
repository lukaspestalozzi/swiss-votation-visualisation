<script lang="ts">
  import { nameOf, type Definition, type Group } from '../../../../lib/characteristics.ts';
  import type { Texts } from '../../../../lib/texts/index.ts';

  // The button "Merkmal hinzufügen" and the list it opens (spec limits, "Adding and removing a
  // limit"; design of redesign-site, decision 19): the characteristics that have no limit yet
  // under the panel's headings, and "Schliessen". Choosing one closes the list and hands the
  // characteristic to the section; "Schliessen" and the Escape key close it and choose nothing.
  // The list is the browser's modal dialog: the focus stays inside it and returns to the button,
  // and moving through it with the keyboard chooses nothing.
  let {
    t,
    offered,
    onchoose,
  }: {
    t: Texts;
    // The characteristics without a limit, by their groups; a group with none left is not here.
    offered: readonly { group: Group; definitions: readonly Definition[] }[];
    onchoose: (definition: Definition) => void;
  } = $props();

  let list = $state<HTMLDialogElement | null>(null);

  function choose(definition: Definition): void {
    list?.close();
    onchoose(definition);
  }
</script>

<button
  type="button"
  class="add"
  disabled={offered.length === 0}
  onclick={() => {
    list?.showModal();
  }}>{t.ADD_LIMIT}</button
>
<dialog bind:this={list} aria-labelledby="characteristic-list-heading">
  <div class="head">
    <h3 id="characteristic-list-heading">{t.ADD_LIMIT}</h3>
    <button
      type="button"
      class="close"
      onclick={() => {
        list?.close();
      }}>{t.CLOSE_LIST}</button
    >
  </div>
  <div class="groups">
    {#each offered as { group, definitions } (group)}
      <div class="group">
        <h4>{t.GROUP[group]}</h4>
        <ul>
          {#each definitions as definition (definition.key)}
            <li>
              <button
                type="button"
                onclick={() => {
                  choose(definition);
                }}>{nameOf(definition, t)}</button
              >
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</dialog>

<style>
  .add {
    width: 100%;
    min-height: 2.5rem;
    border-radius: 8px;
    font-weight: 600;
  }
  /* The list in the middle of the window, no wider than it less 16 pixels at each side; what
     does not fit its height scrolls inside it. */
  dialog {
    box-sizing: border-box;
    width: min(46rem, calc(100vw - 2rem));
    max-width: none;
    max-height: calc(100vh - 2rem);
    padding: 1rem 1.25rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--ground);
    color: var(--text);
    box-shadow: 0 12px 32px rgb(0 0 0 / 0.2);
  }
  dialog::backdrop {
    background: rgb(0 0 0 / 0.3);
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  h3 {
    margin: 0;
    font-size: 1.375rem;
    line-height: 1.2;
  }
  /* "Schliessen" is a quiet button: underlined text. */
  .close {
    padding: 0;
    border: 0;
    background: none;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.2em;
  }
  /* The groups in columns of at least 12rem, a group never across two. */
  .groups {
    columns: 3 12rem;
    column-gap: 2rem;
  }
  .group {
    break-inside: avoid;
    padding-bottom: 1rem;
  }
  h4 {
    margin: 0 0 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* A characteristic is a row as wide as its column, with the ground of a row pointed at. */
  li button {
    display: block;
    box-sizing: border-box;
    width: calc(100% + 1rem);
    margin: 0 -0.5rem;
    padding: 0.25rem 0.5rem;
    border: 0;
    border-radius: 6px;
    background: none;
    text-align: left;
  }
  li button:hover {
    background: var(--hover);
  }
  /* On a touch screen every button of the list takes at least 44 × 44 pixels (spec
     small-screens, "Controls for a finger"). */
  @media (pointer: coarse) {
    .add,
    .close,
    li button {
      min-width: 44px;
      min-height: 44px;
    }
  }
</style>
