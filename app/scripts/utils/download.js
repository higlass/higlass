export function download(filename, stringOrBlob) {
  // yanked from here
  // https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server

  const blob =
    typeof stringOrBlob === 'string'
      ? new Blob([stringOrBlob], { type: 'application/octet-stream' })
      : stringOrBlob;
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
    URL.revokeObjectURL(elem.href);
  }
}

export default download;
