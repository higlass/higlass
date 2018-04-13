let isDarkTheme = false;

/**
 * Determine if the dark theme is activated
 * @return  {boolean}  If `true` the dark theme is activated
 */
export const getDarkTheme = () => isDarkTheme;

/**
 * Activate or deactivate the dark them
 * @param   {boolean}  unset  If `true` deactivate the dark theme.
 */
export const setDarkTheme = (unset = false) => { isDarkTheme = !unset; };
