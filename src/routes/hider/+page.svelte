<script>
	import Grid from '../Grid.svelte';
	import { VISION_COLOR } from '$lib/constants';
	import {
		newGrid,
		arraysAreEqual,
		drawTrail,
		getHiderCoords,
		isGrid,
		isOver,
		isStatus,
		isValidCoords,
		removeTrail,
		toGrid,
		isUpKey,
		isDownKey,
		isRightKey,
		isLeftKey
	} from '$lib/gameHelpers';
	/** @type {number[]} */
	/** @type {number[]} */
	let fastHiderCoords = [];
	/** @type {number[][]} */
	let fastHiderTrail = [];
	/** @type {number[]} */
	let intervals = [];
	let win = false;
	/** @type {WebSocket | undefined | null} */
	let socket;
	/** @type {number | undefined} */
	let gameSteps;
	let connected = false;

	let grid = newGrid(VISION_COLOR);

	function resetFastHider() {
		fastHiderTrail = [];
		fastHiderCoords = getHiderCoords(grid) ?? [];
		console.log('reset fast seeker');
		console.log(`fast_seeker_trail: ${fastHiderTrail}`);
		console.log(`fast_seeker_coords: ${fastHiderCoords}`);
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	function handleKeyDown(event) {
		if (event.key === 'Escape') {
			if (!socket) return;
			socket.send(JSON.stringify({ move: [] }));
			grid = removeTrail(grid, VISION_COLOR);
			resetFastHider();
		} else if (isUpKey(event.key)) {
			if (isValidCoords([fastHiderCoords[0] - 1, fastHiderCoords[1]])) {
				fastHiderCoords[0] -= 1;
				fastHiderTrail.push([...fastHiderCoords]);
			}
		} else if (isLeftKey(event.key)) {
			if (isValidCoords([fastHiderCoords[0], fastHiderCoords[1] - 1])) {
				fastHiderCoords[1] -= 1;
				fastHiderTrail.push([...fastHiderCoords]);
			}
		} else if (isDownKey(event.key)) {
			if (isValidCoords([fastHiderCoords[0] + 1, fastHiderCoords[1]])) {
				fastHiderCoords[0] += 1;
				fastHiderTrail.push([...fastHiderCoords]);
			}
		} else if (isRightKey(event.key)) {
			if (isValidCoords([fastHiderCoords[0], fastHiderCoords[1] + 1])) {
				fastHiderCoords[1] += 1;
				fastHiderTrail.push([...fastHiderCoords]);
			}
		}
		if (fastHiderTrail.length === 1) {
			if (!socket) return;
			console.log(`Sending: ${JSON.stringify({ move: fastHiderTrail[0] })}`);
			socket.send(JSON.stringify({ move: fastHiderTrail[0] }));
		}
		grid = drawTrail(grid, fastHiderTrail);
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
    fastHiderCoords = [];
    fastHiderTrail = [];
    intervals = [];
		window.addEventListener('keydown', handleKeyDown);
		connectWebsocket();
  }

	function connectWebsocket() {
		socket?.close(1000);
		socket = new WebSocket(`ws://${window.location.hostname}:8765`); // Replace with your server address

		// Event listeners
		socket.addEventListener('open', (_) => {
			console.log('WebSocket connection opened');
			socket.send(JSON.stringify({ role: 'hider' }));
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
				if (
					fastHiderTrail.length > 0 &&
					arraysAreEqual(getHiderCoords(grid) ?? [], fastHiderTrail[0])
				) {
					fastHiderTrail.shift();
				}
				if (fastHiderCoords.length !== 2) {
					resetFastHider();
				}
				grid = drawTrail(grid, fastHiderTrail);
				if (fastHiderTrail.length > 0) {
					socket.send(JSON.stringify({ move: fastHiderTrail[0] }));
				}
			} else if (isStatus(msg)) {
				if (!connected && msg.status === 'success') {
					connected = true;
				}
				if (msg.status === 'fail') {
					resetFastHider();
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
    setup();
		return cleanUp;
	});
</script>

<div class="flex flex-col items-center justify-center">
	{#if win}
		<div class="text-8xl"><strong>YOU LOST after {gameSteps} steps</strong></div>
	{/if}
	{#if !connected}
		<button on:click={setup}>Connect</button>
	{/if}
	<Grid {grid} />
  <a href="/">Home</a>
</div>