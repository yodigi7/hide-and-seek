<script>
  const ROWS = 30;
  const COLS = 30;
  const GAME_STEP_DELAY = 500; // 1 second
  const OLD_HIDER_COLOR = '#7c0a02';
  const HIDER_COLOR = 'red';
  const LAST_SEEN_COLOR = 'darkred';
  const SEEKER_COLOR = 'blue'
  const FAST_SEEKER_COLOR = 'dodgerblue';
  const FAST_SEEKER_TRAIL_COLOR = 'deepskyblue';
  const VISION_COLOR = 'white';
  const EMPTY_COLOR = 'silver'
  const GAME_STEPS_TO_VISION = 20;
  let hider_coords = [5, 5];
  let last_seen_coords = hider_coords;
  let seeker_coords = [29, 29];
  let fast_seeker_coords = [29, 29];
  /** @type {number[][]} */
  let fast_seeker_trail = [];
  let showAll = true;
  let currentGameStep = 0;
  /** @type {number[]} */
  let intervals = [];
  let win = false;

  // Initialize the grid with default color for each square (white by default)
  let grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY_COLOR));

  // Function to change color programmatically
  /**
   * @param {number[]} coords
   * @param {string} color
   */
  function updateGrid(coords, color) {
    grid[coords[0]][coords[1]] = color;
  }

  /**
   * @param {number[]} coords
   */
  function isValidCoords(coords) {
    return coords[0] >= 0 && coords[0] < 30 && coords[1] >= 0 && coords[1] < 30;
  }

  /**
   * @param {number[]} coords
   */
  function clearCoords(coords) {
    if (!isValidCoords(coords)) {
        return;
    }
    updateGrid(coords, EMPTY_COLOR);
  }

  function clearBoard() {
    let color = EMPTY_COLOR;
    if (showAll) {
      color = VISION_COLOR;
    }
    for (let i = 0; i < 30; i++) {
      for (let j = 0; j < 30; j++) {
        grid[i][j] = color;
      }
    }
  }

  function resetFastSeeker() {
    fast_seeker_trail = [];
    fast_seeker_coords = seeker_coords;
  }

  function drawSeekerVision() {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const coords = [seeker_coords[0] + dx, seeker_coords[1] + dy];
        if (!isValidCoords(coords)) continue;
        updateGrid(coords, VISION_COLOR);
      }
    }
    for (const el of [-2, 2]) {
      let coords = [seeker_coords[0], seeker_coords[1] + el];
      if (isValidCoords(coords)) {
        updateGrid(coords, VISION_COLOR);
      }
      coords = [seeker_coords[0] + el, seeker_coords[1]];
      if (isValidCoords(coords)) {
        updateGrid(coords, VISION_COLOR);
      }
    }
  }

  function drawTrail() {
    for (const coords of fast_seeker_trail) {
      updateGrid(coords, FAST_SEEKER_TRAIL_COLOR);
    }
  }

  /**
   * Returns whether the seeker can see this coordinate
   * @param {number[]} coords1
   */
  function inVision(coords1) {
    const [x1, y1] = coords1;
    const [x2, y2] = seeker_coords;
    return (Math.abs(x2 - x1) + Math.abs(y2 - y1)) < 3;
  }

  function drawBoard() {
    clearBoard();
    drawSeekerVision();
    drawTrail();
    updateGrid(fast_seeker_coords, FAST_SEEKER_COLOR);
    if (showAll || inVision(hider_coords)) {
      updateGrid(hider_coords, HIDER_COLOR);
      last_seen_coords = hider_coords;
    } else {
      updateGrid(last_seen_coords, LAST_SEEN_COLOR);
    }
    updateGrid(seeker_coords, SEEKER_COLOR);
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      resetFastSeeker();
    }
    if (event.key === 'w' || event.key === 'k') {
      // keyDown = true;
      if (isValidCoords([fast_seeker_coords[0]-1, fast_seeker_coords[1]])) {
        fast_seeker_coords[0] -= 1;
        fast_seeker_trail.push([...fast_seeker_coords])
      }
    }
    if (event.key === 'a' || event.key === 'h') {
      if (isValidCoords([fast_seeker_coords[0], fast_seeker_coords[1]-1])) {
        fast_seeker_coords[1] -= 1;
        fast_seeker_trail.push([...fast_seeker_coords])
      }
    //   keyDown = true;
    }
    if (event.key === 's' || event.key === 'j') {
    //   keyDown = true;
      if (isValidCoords([fast_seeker_coords[0]+1, fast_seeker_coords[1]])) {
        fast_seeker_coords[0] += 1;
        fast_seeker_trail.push([...fast_seeker_coords])
      }
    }
    if (event.key === 'd' || event.key === 'l') {
    //   keyDown = true;
      if (isValidCoords([fast_seeker_coords[0], fast_seeker_coords[1]+1])) {
        fast_seeker_coords[1] += 1;
        fast_seeker_trail.push([...fast_seeker_coords])
      }
    }
    drawBoard();
  }

  function gameStep() {
    let updatedCoords = fast_seeker_trail.shift()
    if (updatedCoords !== undefined) {
      seeker_coords = updatedCoords;
    }
    currentGameStep += 1;
    showAll = false;
    if (currentGameStep % GAME_STEPS_TO_VISION < 2) {
      showAll = true;
    }
    drawBoard();
    if (JSON.stringify(hider_coords) === JSON.stringify(seeker_coords)) {
      cleanUp();
      win = true;
    }
  }

  function cleanUp() {
    window.removeEventListener('keydown', handleKeyDown);
    for (const interval of intervals) {
      clearInterval(interval);
    }
  }

  // Add event listeners for keydown and keyup when the component is mounted
  import { onMount } from 'svelte';
  onMount(() => {
    drawBoard();
    window.addEventListener('keydown', handleKeyDown);
    intervals.push(setInterval(gameStep, GAME_STEP_DELAY));
    intervals.push(setInterval(() => {
      const adder = Math.random() > 0.5 ? -1 : 1;
      const isX = Math.random() > 0.5;
      let new_coords;
      if (isX) {
        new_coords = [hider_coords[0] + adder, hider_coords[1]];
      } else {
        new_coords = [hider_coords[0], hider_coords[1] + adder];
      }
      if (isValidCoords(new_coords)) {
        hider_coords = new_coords;
      }
    }, 1000));
    // Cleanup event listeners when the component is destroyed
    return cleanUp;
  });
</script>

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

{#if win}
  <div class="text-8xl"><strong>YOU WIN</strong></div>
{/if}
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
