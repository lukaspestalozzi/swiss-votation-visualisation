<script lang="ts">
  import { CANTONS, totalCantonalVotes } from 'calculation';
</script>

<svelte:head>
  <title>Popular Vote Explorer</title>
</svelte:head>

<h1>Popular Vote Explorer</h1>

<table>
  <thead>
    <tr>
      <th scope="col">Canton</th>
      <th scope="col">Cantonal votes</th>
    </tr>
  </thead>
  <tbody>
    {#each CANTONS as canton (canton.abbreviation)}
      <tr>
        <td>{canton.abbreviation}</td>
        <td>{canton.cantonalVotes}</td>
      </tr>
    {/each}
  </tbody>
  <tfoot>
    <tr>
      <th scope="row">Total</th>
      <td>{totalCantonalVotes(CANTONS)}</td>
    </tr>
  </tfoot>
</table>
