/** @type {import('@expo/fingerprint').Config} */
const config = {
  // set an explicit, valid number so the builder never sees "undefined"
  concurrentIoLimit: 4,
  // (optional) you can add ignorePaths or sourceSkips later if needed
};
module.exports = config;