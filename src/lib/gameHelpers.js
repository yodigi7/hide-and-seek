import { ROWS, COLS, SEEKER_VALUE, FAST_SEEKER_COLOR, FAST_SEEKER_TRAIL_COLOR, VISION_COLOR, EMPTY_COLOR, NUMBER_TO_MAP, HIDER_VALUE } from './constants.js';

/**
 * Creates a fresh new board filled with the specified color.
 * @param {string} color - The color to fill the board with.
 * @returns {string[][]} A 2D array (board) filled with the specified color.
 */
export function newGrid(color) {
    return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => color));
}

/**
 * @param {number[]} coords
 * @returns {boolean} whether the input coordinates will fit on the screen
 */
export function isValidCoords(coords) {
    return coords[0] >= 0 && coords[0] < ROWS && coords[1] >= 0 && coords[1] < COLS;
}

/**
 * @param {string[][]} grid
 * @param {number} value the value we are searching for in the grid
 * @returns {number[] | undefined} the coordinates in the grid for the value we are searching for, otherwise return undefined
 */
export function getValueCoords(grid, value) {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] === NUMBER_TO_MAP[value]) {
                return [i, j];
            }
        }
    }
    return undefined;
}

/**
 * @param {string[][]} grid
 * @returns {number[] | undefined} the coordinates in the grid for the seeker, otherwise return undefined
 */
export function getHiderCoords(grid) {
    return getValueCoords(grid, HIDER_VALUE);
}

/**
 * @param {string[][]} grid
 * @returns {number[] | undefined} the coordinates in the grid for the seeker, otherwise return undefined
 */
export function getSeekerCoords(grid) {
    return getValueCoords(grid, SEEKER_VALUE);
}

/**
 * Change color programmatically
 * @param {string[][]} grid
 * @param {number[]} coords
 * @param {string} color
 * @returns {string[][]} returned updated grid
 */
//TODO: remove export
export function updateGrid(grid, coords, color) {
    const grid_color = grid[coords[0]][coords[1]];
    if (grid_color === EMPTY_COLOR || grid_color === VISION_COLOR) {
        grid[coords[0]][coords[1]] = color;
    } else {
        console.log(`Cannot update coords at ${coords}`)
    }
    return grid;
}

/**
 * Converts the number[][] grid from the server to the string[][] grid expected to render
 * @param {number[][]} serverGrid the number[][] grid from the server
 * @returns {string[][]} the converted string[][] grid
 */
export function toGrid(serverGrid) {
    return serverGrid.map(row =>
        row.map(cell => NUMBER_TO_MAP[cell] || 'Unknown')
    );
}

/**
 * @param {Object} msg
 * @returns {boolean} whether the message from the server is a grid update message
 */
export function isGrid(msg) {
    return 'grid' in msg;
}

/**
 * @param {Object} msg
 * @returns {boolean} whether the message from the server is a game over message
 */
export function isOver(msg) {
    return 'game_steps' in msg;
}

/**
 * @param {Object} msg
 * @returns {boolean} whether the message from the server is a status message
 */
export function isStatus(msg) {
    return 'status' in msg;
}

/**
 * @param {string[][]} grid
 * @param {number[][]} trail
 * @returns {string[][]} updated grid with the trail drawn onto it
 */
export function drawTrail(grid, trail) {
    for (const coords of trail) {
        updateGrid(grid, coords, FAST_SEEKER_TRAIL_COLOR);
    }
    return grid;
}

/**
 * @param {string[][]} grid
 * @param {string} replace_color the color to replace the trail with on the grid
 * @returns {string[][]} updated grid without the trail
 */
export function removeTrail(grid, replace_color) {
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] === FAST_SEEKER_COLOR || grid[row][col] === FAST_SEEKER_TRAIL_COLOR) {
                grid[row][col] = replace_color;
            }
        }
    }
    return grid;
}

/**
 * @param {number[]} arr1
 * @param {number[]} arr2
 */
export function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }
    return true;
}


/**
 * @param {KeyboardEvent} event
 */
export function isRightEvent(event) {
    console.log(event);
    return event.key === 'd' || event.key === 'l' || event.key === 'ArrowRight';
}

/**
 * @param {KeyboardEvent} event
 */
export function isLeftEvent(event) {
    console.log(event);
    return event.key === 'a' || event.key === 'h' || event.key === 'ArrowLeft';
}

/**
 * @param {KeyboardEvent} event
 */
export function isDownEvent(event) {
    console.log(event);
    return event.key === 's' || event.key === 'j' || event.key === 'ArrowDown';
}

/**
 * @param {KeyboardEvent} event
 */
export function isUpEvent(event) {
    console.log(event);
    return event.key === 'w' || event.key === 'k' || event.key === 'ArrowUp';
}