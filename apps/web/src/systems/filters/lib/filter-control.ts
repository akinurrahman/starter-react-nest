// "All" has to be an option a person can pick, but the API never sees it, so
// it travels under a sentinel that the controls map back to undefined.
export const ALL_VALUE = '__all';

// Full width and 40px tall on touch, settling into a row of 36px controls
// from sm up, the same height as every other control.
export const FILTER_CONTROL = 'h-10 w-full sm:h-9 sm:w-auto sm:min-w-40';
