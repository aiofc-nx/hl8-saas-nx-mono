// Mock implementation of chalk for testing
const mockChalk = {
  red: (text) => text,
  green: (text) => text,
  yellow: (text) => text,
  blue: (text) => text,
  magenta: (text) => text,
  cyan: (text) => text,
  white: (text) => text,
  gray: (text) => text,
  grey: (text) => text,
  black: (text) => text,
  redBright: (text) => text,
  greenBright: (text) => text,
  yellowBright: (text) => text,
  blueBright: (text) => text,
  magentaBright: (text) => text,
  cyanBright: (text) => text,
  whiteBright: (text) => text,
  grayBright: (text) => text,
  greyBright: (text) => text,
  blackBright: (text) => text,
  bgRed: (text) => text,
  bgGreen: (text) => text,
  bgYellow: (text) => text,
  bgBlue: (text) => text,
  bgMagenta: (text) => text,
  bgCyan: (text) => text,
  bgWhite: (text) => text,
  bgGray: (text) => text,
  bgGrey: (text) => text,
  bgBlack: (text) => text,
  bgRedBright: (text) => text,
  bgGreenBright: (text) => text,
  bgYellowBright: (text) => text,
  bgBlueBright: (text) => text,
  bgMagentaBright: (text) => text,
  bgCyanBright: (text) => text,
  bgWhiteBright: (text) => text,
  bgGrayBright: (text) => text,
  bgGreyBright: (text) => text,
  bgBlackBright: (text) => text,
  bold: (text) => text,
  dim: (text) => text,
  italic: (text) => text,
  underline: (text) => text,
  strikethrough: (text) => text,
  reset: (text) => text,
  inverse: (text) => text,
  hidden: (text) => text,
  visible: (text) => text,
};

// Add chain methods to all properties
Object.keys(mockChalk).forEach((key) => {
  if (typeof mockChalk[key] === 'function') {
    const originalMethod = mockChalk[key];
    mockChalk[key] = function (text) {
      const result = originalMethod(text);
      return result;
    };
  }
});

module.exports = mockChalk;
module.exports.default = mockChalk;
