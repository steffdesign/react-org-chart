const d3 = require('d3')
const { wrapText, helpers, covertImageToBase64 } = require('../utils')
const renderLines = require('./renderLines')
const exportOrgChartImage = require('./exportOrgChartImage')
const exportOrgChartPdf = require('./exportOrgChartPdf')
const onClick = require('./onClick')
const resizeFont = require('./resizeFont')
const iconLink = require('./components/iconLink')
const supervisorIcon = require('./components/supervisorIcon')
const CHART_NODE_CLASS = 'org-chart-node'
const PERSON_LINK_CLASS = 'org-chart-person-link'
const PERSON_NAME_CLASS = 'org-chart-person-name'
const PERSON_TITLE_CLASS = 'org-chart-person-title'
const PERSON_HIGHLIGHT = 'org-chart-person-highlight'
const PERSON_REPORTS_CLASS = 'org-chart-person-reports'

function render(config) {
  const {
    svgroot,
    svg,
    tree,
    animationDuration,
    nodeWidth,
    nodeHeight,
    nodePaddingX,
    nodePaddingY,
    nodeBorderRadius,
    backgroundColor,
    nameColor,
    titleColor,
    reportsColor,
    borderColor,
    avatarWidth,
    lineDepthY,
    treeData,
    sourceNode,
    onClickNode,
    onPersonLinkClick,
    loadImage,
    downloadImageId,
    downloadPdfId,
    elemWidth,
    margin,
    onConfigChange,
  } = config

  // Compute the new tree layout.
  const nodes = tree.nodes(treeData).reverse()
  const links = tree.links(nodes)

  config.links = links
  config.nodes = nodes

  // Normalize for fixed-depth.
  nodes.forEach(function(d) {
    d.y = d.depth * lineDepthY
  })

  // Update the nodes
  const node = svg.selectAll('g.' + CHART_NODE_CLASS).data(
      nodes.filter(d => d.id),
      d => d.id
  )

  const parentNode = sourceNode || treeData

  svg.selectAll('#supervisorIcon').remove()

  supervisorIcon({
    svg: svg,
    config,
    treeData,
    x: 70,
    y: -24,
  })

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
      .enter()
      .insert('g')
      .attr('class', CHART_NODE_CLASS)
      .attr('transform', `translate(${parentNode.x0}, ${parentNode.y0})`)

  // Person Card Shadow
  nodeEnter
      .append('rect')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('fill', backgroundColor)
      .attr('stroke', borderColor)
      .attr('rx', nodeBorderRadius)
      .attr('ry', nodeBorderRadius)
      .attr('fill-opacity', 0.05)
      .attr('stroke-opacity', 0.025)
      .attr('filter', 'url(#boxShadow)')

  // Person Card Container
  nodeEnter
      .append('rect')
      .attr('class', d => (d.isHighlight ? `${PERSON_HIGHLIGHT} box` : 'box'))
      .attr('width', nodeWidth)
      .attr('height', nodeHeight)
      .attr('id', d => d.id)
      .attr('fill', backgroundColor)
      .attr('stroke', borderColor)
      .attr('rx', nodeBorderRadius)
      .attr('ry', nodeBorderRadius)
      .style('cursor', helpers.getCursorForNode)

  const namePos = {
    x: nodeWidth / 2,
    y: nodePaddingY * 1.8 + avatarWidth,
  }

  const avatarPos = {
    x: nodeWidth / 2 - avatarWidth / 2,
    y: nodePaddingY / 2,
  }

  // Person's Name
  nodeEnter
      .append('text')
      .attr('class', PERSON_NAME_CLASS + ' unedited')
      .attr('x', namePos.x)
      .attr('y', namePos.y)
      .attr('dy', '.3em')
      .style('cursor', 'pointer')
      .style('fill', nameColor)
      .style('font-size', '0.63em')
      .style('font-weight', 700)
      .text(d => helpers.getValidText(d.person.name))
      .on('click', onClick(config, {location: 'card'}))

  // .on('click', onParentClick(config))

  // Person's Title
  nodeEnter
      .append('text')
      .attr('class', PERSON_TITLE_CLASS + ' unedited')
      .attr('x', nodeWidth / 2)
      .attr('y', (namePos.y + nodePaddingY * 1.8))
      .attr('dy', '0.1em')
      .style('font-size', '0.63em')
      .style('fill', titleColor)
      .text(d => d.person.title && helpers.getValidText(d.person.title))

  // Person's Department
  nodeEnter
    .append('text')
    .attr('class', PERSON_TITLE_CLASS + ' unedited')
    .attr('x', nodeWidth / 2)
    .attr('y', (namePos.y + nodePaddingY * 2)+30)
    .attr('dy', '0.1em')
    .style('font-size', '0.63em')
    .style('fill', titleColor)
    .text(d => d.person.department && helpers.getValidText(d.person.department))

  // Person's Country
  nodeEnter
    .append('text')
    .attr('class', PERSON_TITLE_CLASS + ' unedited')
    .attr('x', nodeWidth / 2)
    .attr('y', (namePos.y + nodePaddingY * 2.4)+53)
    .attr('dy', '0.1em')
    .style('font-size', '0.55em')
    .style('font-weight', 700)
    .style('fill', titleColor)
    .text(d => d.person.country && d.person.country.toUpperCase())

  // Person's Reports
  nodeEnter
    .append('text')
    .attr('class', PERSON_REPORTS_CLASS)
    .attr('x', nodeWidth / 2)
    .attr('y', (namePos.y + nodePaddingY * 2.4)+65)
    .attr('dy', '.9em')
    .style('font-size', '0.7em')
    .style('font-weight', 700)
    .style('cursor', 'pointer')
    .style('fill', reportsColor)
    .text(d => {
      const { totalReports, label } = d.person;
      let reportText = "";
      if (totalReports && totalReports > 0) {
        if (label) {
          reportText = `${totalReports} ${label}`;
        } else {
          reportText = totalReports;
        }
      }
      return reportText;
    })
    .on('click', onClick(config))

  // TODO: Add reports background
  // const text = d3.select(".org-chart-person-reports")

  // const rect = d3.select("svg").append("rect")
  //   .attr("x", parseFloat(text.attr("x")) / 2.6)
  //   .attr("y", parseFloat(text.attr("y")) - 3)
  //   .attr('dy', '.9em')
  //   .attr("width", text.node().getBBox().width + 12)
  //   .attr("height", text.node().getBBox().height + 8)
  //   .attr('rx', 10)
  //   .attr('ry', 10)
  //   .style("fill", "#F0F0F7");

  // text.node().parentNode.insertBefore(rect.node(), text.node());


  // Person's Avatar
  nodeEnter
      .append('image')
      .attr('id', d => `image-${d.id}`)
      .attr('width', avatarWidth)
      .attr('height', avatarWidth)
      .attr('x', avatarPos.x)
      .attr('y', avatarPos.y)
      .attr('stroke', borderColor)
      .attr('s', d => {
        d.person.hasImage
            ? d.person.avatar
            : loadImage(d).then(res => {
              covertImageToBase64(res, function(dataUrl) {
                d3.select(`#image-${d.id}`).attr('href', dataUrl)
                d.person.avatar = dataUrl
              })
              d.person.hasImage = true
              return d.person.avatar
            })
      })
      .attr('src', d => d.person.avatar)
      .attr('href', d => d.person.avatar)
      .attr('clip-path', 'url(#avatarClip)')
      .style('cursor', 'pointer')
      .on('click', onClick(config, {location: 'card'}))

  // Person's Link
  const nodeLink = nodeEnter
      .append('a')
      .attr('class', PERSON_LINK_CLASS)
      .attr('display', d => (d.person.link ? '' : 'none'))
      .attr('xlink:href', d => d.person.link)
      .on('click', datum => {
        d3.event.stopPropagation()
        // TODO: fire link click handler
        if (onPersonLinkClick) {
          onPersonLinkClick(datum, d3.event)
        }
      })

  iconLink({
    svg: nodeLink,
    x: nodeWidth - 20,
    y: 8,
  })

  // Transition nodes to their new position.
  const nodeUpdate = node
      .transition()
      .duration(animationDuration)
      .attr('transform', d => `translate(${d.x},${d.y})`)

  nodeUpdate
      .select('rect.box')
      .attr('fill', backgroundColor)
      .attr('stroke', borderColor)

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
      .exit()
      .transition()
      .duration(animationDuration)
      .attr('transform', d => `translate(${parentNode.x},${parentNode.y})`)
      .remove()

  // Update the links
  const link = svg.selectAll('path.link').data(links, d => d.target.id)

  // Wrap the title texts
  const wrapWidth = 124
  svg.selectAll('text.unedited.' + PERSON_NAME_CLASS).call(wrapText, wrapWidth)
  svg.selectAll('text.unedited.' + PERSON_TITLE_CLASS).call(wrapText, wrapWidth)
  svg.selectAll('text.' + PERSON_REPORTS_CLASS).call(wrapText, wrapWidth)

  // Render lines connecting nodes
  renderLines(config)

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x
    d.y0 = d.y
  })

  var nodeLeftX = -70
  var nodeRightX = 70
  var nodeY = 200
  nodes.map(d => {
    nodeLeftX = d.x < nodeLeftX ? d.x : nodeLeftX
    nodeRightX = d.x > nodeRightX ? d.x : nodeRightX
    nodeY = d.y > nodeY ? d.y : nodeY
  })

  config.nodeRightX = nodeRightX
  config.nodeY = nodeY
  config.nodeLeftX = nodeLeftX * -1

  d3.select(downloadImageId).on('click', function() {
    exportOrgChartImage(config)
  })

  d3.select(downloadPdfId).on('click', function() {
    exportOrgChartPdf(config)
  })
  onConfigChange(config)
}
module.exports = render
