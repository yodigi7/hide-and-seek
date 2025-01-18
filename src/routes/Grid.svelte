<script>
  export let grid;
</script>

<div class="grid">
  {#each grid as row, rowIndex}
    {#each row as color, colIndex}
      <div
        id="square-{rowIndex}-{colIndex}"
        class="square"
        style="background-color: {color};"
      ></div>
    {/each}
  {/each}
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(30, 20px);
    grid-template-rows: repeat(30, 20px);
    width: 630px;
  }

  .square {
    width: 20px;
    height: 20px;
    /* color: red; */
    border: 1px solid black; /* Add black border */
  }
</style>