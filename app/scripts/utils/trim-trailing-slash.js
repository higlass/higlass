/**
 * Trim trailing slash of an URL.
 * @param   {string}  url  URL to be trimmed.
 * @return  {string}  Trimmed URL.
 */
const trimTrailingSlash = (url) => (url || '').replace(/\/$/, '');

export default trimTrailingSlash;
