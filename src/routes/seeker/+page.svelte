<script>
	import { json } from '@sveltejs/kit';

  const ROWS = 30;
  const COLS = 30;
  const SEEKER_VALUE = 3;
  const GAME_STEP_DELAY = 500; // 1 second
  const HIDER_COLOR = 'red';
  const LAST_SEEN_COLOR = 'darkred';
  const SEEKER_COLOR = 'blue'
  const FAST_SEEKER_COLOR = 'dodgerblue';
  const FAST_SEEKER_TRAIL_COLOR = 'deepskyblue';
  const VISION_COLOR = 'white';
  const EMPTY_COLOR = 'silver'
  const GAME_STEPS_TO_VISION = 20;
  /** @type {{ [key: number]: string }} */
  const NUMBER_TO_MAP = {
    0: VISION_COLOR,
    1: EMPTY_COLOR,
    2: HIDER_COLOR,
    3: SEEKER_COLOR,
  }
  /** @type {number[]} */
  let seeker_coords = [];
  /** @type {number[]} */
  let fast_seeker_coords = [];
  /** @type {number[][]} */
  let fast_seeker_trail = [];
  /** @type {number[]} */
  let intervals = [];
  let win = false;
  /** @type {WebSocket} */
  let socket;

  // Initialize the grid with default color for each square (white by default)
  let grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => EMPTY_COLOR));

  // Function to change color programmatically
  /**
   * @param {number[]} coords
   * @param {string} color
   */
  function updateGrid(coords, color) {
    const grid_color = grid[coords[0]][coords[1]];
    if (grid_color === EMPTY_COLOR || grid_color === VISION_COLOR) {
      grid[coords[0]][coords[1]] = color;
    } else {
      console.log(`Cannot update coords at ${coords}`)
    }
  }

  /**
   * @param {number[]} coords
   */
  function isValidCoords(coords) {
    return coords[0] >= 0 && coords[0] < 30 && coords[1] >= 0 && coords[1] < 30;
  }

  function getSeekerCoords() {
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (grid[i][j] === NUMBER_TO_MAP[SEEKER_VALUE]) {
          return [i, j];
        }
      }
    }
    console.log("Unable to find the seeker coordinates in the grid");
    return [];
  }

  function resetFastSeeker() {
    fast_seeker_trail = [];
    fast_seeker_coords = getSeekerCoords();
    console.log('reset fast seeker');
    console.log(`fast_seeker_trail: ${fast_seeker_trail}`);
    console.log(`fast_seeker_coords: ${fast_seeker_coords}`);
  }

  // TODO: add logic to fix the vision vs empty to replace with
  function removeTrail() {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        if (grid[row][col] === FAST_SEEKER_COLOR || grid[row][col] === FAST_SEEKER_TRAIL_COLOR) {
          grid[row][col] = EMPTY_COLOR;
        }
      }
    }
  }

  function drawTrail() {
    for (const coords of fast_seeker_trail) {
      updateGrid(coords, FAST_SEEKER_TRAIL_COLOR);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      console.log("YOU HIT ESCAPE");
      socket.send(JSON.stringify({move: []}))
      removeTrail();
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
    if (fast_seeker_trail.length === 1) {
      console.log(`Sending: ${JSON.stringify({move: fast_seeker_trail[0]})}`);
      socket.send(JSON.stringify({move: fast_seeker_trail[0]}))
    }
    drawTrail();
  }

  function cleanUp() {
    window.removeEventListener('keydown', handleKeyDown);
    for (const interval of intervals) {
      clearInterval(interval);
    }
  }

  /**
   * TODO: update this type
   * @param {Object.<string, number[][]>} msg
   */
  function toGrid(msg) {
    let serverGrid = msg.grid;
    return serverGrid.map(row =>
      row.map(cell => NUMBER_TO_MAP[cell] || 'Unknown')
    );
  }

  /**
   * @param {Object} msg
   */
  function isGrid(msg) {
    return 'grid' in msg;
  }

  /**
   * @param {Object} msg
   */
  function isOver(msg) {
    return 'game_steps' in msg;
  }

  /**
   * @param {Object} msg
   */
  function isStatus(msg) {
    return 'status' in msg;
  }

  // Add event listeners for keydown and keyup when the component is mounted
  import { onMount } from 'svelte';
  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);

    socket = new WebSocket('ws://localhost:8765'); // Replace with your server address

    // Event listeners
    socket.addEventListener('open', (event) => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({role: "seeker"}));
    });

    socket.addEventListener('message', (event) => {
      // console.log('Message from server:', event.data);
      /** @type {Object} */
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch(e) {
        console.log("Probably join message", e);
        return;
      }
      if (isGrid(msg)){
        grid = toGrid(msg);
        if (fast_seeker_trail.length > 0) {
          fast_seeker_trail.shift();
        }
        if (fast_seeker_coords.length !== 2) {
          console.log("NO FAST SEEKER COORDS");
          resetFastSeeker();
        }
        drawTrail();
        if (fast_seeker_trail.length > 0) {
          socket.send(JSON.stringify({move: fast_seeker_trail[0]}))
        }
      } else if (isStatus(msg)) {
        if (msg.status === 'fail') {
          console.log("FAILED MOVE");
          resetFastSeeker();
        }
      } else if (isOver(msg)) {
        console.log(`Game over in ${msg.game_steps} steps`);
        // msg.game_steps
        win = true;
        cleanUp();
      }
    });

    socket.addEventListener('close', (event) => {
      console.log('WebSocket connection closed');
    });

    socket.addEventListener('error', (event) => {
      console.error('WebSocket error:', event);
    });

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
