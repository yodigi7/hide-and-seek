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
		isUpEvent,
		isLeftEvent,
		isDownEvent,
		isRightEvent
	} from '$lib/gameHelpers';
	import { EMPTY_COLOR } from '$lib/constants';

	/** @type {number[]} */
	let fastSeekerCoords = [];
	/** @type {number[][]} */
	let fastSeekerTrail = [];
	/** @type {number[]} */
	let intervals = [];
	let win = false;
	/** @type {WebSocket} */
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
			socket.send(JSON.stringify({ move: [] }));
			removeTrail(grid, EMPTY_COLOR);
			resetFastSeeker();
		}
		if (isUpEvent(event)) {
			if (isValidCoords([fastSeekerCoords[0] - 1, fastSeekerCoords[1]])) {
				fastSeekerCoords[0] -= 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (isLeftEvent(event)) {
			if (isValidCoords([fastSeekerCoords[0], fastSeekerCoords[1] - 1])) {
				fastSeekerCoords[1] -= 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (isDownEvent(event)) {
			if (isValidCoords([fastSeekerCoords[0] + 1, fastSeekerCoords[1]])) {
				fastSeekerCoords[0] += 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (isRightEvent(event)) {
			if (isValidCoords([fastSeekerCoords[0], fastSeekerCoords[1] + 1])) {
				fastSeekerCoords[1] += 1;
				fastSeekerTrail.push([...fastSeekerCoords]);
			}
		}
		if (fastSeekerTrail.length === 1) {
			console.log(`Sending: ${JSON.stringify({ move: fastSeekerTrail[0] })}`);
			socket.send(JSON.stringify({ move: fastSeekerTrail[0] }));
		}
		grid = drawTrail(grid, fastSeekerTrail);
	}

	function cleanUp() {
		window.removeEventListener('keydown', handleKeyDown);
		for (const interval of intervals) {
			clearInterval(interval);
		}
		connected = false;
	}

	function connectWebsocket() {
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
				grid = toGrid(msg.grid);
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

{#if win}
	<div class="text-8xl"><strong>YOU WON after {gameSteps} steps</strong></div>
{/if}
<Grid {grid} />
Connected: {connected}
