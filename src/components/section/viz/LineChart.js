import React, { Component } from 'react';
import './LineChart.scss';
import { select,
  scaleLinear, scaleTime,
  extent,
  min,
  axisBottom, axisRight,
  line,
  easeCubic,
  easeCubicOut
 } from 'd3';

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
    let margin = {
      top: 20,
      right: 60,
      bottom: 40,
      left: 0},
      width = window.innerWidth/window.innerHeight > 1.2 ?
        (window.innerWidth > 900 ?
          Math.min(window.innerWidth*0.8 - 320, 1200)
          : Math.min(window.innerWidth*0.8 - 180, 1200))
        : Math.min(window.innerWidth*0.8, 1200),
      height = window.innerWidth/window.innerHeight > 1.2 ?
        Math.min(window.innerHeight*0.8, width, 1000)
        : Math.min(window.innerHeight*0.9 - 250, width, 1000),
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
        .tickPadding(24))
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
        .tickPadding(32))
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
          newText = to !== -1 ? this.vizRef.current.querySelector('.viz-des-text:nth-child(' + (to + 1) + ')') : null
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
                  .attr('stroke-width', strokeWidth)

                // Animate data line
                totalLength = dataLine.node().getTotalLength()
                dataLine.attr("stroke-dasharray", totalLength + " " + totalLength)
                  .attr("stroke-dashoffset", totalLength)
                  .transition()
                    .duration(800)
                    .ease(easeCubic)
                    .attr('stroke-dashoffset', 0)
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
                  )
                grandDaddy.select('.bottom-axis').raise()
                regLineLabel.style('opacity', 0)
                  .transition()
                    .duration(720)
                    .ease(easeCubic)
                    .style('opacity', 1)
                regLineLabel.append('rect')
                  .attr('class', 'reg-line-label-rect linear')
                  .attr('stroke-width', strokeWidth/2)
                  .attr('rx', 4)
                  .attr('ry', 4)
                  .style('width', '4.7em')
                let regLineLabelText = regLineLabel.append('text')
                    .attr('class', 'reg-line-label-text')
                regLineLabelText.append('tspan')
                    .attr('class', 'linear span')
                    .text('y = αx')
                regLineLength = regLine.node().getTotalLength()
                regLine.attr("stroke-dasharray", regLineLength + " " + regLineLength)
                  .attr("stroke-dashoffset", regLineLength)
                  .transition()
                    .duration(800)
                    .ease(easeCubicOut)
                    .attr('stroke-dashoffset', 0)
                grandDaddy.select('.data-line').attr('class', 'data-line faded')
                grandDaddy.selectAll('.reg-line-label-text>tspan:not(.linear)')
                  .each(function(d) {
                    let currentSpan = select(this)
                    if (!currentSpan.node().classList.contains('off')) {
                      currentSpan.node().classList.add('off')
                    }
                  })
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
                grandDaddy.select('.reg-line-label-rect')
                  .attr('class', 'reg-line-label-rect quadratic')
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('width', '7.8em')
                grandDaddy.select('.reg-line-label-text').append('tspan')
                  .attr('class', 'quadratic span')
                  .text(' + βx\u00b2')
                  .style('opacity', 0)
                    .transition()
                      .duration(800)
                      .ease(easeCubic)
                      .style('opacity', 1)
                grandDaddy.selectAll('.reg-line-label-text>tspan:not(.quadratic)')
                  .each(function(d) {
                    let currentSpan = select(this)
                    if (!currentSpan.node().classList.contains('off')) {
                      currentSpan.node().classList.add('off')
                    }
                  })
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
                grandDaddy.select('.reg-line-label-rect')
                  .attr('class', 'reg-line-label-rect cosine')
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('width', '15.8em')
                grandDaddy.select('.reg-line-label-text').append('tspan')
                  .attr('class', 'cosine span')
                  .text(' + cos(2πt + φ)')
                  .style('opacity', 0)
                    .transition()
                      .duration(800)
                      .ease(easeCubic)
                      .style('opacity', 1)
                grandDaddy.selectAll('.reg-line-label-text>tspan:not(.cosine)')
                  .each(function(d) {
                    let currentSpan = select(this)
                    if (!currentSpan.node().classList.contains('off')) {
                      currentSpan.node().classList.add('off')
                    }
                  })
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
                grandDaddy.select('.reg-line-label-text>.quadratic.span').style('opacity', 1)
                  .transition()
                    .duration(320)
                    .ease(easeCubicOut)
                    .style('opacity', 0)
                    .remove()
                grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect linear')
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('width', '4.7em')
                setTimeout(() => {
                  grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect linear')
                })
                grandDaddy.select('.reg-line-label-text>.linear.span').attr('class', 'linear span on')
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
                grandDaddy.select('.reg-line-label-text>.cosine.span').style('opacity', 1)
                  .transition()
                    .duration(320)
                    .ease(easeCubicOut)
                    .style('opacity', 0)
                    .remove()
                grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect quadratic')
                  .transition()
                    .duration(600)
                    .ease(easeCubicOut)
                    .style('width', '7.8em')
                setTimeout(() => {
                  grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect quadratic')
                })
                grandDaddy.select('.reg-line-label-text>.quadratic.span').attr('class', 'quadratic span on')
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
        rootMargin: '-40%',
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
        threshold: 0
      }
    )
    document.querySelectorAll('#line-chart .viz-scroll-anchor').forEach(el => {
      vizScrollObserver.observe(el)
    })
  }
  render() {
    return (
      <div id="line-chart" className="viz-outer-wrap" ref={this.vizRef}>
        <div className="viz-scroll-box">
          <div className="viz-scroll-anchor" data-index="-1"></div>
          {this.props.content.map((_, index) => {
            return (
              <div className="viz-scroll-anchor" data-index={index} key={index}></div>
            )
          })}
          <div className="viz-scroll-dummy-anchor"></div>
        </div>
        <div className="viz-wrap">
          <div className="viz-svg-outer-wrap">
            <div className="viz-svg-wrap"></div>
          </div>
          <div className="viz-des-wrap">
            {this.props.content.map((chunk, index) => {
              return (
                <p className="viz-des-text" key={index}>{chunk.des}</p>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default LineChart;
