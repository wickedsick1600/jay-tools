(function () {
  'use strict';

  var retiredPrefix = ['prompt', 'Enhancer'].join('');
  var retiredKeys = [
    retiredPrefix + 'HistoryV2',
    retiredPrefix + 'HistoryEnabledV1',
    retiredPrefix + 'CollectionV1',
  ];

  try {
    for (var index = 0; index < retiredKeys.length; index += 1) {
      localStorage.removeItem(retiredKeys[index]);
    }
  } catch (error) {
    // Storage may be unavailable in private browsing or strict browser modes.
  }
})();
