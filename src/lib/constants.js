export const ROWS = 30;
export const COLS = 30;
export const HIDER_VALUE = 2;
export const SEEKER_VALUE = 3;
export const GAME_STEP_DELAY = 500;
export const HIDER_COLOR = 'red';
export const LAST_SEEN_COLOR = 'darkred';
export const SEEKER_COLOR = 'blue';
export const SEEING_SEEKER = '#00BFFF';
export const FAST_SEEKER_COLOR = 'dodgerblue';
export const FAST_SEEKER_TRAIL_COLOR = 'deepskyblue';
export const VISION_COLOR = 'white';
export const EMPTY_COLOR = 'silver';
export const GAME_STEPS_TO_VISION = 20;
/** @type {{ [key: number]: string }} */
export const NUMBER_TO_MAP = {
    0: VISION_COLOR,
    1: EMPTY_COLOR,
    2: HIDER_COLOR,
    3: SEEKER_COLOR,
};
/** @type {{ [key: number]: string }} */
export const NUMBER_TO_MAP_SEEING = {
    0: VISION_COLOR,
    1: EMPTY_COLOR,
    2: HIDER_COLOR,
    3: SEEING_SEEKER,
};
