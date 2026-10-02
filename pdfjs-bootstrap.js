(function () {
  if (globalThis.pdfjsLibPromise) return;

  globalThis.pdfjsLibPromise = new Promise((resolve, reject) => {
    const deadline = Date.now() + 30000;

    function check() {
      if (globalThis.pdfjsLib) {
        resolve(globalThis.pdfjsLib);
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error('PDF.js did not load in time.'));
        return;
      }
      setTimeout(check, 25);
    }

    check();
  });
})();
