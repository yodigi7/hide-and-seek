<script>
	import Grid from '../Grid.svelte';

	import {
		newGrid,
		removeTrail,
		drawTrail,
		isValidCoords,
		toGrid,
		getSeekerCoords,
		isGrid,
		isOver,
		isStatus,
		isUpKey,
		isLeftKey,
		isDownKey,
		isRightKey,
	} from '$lib/gameHelpers';
	import { EMPTY_COLOR } from '$lib/constants';

	/** @type {number[]} */
	let fastSeekerCoords = [];
	/** @type {number[][]} */
	let fastSeekerTrail = [];
	/** @type {number[]} */
	let intervals = [];
	let win = false;
	/** @type {WebSocket | undefined | null} */
	let socket;
	/** @type {number | undefined} */
	let gameSteps;
	let connected = false;

	let grid = newGrid(EMPTY_COLOR);

	function resetFastSeeker() {
		fastSeekerTrail = [];
		fastSeekerCoords = getSeekerCoords(grid) ?? [];
		console.log('reset fast seeker');
		console.log(`fast_seeker_trail: ${fastSeekerTrail}`);
		console.log(`fast_seeker_coords: ${fastSeekerCoords}`);
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function handleKeyDown(event) {
		if (event.key === 'Escape') {
      if (!socket) return;
			socket.send(JSON.stringify({ move: [] }));
			removeTrail(grid, EMPTY_COLOR);
			resetFastSeeker();
		}
		if (isUpKey(event.key)) {
			if (isValidCoords([fastSeekerCoords[0] - 1, fastSeekerCoords[1]])) {
				fastSeekerCoords[0] -= 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (isLeftKey(event.key)) {
			if (isValidCoords([fastSeekerCoords[0], fastSeekerCoords[1] - 1])) {
				fastSeekerCoords[1] -= 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (isDownKey(event.key)) {
			if (isValidCoords([fastSeekerCoords[0] + 1, fastSeekerCoords[1]])) {
				fastSeekerCoords[0] += 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (isRightKey(event.key)) {
			if (isValidCoords([fastSeekerCoords[0], fastSeekerCoords[1] + 1])) {
				fastSeekerCoords[1] += 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (fastSeekerTrail.length === 1) {
      if (!socket) return;
			console.log(`Sending: ${JSON.stringify({ move: fastSeekerTrail[0] })}`);
			socket.send(JSON.stringify({ move: fastSeekerTrail[0] }));
		}
		grid = drawTrail(grid, fastSeekerTrail);
	}

	function cleanUp() {
		socket?.close(1000);
		window.removeEventListener('keydown', handleKeyDown);
		for (const interval of intervals) {
			clearInterval(interval);
		}
    socket = null;
		connected = false;
	}

  function setup() {
    win = false;
    fastSeekerCoords = [];
    fastSeekerTrail = [];
    intervals = [];
		window.addEventListener('keydown', handleKeyDown);
		connectWebsocket();
  }

	function connectWebsocket() {
		socket?.close(1000);
		socket = new WebSocket(`ws://${window.location.hostname}:8765`);

		// Event listeners
		socket.addEventListener('open', (_) => {
			console.log('WebSocket connection opened');
			socket.send(JSON.stringify({ role: 'seeker' }));
		});

		socket.addEventListener('message', (event) => {
			/** @type {Object.<string, any>} */
			let msg;
			try {
				msg = JSON.parse(event.data);
			} catch (e) {
				console.log('Probably join message', e);
				return;
			}
			if (isGrid(msg)) {
				grid = toGrid(msg);
				if (fastSeekerTrail.length > 0) {
					fastSeekerTrail.shift();
				}
				if (fastSeekerCoords.length !== 2) {
					resetFastSeeker();
				}
				grid = drawTrail(grid, fastSeekerTrail);
				if (fastSeekerTrail.length > 0) {
					socket.send(JSON.stringify({ move: fastSeekerTrail[0] }));
				}
			} else if (isStatus(msg)) {
				if (!connected && msg.status === 'success') {
					connected = true;
				}
				if (msg.status === 'fail') {
					resetFastSeeker();
				}
			} else if (isOver(msg)) {
				gameSteps = msg.game_steps;
				win = true;
				cleanUp();
			}
		});

		socket.addEventListener('close', (_) => {
			console.log('WebSocket connection closed');
			cleanUp();
		});

		socket.addEventListener('error', (event) => {
			console.error('WebSocket error:', event);
			cleanUp();
		});
	}

	import { onMount } from 'svelte';
	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		connectWebsocket();
		return cleanUp;
	});
</script>

<div class="flex flex-col items-center justify-center">
	{#if win}
		<div class="text-8xl"><strong>YOU WIN after {gameSteps} steps</strong></div>
	{/if}
	{#if !connected}
		<button on:click={setup}>Connect</button>
	{/if}
	<Grid {grid} />
  <a href="/">Home</a>
</div>
