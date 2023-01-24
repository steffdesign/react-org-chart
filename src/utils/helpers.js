module.exports = {
  getTextForTitle,
  getValidText,
  getCursorForNode,
}

function getTextForTitle(datum) {
  if (!datum.person || !datum.person.totalReports) {
    return ''
  }

  const {
    person: { totalReports, label },
  } = datum
  return label ? `${totalReports} ${label}` : totalReports;
}

const departmentAbbrMap = {
  Marketing: 'mktg',
  Operations: 'ops',
  Growth: 'gwth',
  Branding: 'brand',
  Assurance: 'fin',
  Data: 'data',
  Design: 'design',
  Communications: 'comms',
  Product: 'prod',
  People: 'people',
  Sales: 'sales',
}

function getValidText(text) {
  let textTransform = text;
  if (text.length > 33) {
    textTransform = text.substr(0, 33) + "...";
  }
  return textTransform.toUpperCase();
}

function getCursorForNode(datum) {
  return datum.children || datum._children || datum.hasChild
    ? 'pointer'
    : 'default'
}
