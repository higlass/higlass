/**
 * Download a file to the user's computer.
 * @param {string} filename - Name of the file to download
 * @param {string | Blob} stringOrBlob - Contents of the file to download
 */
export function download(filename, stringOrBlob) {
  // yanked from here
  // https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server

  const blob =
    typeof stringOrBlob === 'string'
      ? new Blob([stringOrBlob], { type: 'application/octet-stream' })
      : stringOrBlob;
  const elem = window.document.createElement('a');
  elem.href = window.URL.createObjectURL(blob);
  elem.download = filename;
  document.body.appendChild(elem);
  elem.click();
  document.body.removeChild(elem);
  URL.revokeObjectURL(elem.href);
}

export default download;
