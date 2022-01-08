//Modified code from: https://github.com/nolanlawson/blob-util/blob/master/dist/blob-util.js

function binaryStringToArrayBuffer(binary) {
  const length = binary.length;
  const buf = new ArrayBuffer(length);
  const arr = new Uint8Array(buf);
  let i = -1;
  while (++i < length) {
    arr[i] = binary.charCodeAt(i);
  }
  return buf;
}

function base64StringToBlob(base64, type) {
  return Promise.resolve().then(function() {
    let parts = [binaryStringToArrayBuffer(atob(base64))];
    return new Blob(parts, { type });
  });
}
