function resizeFont(text) {
  switch (true) {
    case text.length <= 15:
      return 14;
    case text.length <= 25:
      return 12;
    case text.length >= 50:
      return 8;
    default:
      return 10;
  }
}

module.exports = resizeFont;
