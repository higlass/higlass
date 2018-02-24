let isDarkTheme = false;

export const getDarkTheme = () => isDarkTheme;

export const setDarkTheme = (unset = false) => { isDarkTheme = !unset; };
