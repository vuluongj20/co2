import React, { Component } from 'react';
import './LineChart.scss';
import { select,
  scaleLinear, scaleTime,
  extent,
  min,
  axisBottom, axisRight,
  line,
  mouse,
  easeCubic,
  easeCubicOut,
  interpolate,
 } from 'd3';

const mse = [
  18.2,
  5.06,
  0.97
];

class LineChart extends Component {
  constructor(props) {
    super(props)
    this.state = {
      vizCreated: false,
      currentState: -1,
      updateFunc: null
    }
    this.createViz = this.createViz.bind(this)
    this.vizRef = React.createRef()
  }
  createViz(data) {
    let width = window.innerWidth*0.85,
      height = Math.min(window.innerHeight*0.85, window.innerWidth*1.2),
      margin = {
        top: 20,
        right: width > 700 ? 60 : 36,
        bottom: width > 700 ? 40 : 24,
        left: 0},
      innerWidth = width - margin.left - margin.right,
      innerHeight = height - margin.top - margin.bottom,
      grandDaddy = select('#line-chart'),
      svg = grandDaddy.select('.viz-svg-wrap')
      .append('svg')
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", '0 0 ' + width + ' ' + height)
        .attr('class', 'viz'),
      x = scaleTime()
      .domain(extent(data, (d, i) => {return d.date}))
      .range([0, innerWidth])
      .nice(),
      y = scaleLinear()
      .domain(extent(data, (d, i) => {return d.level}))
      .range([innerHeight, 0])
      .nice(),
      totalLength = null,
      minDate = min(data, function(d) {return d.date}),
      xDays = data.map(d => Math.ceil((d.date.getTime() - minDate.getTime())/(1000*60*60*24))),
      strokeWidth = height/400

    grandDaddy.select('.viz-divider').attr('class', 'viz-divider on')

    // Grid lines
    svg.append('g')
      .attr('class', 'y grid')
      .attr('transform', 'translate(' + margin.left + ', ' + height + ')')
      .call(axisBottom(x)
          .ticks(5)
          .tickSize(-height)
          .tickFormat('')
      )
    grandDaddy.selectAll('.y.grid>.tick').each(function(d, i) {
      select(this).attr("stroke-dasharray", height + " " + height)
        .attr("stroke-dashoffset", height)
        .attr('stroke-width', strokeWidth/2)
        .transition()
          .duration(800)
          .ease(easeCubicOut)
          .attr('stroke-dashoffset', function() {
            if (i%2 === 0) {
              return 0
            } else {
              return 2*height
            }
          })
    })
    svg.append('g')
      .attr('class', 'x grid')
      .attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')')
      .call(axisRight(y)
          .ticks(5)
          .tickSize(width)
          .tickFormat('')
      )
    grandDaddy.selectAll('.x.grid>.tick').each(function(d, i) {
      select(this).attr("stroke-dasharray", width + " " + width)
        .attr("stroke-dashoffset", width)
        .attr('stroke-width', strokeWidth/2)
        .transition()
          .duration(800)
          .ease(easeCubicOut)
          .attr('stroke-dashoffset', function() {
            if (i%2 === 0) {
              return 0
            } else {
              return 2*width
            }
          })
    })

    // Axes
    svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + margin.left + ', ' + (innerHeight + margin.top) + ')')
      .style("opacity", 0)
      .transition()
        .duration(800)
        .ease(easeCubic)
        .style('opacity', 1)
      .call(axisBottom(x)
        .ticks(5)
        .tickSize(0)
        .tickPadding(width > 700 ? 24 : 12))
    svg.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + (innerWidth + margin.left) + ', ' + margin.top + ')')
      .style("opacity", 0)
      .transition()
        .duration(800)
        .ease(easeCubic)
        .style('opacity', 1)
      .call(axisRight(y)
        .ticks(5)
        .tickSize(0)
        .tickPadding(width > 700 ? 32 : 16))
    svg.append('line')
      .attr('class', 'bottom-axis')
      .attr("x1", 0)
      .attr("y1", height - margin.bottom)
      .attr("x2", width)
      .attr("y2", height - margin.bottom)
      .style("opacity", 0)
      .attr('stroke-width', strokeWidth)
      .transition()
        .duration(800)
        .ease(easeCubicOut)
        .style('opacity', 1)

    this.setState({
      vizCreated: true,
      updateFunc: (to, from) => {
        let regLineLength = null,
          yReg = null,
          newText = to !== -1 ? this.vizRef.current.querySelector('.viz-des-text:nth-child(' + (to + 1) + ')') : null,
          hoverDataFunction,
          hoverRegFunction,
          hoverOn = false,
          lastMouseCoor
        if (to > from) {
          if (newText) {
            newText.classList.add('on')
          }
          let increment = (target) => {
            switch(target) {
              case 0: // Initial
                // Main data line
                let dataLine = svg.append('path')
                  .datum(data)
                  .attr('class', 'data-line')
                  .attr('d', line()
                    .x(function(d) { return x(d.date) + margin.left })
                    .y(function(d) { return y(d.level) + margin.top })
                  )
                  .attr('stroke-width', strokeWidth),
                  // Mouse hover line
                  hoverLine = svg.insert('path', '.data-line')
                    .attr('class', 'hover-line')
                    .attr('stroke-width', strokeWidth)
                    .style('opacity', 0)
                    .attr('d', function() {
                      return 'M' + 0 + ',' + 0 + ' ' + 0 + ',' + height
                    }),
                  // Mouse hover dot
                  hoverDataCircle = svg.append('circle')
                    .attr('class', 'hover-data-circle')
                    .attr('r', strokeWidth*2)
                    .attr('transform', 'translate(-5 -5)'),
                  hoverGroup = svg.append('g')
                    .attr('class', 'hover-text-group')
                    .attr('transform', 'translate(' + (margin.left + 24) + ' ' + (margin.top + 24) + ')')
                    .style('opacity', 0),
                  hoverRect = hoverGroup.append('rect')
                    .attr('class', 'hover-rect')
                    .attr('rx', '8')
                    .attr('ry', '8'),
                  hoverDataLabel = hoverGroup.append('text')
                    .attr('class', 'hover-data-label')
                    .text('Record:'),
                  hoverDataText = hoverGroup.append('text')
                    .attr('class', 'hover-data-text')

                // Animate data line
                totalLength = dataLine.node().getTotalLength()
                dataLine.attr("stroke-dasharray", totalLength + " " + totalLength)
                  .attr("stroke-dashoffset", totalLength)
                  .transition()
                    .duration(800)
                    .ease(easeCubic)
                    .attr('stroke-dashoffset', 0)

                hoverDataFunction = function() {
                  let coor = ((mouse(this)[0] >= 0 && mouse(this)[1] >= 0) || !lastMouseCoor) ? mouse(this) : lastMouseCoor,
                    hoverDate = x.invert(coor[0] - margin.left),
                    closestDatumIndex = data.findIndex(el => el.date >= hoverDate),
                    hoverY = closestDatumIndex > 0 ? y(data[closestDatumIndex].level) + margin.top : -10

                  lastMouseCoor = coor

                  this.coor = coor
                  this.closestDatumIndex = closestDatumIndex
                  this.dataHoverY = hoverY

                  hoverLine.attr('transform', 'translate(' + coor[0] + ' ' + 0 + ')')
                  hoverDataCircle.attr('transform', 'translate(' + coor[0] + ' ' + hoverY + ')')
                  hoverGroup.select('.hover-data-text').text(closestDatumIndex > 0 ?
                    data[closestDatumIndex].level.toFixed(2) + ' ppm'
                    : closestDatumIndex === 0 ?
                      data[0].level.toFixed(2) + ' ppm'
                      : data[data.length - 1].level.toFixed(2) + ' ppm')

                  if (closestDatumIndex >= 0) {
                    hoverGroup.attr('transform',
                      'translate('
                      + coor[0]
                      + ' '
                      + y(314.574751 + 0.00210065413*xDays[closestDatumIndex] + 0.0000000973625567*xDays[closestDatumIndex]**2)
                      + ')')
                  }

                  if (closestDatumIndex <= 0 && hoverOn) {
                    hoverOn = false
                    hoverGroup.transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 0)
                    hoverLine.transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 0)
                  } else if (closestDatumIndex > 0 && !hoverOn) {
                    hoverOn = true
                    hoverGroup.transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 1)
                    hoverLine.transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 0.4)
                    hoverDataCircle.transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 1)
                    grandDaddy.select('.hover-reg-circle').transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 1)
                    grandDaddy.select('.hover-diff-line').transition()
                      .duration(200)
                      .ease(easeCubic)
                      .style('opacity', 1)
                  }
                }

                svg.on('mouseleave', () => {
                    if (hoverOn) {
                      hoverOn = false
                      hoverGroup.transition()
                        .duration(200)
                        .ease(easeCubic)
                        .style('opacity', 0)
                      hoverLine.transition()
                        .duration(200)
                        .ease(easeCubic)
                        .style('opacity', 0)
                      hoverDataCircle.transition()
                        .duration(200)
                        .ease(easeCubic)
                        .style('opacity', 0)
                      select('.hover-reg-circle').transition()
                        .duration(200)
                        .ease(easeCubic)
                        .style('opacity', 0)
                      select('.hover-diff-line').transition()
                        .duration(200)
                        .ease(easeCubic)
                        .style('opacity', 0)
                    }
                  })
                  .on('mousemove', hoverDataFunction)
                break
              case 1: // Linear
                yReg = xDays.map(d => this.props.content[1].params[0] + this.props.content[1].params[1]*d)
                let regLine = svg.append('path')
                  .datum(data)
                  .attr('class', 'reg-line')
                  .attr('d', line()
                    .x(function(d) { return x(d.date) + margin.left })
                    .y(function(d, i) {return y(yReg[i]) + margin.top })
                  )
                  .attr('stroke-width', strokeWidth),
                regLineLabel = svg.append('g')
                  .attr('class', 'reg-line-label')
                  .attr('transform',
                    'translate('
                    + (width > 540 ?
                      (x(data[Math.ceil(data.length*0.52)]['date']) + margin.left + 64)
                      : (x(data[Math.ceil(data.length*0.36)]['date']) + margin.left + 20))
                    + ', '
                    + (width > 540 ?
                      (y(yReg[Math.ceil(yReg.length*0.52)]) + margin.top + 20)
                      : (y(yReg[Math.ceil(yReg.length*0.36)]) + margin.top + 20))
                    + ')'
                  ),
                  hoverRegCircle = svg.append('circle')
                    .attr('class', 'hover-reg-circle')
                    .attr('r', strokeWidth*2)
                    .attr('transform', 'translate(-5 -5)'),
                  hoverDiffLine = svg.insert('path', '.hover-data-circle')
                    .attr('class', 'hover-diff-line')
                    .attr('stroke-width', strokeWidth)
                    .style('opacity', 0),
                  hoverGroupSelection = grandDaddy.select('.hover-text-group'),
                  hoverRegLabel = hoverGroupSelection.append('text')
                    .attr('class', 'hover-reg-label')
                    .text('Regression:'),
                  hoverRegText = hoverGroupSelection.append('text')
                    .attr('class', 'hover-reg-text'),
                  hoverDiffLabel = hoverGroupSelection.append('text')
                    .attr('class', 'hover-diff-label')
                    .text('Squared error:'),
                  hoverDiffText = hoverGroupSelection.append('text')
                    .attr('class', 'hover-diff-text'),
                  mseGroup = svg.append('g')
                    .attr('class', 'mse-group')
                    .attr('transform',
                      'translate('
                      + (width > 768 ?
                        (innerWidth + margin.left - 300)
                        : (innerWidth + margin.left - 240))
                      + ', '
                      + (width > 768 ?
                        (innerHeight + margin.top - 100)
                        : (innerHeight + margin.top - 86))
                      + ')'
                    )

                hoverRegLabel.style('opacity', 0)
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('opacity', 1)
                hoverRegText.style('opacity', 0)
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('opacity', 1)
                hoverDiffLabel.style('opacity', 0)
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('opacity', 1)
                hoverDiffText.style('opacity', 0)
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('opacity', 1)

                hoverGroupSelection.attr('class', 'hover-text-group big')
                hoverGroupSelection.select('.hover-data-label')
                  .attr('class', 'hover-data-label big')
                  .clone(true)
                  .style('opacity', 0)
                    .transition()
                      .duration(600)
                      .ease(easeCubicOut)
                      .style('opacity', 1)
                hoverGroupSelection.select('.hover-data-label').remove()
                hoverGroupSelection.select('.hover-data-text')
                  .attr('class', 'hover-data-text big')
                  .clone(true)
                  .style('opacity', 0)
                    .transition()
                      .duration(600)
                      .ease(easeCubicOut)
                      .style('opacity', 1)
                hoverGroupSelection.select('.hover-data-text').remove()

                grandDaddy.select('.bottom-axis').raise()
                regLineLength = regLine.node().getTotalLength()
                regLine.attr("stroke-dasharray", regLineLength + " " + regLineLength)
                  .attr("stroke-dashoffset", regLineLength)
                  .transition()
                    .duration(800)
                    .ease(easeCubicOut)
                    .attr('stroke-dashoffset', 0)
                grandDaddy.select('.data-line').attr('class', 'data-line faded')
                grandDaddy.selectAll('.mse-equation>tspan:not(.linear)')
                  .each(function(d) {
                    let currentSpan = select(this)
                    if (!currentSpan.node().classList.contains('off')) {
                      currentSpan.node().classList.add('off')
                    }
                  })

                mseGroup.style('opacity', 0)
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('opacity', 1)

                mseGroup.append('rect')
                  .attr('class', 'mse-rect linear')
                  .attr('stroke-width', strokeWidth/2)
                  .attr('rx', '8')
                  .attr('ry', '8')

                mseGroup.append('text')
                  .attr('class', 'mse-title')
                  .text('Linear regression')

                mseGroup.append('text')
                    .attr('class', 'mse-equation-label')
                    .text('Form:')

                let regLineLabelText = mseGroup.append('text')
                    .attr('class', 'mse-equation')
                regLineLabelText.append('tspan')
                    .attr('class', 'linear span')
                    .text('y = αx')

                mseGroup.append('text')
                  .attr('class', 'mse-acc-label')
                  .text('MSE:')

                mseGroup.append('text')
                  .attr('class', 'mse-acc-text')
                  .text(0)
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .tween('text', function() {
                      let i = interpolate(0, mse[0])
                      return function(t) {
                        select(this).text(i(t).toFixed(2))
                      }
                    })

                hoverRegFunction = function() {
                  let hoverY = this.closestDatumIndex > 0 ? y(yReg[this.closestDatumIndex]) + margin.top : -10,
                    squaredError = this.closestDatumIndex > 0 ?
                      (data[this.closestDatumIndex].level - yReg[this.closestDatumIndex])**2
                      : this.closestDatumIndex === 0 ?
                        (data[0].level - yReg[0])**2
                        : (data[data.length - 1].level - yReg[yReg.length - 1])**2

                  hoverRegCircle.attr('transform', 'translate(' + this.coor[0] + ' ' + hoverY + ')')
                  hoverRegText.text(this.closestDatumIndex > 0 ?
                    yReg[this.closestDatumIndex].toFixed(2) + ' ppm'
                    : this.closestDatumIndex === 0 ?
                      yReg[0].toFixed(2) + ' ppm'
                      : yReg[yReg.length - 1].toFixed(2) + ' ppm')

                  hoverDiffLine.attr('d', 'M' + this.coor[0] + ',' + hoverY + ' ' + this.coor[0] + ',' + this.dataHoverY)
                  hoverDiffText.text(squaredError.toFixed(2))
                }
                grandDaddy.select('.hover-data-circle').node().classList.add('out')
                grandDaddy.select('.hover-data-text').node().classList.add('out')
                svg.node().addEventListener('mousemove', hoverRegFunction)
                svg.node().dispatchEvent(new MouseEvent('mousemove'))
                break
              case 2: // Quadratic
                yReg = xDays.map(d => this.props.content[2].params[0] + this.props.content[2].params[1]*d + this.props.content[2].params[2]*d**2)
                grandDaddy.select('.reg-line').transition()
                  .duration(800)
                  .ease(easeCubicOut)
                  .attr('d', line()
                    .x(function(d) { return x(d.date) + margin.left })
                    .y(function(d, i) {return y(yReg[i]) + margin.top })
                  )
                regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
                grandDaddy.select('.reg-line').attr("stroke-dasharray", 0)
                  .attr('stroke-dashoffset', 0)

                grandDaddy.select('.mse-title').text('Quadratic regression')
                grandDaddy.select('.mse-rect')
                  .attr('class', 'mse-rect quadratic')
                grandDaddy.select('.mse-equation').append('tspan')
                  .attr('class', 'quadratic span')
                  .text(' + βx\u00b2')
                  .style('opacity', 0)
                    .transition()
                      .duration(800)
                      .ease(easeCubic)
                      .style('opacity', 1)
                grandDaddy.selectAll('.mse-equation>tspan:not(.quadratic)')
                  .each(function(d) {
                    let currentSpan = select(this)
                    if (!currentSpan.node().classList.contains('off')) {
                      currentSpan.node().classList.add('off')
                    }
                  })

                grandDaddy.select('.mse-acc-text').transition()
                  .duration(600)
                  .ease(easeCubicOut)
                  .tween('text', function() {
                    let i = interpolate(mse[0], mse[1])
                    return function(t) {
                      select(this).text(i(t).toFixed(2))
                    }
                  })

                svg.node().removeEventListener('mousemove', hoverRegFunction)
                hoverRegFunction = function() {
                  let hoverY = this.closestDatumIndex > 0 ? y(yReg[this.closestDatumIndex]) + margin.top : -10,
                    squaredError = this.closestDatumIndex > 0 ?
                      (data[this.closestDatumIndex].level - yReg[this.closestDatumIndex])**2
                      : this.closestDatumIndex === 0 ?
                        (data[0].level - yReg[0])**2
                        : (data[data.length - 1].level - yReg[yReg.length - 1])**2,
                    hoverRegCircle = grandDaddy.select('.hover-reg-circle'),
                    hoverRegText = grandDaddy.select('.hover-reg-text'),
                    hoverDiffLine = grandDaddy.select('.hover-diff-line'),
                    hoverDiffText = grandDaddy.select('.hover-diff-text')

                  hoverRegCircle.attr('transform', 'translate(' + this.coor[0] + ' ' + hoverY + ')')
                  hoverRegText.text(this.closestDatumIndex > 0 ?
                    yReg[this.closestDatumIndex].toFixed(2) + ' ppm'
                    : this.closestDatumIndex === 0 ?
                      yReg[0].toFixed(2) + ' ppm'
                      : yReg[yReg.length - 1].toFixed(2) + ' ppm')

                  hoverDiffLine.attr('d', 'M' + this.coor[0] + ',' + hoverY + ' ' + this.coor[0] + ',' + this.dataHoverY)
                  hoverDiffText.text(squaredError.toFixed(2))
                }
                svg.node().addEventListener('mousemove', hoverRegFunction)
                svg.node().dispatchEvent(new MouseEvent('mousemove'))
                break
              case 3: // Cosine
                yReg = xDays.map(d => this.props.content[3].params[0]
                  + this.props.content[3].params[1]*d
                  + this.props.content[3].params[2]*d**2
                  + this.props.content[3].params[3]*Math.cos(2*Math.PI*d/365.25 + this.props.content[3].params[4])
                )
                grandDaddy.select('.reg-line').attr("stroke-dasharray", regLineLength + " " + regLineLength)
                  .transition()
                    .duration(800)
                    .ease(easeCubicOut)
                    .attr('d', line()
                      .x(function(d) { return x(d.date) + margin.left })
                      .y(function(d, i) {return y(yReg[i]) + margin.top })
                  )
                regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
                grandDaddy.select('.reg-line').attr("stroke-dasharray", 0)
                  .attr('stroke-dashoffset', 0)

                grandDaddy.select('.mse-title').text('Quadratic regression with cosine term')
                grandDaddy.select('.mse-rect')
                  .attr('class', 'mse-rect cosine')
                grandDaddy.select('.mse-equation').append('tspan')
                  .attr('class', 'cosine span')
                  .text(' + cos(2πt + φ)')
                  .style('opacity', 0)
                    .transition()
                      .duration(800)
                      .ease(easeCubic)
                      .style('opacity', 1)
                grandDaddy.selectAll('.mse-equation>tspan:not(.cosine)')
                  .each(function(d) {
                    let currentSpan = select(this)
                    if (!currentSpan.node().classList.contains('off')) {
                      currentSpan.node().classList.add('off')
                    }
                  })

                grandDaddy.select('.mse-acc-text').transition()
                  .duration(600)
                  .ease(easeCubicOut)
                  .tween('text', function() {
                    let i = interpolate(mse[1], mse[2])
                    return function(t) {
                      select(this).text(i(t).toFixed(2))
                    }
                  })

                svg.node().removeEventListener('mousemove', hoverRegFunction)
                hoverRegFunction = function() {
                  let hoverY = this.closestDatumIndex > 0 ? y(yReg[this.closestDatumIndex]) + margin.top : -10,
                    squaredError = this.closestDatumIndex > 0 ?
                      (data[this.closestDatumIndex].level - yReg[this.closestDatumIndex])**2
                      : this.closestDatumIndex === 0 ?
                        (data[0].level - yReg[0])**2
                        : (data[data.length - 1].level - yReg[yReg.length - 1])**2,
                    hoverRegCircle = grandDaddy.select('.hover-reg-circle'),
                    hoverRegText = grandDaddy.select('.hover-reg-text'),
                    hoverDiffLine = grandDaddy.select('.hover-diff-line'),
                    hoverDiffText = grandDaddy.select('.hover-diff-text')

                  hoverRegCircle.attr('transform', 'translate(' + this.coor[0] + ' ' + hoverY + ')')
                  hoverRegText.text(this.closestDatumIndex > 0 ?
                    yReg[this.closestDatumIndex].toFixed(2) + ' ppm'
                    : this.closestDatumIndex === 0 ?
                      yReg[0].toFixed(2) + ' ppm'
                      : yReg[yReg.length - 1].toFixed(2) + ' ppm')

                  hoverDiffLine.attr('d', 'M' + this.coor[0] + ',' + hoverY + ' ' + this.coor[0] + ',' + this.dataHoverY)
                  hoverDiffText.text(squaredError.toFixed(2))
                }
                svg.node().addEventListener('mousemove', hoverRegFunction)
                svg.node().dispatchEvent(new MouseEvent('mousemove'))
                break
              default:
            }
          }
          for (let i = from; i < to; i++) {
            let prevText = this.vizRef.current.querySelector('.viz-des-text:nth-child(' + (i + 1) + ')')
            increment(i + 1)
            if (prevText) {
              prevText.classList.remove('on')
              prevText.classList.remove('on-reverse')
            }
          }
        } else if (to < from) {
          if (newText) {
            newText.classList.add('on-reverse')
          }
          let decrement = (target) => {
            switch(target) {
              case -1:
                let dataLineLength = grandDaddy.select('.data-line').node().getTotalLength()
                grandDaddy.select('.data-line').attr('stroke-dashoffset', 0)
                  .transition()
                    .duration(800)
                    .ease(easeCubicOut)
                    .attr('stroke-dashoffset', -dataLineLength)
                    .remove()

                grandDaddy.select('.hover-line').remove()
                grandDaddy.select('.hover-data-circle').remove()
                grandDaddy.select('.hover-text-group').remove()
                svg.node().removeEventListener('mousemove', hoverRegFunction)
                break
              case 0: // Initial
                regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
                grandDaddy.select('.reg-line').attr('stroke-dashoffset', 0)
                  .transition()
                    .duration(800)
                    .ease(easeCubicOut)
                    .attr('stroke-dashoffset', -regLineLength)
                    .remove()
                grandDaddy.select('.data-line').attr('class', 'data-line')
                grandDaddy.select('.reg-line-label').style('opacity', 1)
                  .transition()
                    .duration(800)
                    .ease(easeCubicOut)
                    .style('opacity', 0)
                    .remove()

                grandDaddy.select('.hover-text-group').attr('class', 'hover-text-group')
                grandDaddy.select('.hover-text-group').select('.hover-data-label')
                  .attr('class', 'hover-data-label')
                  .clone(true)
                  .style('opacity', 0)
                    .transition()
                      .duration(600)
                      .ease(easeCubicOut)
                      .style('opacity', 1)
                grandDaddy.select('.hover-text-group').select('.hover-data-label').remove()
                grandDaddy.select('.hover-text-group').select('.hover-data-text')
                  .attr('class', 'hover-data-text')
                  .clone(true)
                  .style('opacity', 0)
                    .transition()
                      .duration(600)
                      .ease(easeCubicOut)
                      .style('opacity', 1)
                grandDaddy.select('.hover-text-group').select('.hover-data-text').remove()

                grandDaddy.select('.mse-group').transition()
                  .duration(600)
                  .ease(easeCubicOut)
                  .style('opacity', 0)
                  .remove()

                grandDaddy.select('.hover-data-circle').node().classList.remove('out')
                grandDaddy.select('.hover-data-text').node().classList.remove('out')
                grandDaddy.select('.hover-reg-circle').remove()
                grandDaddy.select('.hover-reg-label').remove()
                grandDaddy.select('.hover-reg-text').remove()
                grandDaddy.select('.hover-diff-line').remove()
                grandDaddy.select('.hover-diff-label').remove()
                grandDaddy.select('.hover-diff-text').remove()
                svg.node().removeEventListener('mousemove', hoverRegFunction)
                break
              case 1: // Linear
                yReg = xDays.map(d => this.props.content[1].params[0] + this.props.content[1].params[1]*d)
                grandDaddy.select('.reg-line').transition()
                  .duration(800)
                  .ease(easeCubicOut)
                  .attr('d', line()
                    .x(function(d) { return x(d.date) + margin.left })
                    .y(function(d, i) {return y(yReg[i]) + margin.top })
                )
                regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
                grandDaddy.select('.reg-line').attr("stroke-dasharray", regLineLength + " " + regLineLength)

                grandDaddy.select('.mse-title').text('Linear regression')
                grandDaddy.select('.mse-equation>.quadratic.span').style('opacity', 1)
                  .transition()
                    .duration(320)
                    .ease(easeCubicOut)
                    .style('opacity', 0)
                    .remove()
                grandDaddy.select('.mse-rect').attr('class', 'mse-rect linear')

                setTimeout(() => {
                  grandDaddy.select('.mse-rect').attr('class', 'mse-rect linear')
                })
                grandDaddy.select('.mse-equation>.linear.span').attr('class', 'linear span on')

                grandDaddy.select('.mse-acc-text').transition()
                  .duration(600)
                  .ease(easeCubicOut)
                  .tween('text', function() {
                    let i = interpolate(mse[1], mse[0])
                    return function(t) {
                      select(this).text(i(t).toFixed(2))
                    }
                  })

                svg.node().removeEventListener('mousemove', hoverRegFunction)
                hoverRegFunction = function() {
                  let hoverY = this.closestDatumIndex > 0 ? y(yReg[this.closestDatumIndex]) + margin.top : -10,
                    squaredError = this.closestDatumIndex > 0 ?
                      (data[this.closestDatumIndex].level - yReg[this.closestDatumIndex])**2
                      : this.closestDatumIndex === 0 ?
                        (data[0].level - yReg[0])**2
                        : (data[data.length - 1].level - yReg[yReg.length - 1])**2,
                    hoverRegCircle = grandDaddy.select('.hover-reg-circle'),
                    hoverRegText = grandDaddy.select('.hover-reg-text'),
                    hoverDiffLine = grandDaddy.select('.hover-diff-line'),
                    hoverDiffText = grandDaddy.select('.hover-diff-text')

                  hoverRegCircle.attr('transform', 'translate(' + this.coor[0] + ' ' + hoverY + ')')
                  hoverRegText.text(this.closestDatumIndex > 0 ?
                    yReg[this.closestDatumIndex].toFixed(2) + ' ppm'
                    : this.closestDatumIndex === 0 ?
                      yReg[0].toFixed(2) + ' ppm'
                      : yReg[yReg.length - 1].toFixed(2) + ' ppm')

                  hoverDiffLine.attr('d', 'M' + this.coor[0] + ',' + hoverY + ' ' + this.coor[0] + ',' + this.dataHoverY)
                  hoverDiffText.text(squaredError.toFixed(2))
                }
                svg.node().addEventListener('mousemove', hoverRegFunction)
                svg.node().dispatchEvent(new MouseEvent('mousemove'))
                break
              case 2: // Quadratic
                yReg = xDays.map(d => this.props.content[2].params[0]
                  + this.props.content[2].params[1]*d
                  + this.props.content[2].params[2]*d**2)
                grandDaddy.select('.reg-line').transition()
                  .duration(800)
                  .ease(easeCubicOut)
                  .attr('d', line()
                    .x(function(d) { return x(d.date) + margin.left })
                    .y(function(d, i) {return y(yReg[i]) + margin.top })
                )
                regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
                grandDaddy.select('.reg-line').attr("stroke-dasharray", regLineLength + " " + regLineLength)

                grandDaddy.select('.mse-title').text('Quadratic regression')
                grandDaddy.select('.mse-equation>.cosine.span').style('opacity', 1)
                  .transition()
                    .duration(320)
                    .ease(easeCubicOut)
                    .style('opacity', 0)
                    .remove()
                grandDaddy.select('.mse-rect').attr('class', 'mse-rect quadratic')

                setTimeout(() => {
                  grandDaddy.select('.mse-rect').attr('class', 'mse-rect quadratic')
                })
                grandDaddy.select('.mse-equation>.quadratic.span').attr('class', 'quadratic span on')

                grandDaddy.select('.mse-acc-text').transition()
                  .duration(600)
                  .ease(easeCubicOut)
                  .tween('text', function() {
                    let i = interpolate(mse[2], mse[1])
                    return function(t) {
                      select(this).text(i(t).toFixed(2))
                    }
                  })

                svg.node().removeEventListener('mousemove', hoverRegFunction)
                hoverRegFunction = function() {
                  let hoverY = this.closestDatumIndex > 0 ? y(yReg[this.closestDatumIndex]) + margin.top : -10,
                    squaredError = this.closestDatumIndex > 0 ?
                      (data[this.closestDatumIndex].level - yReg[this.closestDatumIndex])**2
                      : this.closestDatumIndex === 0 ?
                        (data[0].level - yReg[0])**2
                        : (data[data.length - 1].level - yReg[yReg.length - 1])**2,
                    hoverRegCircle = grandDaddy.select('.hover-reg-circle'),
                    hoverRegText = grandDaddy.select('.hover-reg-text'),
                    hoverDiffLine = grandDaddy.select('.hover-diff-line'),
                    hoverDiffText = grandDaddy.select('.hover-diff-text')

                  hoverRegCircle.attr('transform', 'translate(' + this.coor[0] + ' ' + hoverY + ')')
                  hoverRegText.text(this.closestDatumIndex > 0 ?
                    yReg[this.closestDatumIndex].toFixed(2) + ' ppm'
                    : this.closestDatumIndex === 0 ?
                      yReg[0].toFixed(2) + ' ppm'
                      : yReg[yReg.length - 1].toFixed(2) + ' ppm')

                  hoverDiffLine.attr('d', 'M' + this.coor[0] + ',' + hoverY + ' ' + this.coor[0] + ',' + this.dataHoverY)
                  hoverDiffText.text(squaredError.toFixed(2))
                }
                svg.node().addEventListener('mousemove', hoverRegFunction)
                svg.node().dispatchEvent(new MouseEvent('mousemove'))
                break
              default:
            }
          }
          for (let i = from; i > to; i--) {
            let prevText = this.vizRef.current.querySelector('.viz-des-text:nth-child(' + (i + 1) + ')')
            decrement(i - 1)
            if (prevText) {
              prevText.classList.remove('on')
              prevText.classList.remove('on-reverse')
            }
          }
        }
        this.setState({
          currentState: to
        })
      }
    })
  }
  componentDidMount() {
    let vizObserver = new IntersectionObserver(
      (entries, observer) => {
        if (entries[0].isIntersecting && !this.state.vizCreated) {
          this.setState({
            vizCreated: true
          }, () => {
            this.createViz(this.props.data)
            let resizeTimer
            window.addEventListener('resize', () => {
              clearTimeout(resizeTimer)
              resizeTimer = setTimeout(() => {
                select('#line-chart .viz').remove()
                this.createViz(this.props.data)
                this.state.updateFunc(this.state.currentState, -1)
              }, 400)
            })
          })
        }
      },
      {
        rootMargin: '-50%',
        threshold: 0
      })
    vizObserver.observe(this.vizRef.current)

    let vizScrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let index = Number(entry.target.dataset.index)
            if (index > -1) {
              if (!this.state.vizCreated) {
                this.setState({
                  vizCreated: true
                }, () => {
                  this.createViz(this.props.data)
                  let resizeTimer
                  window.addEventListener('resize', () => {
                    clearTimeout(resizeTimer)
                    resizeTimer = setTimeout(() => {
                      select('#line-chart .viz').remove()
                      this.createViz(this.props.data)
                      this.state.updateFunc(this.state.currentState, -1)
                    }, 400)
                  })
                })
              }
              this.state.updateFunc(index, this.state.currentState)
            } else if (this.state.vizCreated) {
              this.state.updateFunc(index, this.state.currentState)
            }
          }
        })
      },
      {
        rootMargin: '-10% 0%',
        threshold: 0
      }
    )
    document.querySelectorAll('#line-chart .viz-des-text').forEach(el => {
      vizScrollObserver.observe(el)
    })
  }
  render() {
    return (
      <div id="line-chart" className="viz-outer-wrap" ref={this.vizRef}>
        <div className="viz-wrap">
          <div className="viz-svg-outer-wrap">
            <div className="viz-svg-wrap"></div>
          </div>
        </div>
        <div className="viz-scroll-box">
          <div className="viz-des-text dummy" data-index="-1"></div>
          <div className="viz-scroll-anchor-top"></div>
          <div className="viz-des-wrap">
            {this.props.content.map((chunk, index) => {
              return (
                <p className="viz-des-text" data-index={index} key={index}>{chunk.des}</p>
              )
            })}
          </div>
          <div className="viz-scroll-anchor-bottom"></div>
        </div>
      </div>
    )
  }
}

export default LineChart;
