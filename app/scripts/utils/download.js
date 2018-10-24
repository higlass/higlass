export function download(filename, data) {
  // yanked from here
  // https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
  const blob = new Blob([data], { type: 'application/octet-stream' });
  if (window.navigator.msSaveOrOpenBlob) {
    window.navigator.msSaveBlob(blob, filename);
  } else {
    const elem = window.document.createElement('a');
    elem.href = window.URL.createObjectURL(blob);
    elem.download = filename;
    document.body.appendChild(elem);
    elem.click();
    document.body.removeChild(elem);
  }
}

export default download;
