function generateConsoleTest(type) {
  return (fn, pattern) => {
    const originalFn = console[type];
    let didLog;

    function mockLog(msg) {
      originalFn.apply(console, arguments);
      if (!new RegExp(pattern).test(msg)) {
        throw new Error(`Expected function to log message with pattern ${pattern}, but message was ${msg}`);
      }
      didLog = true;
    }

    function setUp() {
      console[type] = mockLog;
    }

    function cleanUp() {
      console[type] = originalFn;
    }

    setUp();

    try {
      fn();
      if (!didLog) throw new Error(`Expected function to log but it did not`);
    } catch (e) {
      cleanUp();
      throw e;
    }

    cleanUp();
  };
}

module.exports.shouldConsoleLog = generateConsoleTest('log');
module.exports.shouldConsoleWarn = generateConsoleTest('warn');
module.exports.shouldConsoleError = generateConsoleTest('error');
