import React, { Component } from 'react';
import './PolarPlot.scss';
import { select,
  scaleLinear, extent,
  max,
  min,
  lineRadial,
  curveBasis,
  easeCubic,
  easeCubicIn,
  easeCubicOut
 } from 'd3';

class PolarPlot extends Component {
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
    let radius = window.innerWidth/window.innerHeight > 1.2 ?
        (window.innerWidth > 900 ?
          Math.min(window.innerWidth*0.8 - 320, window.innerHeight*0.9)/2
          : Math.min(window.innerWidth*0.9 - 180, window.innerHeight*0.9)/2)
        : Math.min(window.innerWidth*0.9, window.innerHeight*0.8 - 90)/2,
      margin = radius > 280 ? 40 : 20,
      innerRadius = radius - margin,
      grandDaddy = select('#polar-plot'),
      svg = grandDaddy.select('.viz-svg-wrap')
      .append('svg')
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", '0 0 ' + radius*2 + ' ' + radius*2)
        .attr('class', 'viz'),
      a = scaleLinear()
      .domain([0, 365.25])
      .range([0, 2*Math.PI]),
      r = scaleLinear()
      .domain([0, max(data, (d, i) => {return d.level})])
      .range([0, innerRadius])
      .nice(),
      totalLength = null,
      minDate = min(data, function(d) {return d.date}),
      xDays = data.map(d => (d.date.getTime() - minDate.getTime())/(1000*60*60*24)),
      xDaysParsed = xDays.map(d => Math.floor(d % 365.25)),
      defs = svg.append('defs'),
      gradient = defs.append('linearGradient')
        .attr('id', 'polar-grad')
        .attr('x1', '30%')
        .attr('x2', '70%')
        .attr('y1', '70%')
        .attr('y2', '30%'),
      // polarToCartesian & describeArc from wdebeaum, @stackoverflow: https://stackoverflow.com/a/5737245
      polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
        let angleInRadians = (angleInDegrees-90) * Math.PI / 180.0
        return {
          x: centerX + (radius * Math.cos(angleInRadians)),
          y: centerY + (radius * Math.sin(angleInRadians))
        }
      },
      describeArc = function(x, y, radius, startAngle, endAngle){
        let start = polarToCartesian(x, y, radius, endAngle)
        let end = polarToCartesian(x, y, radius, startAngle)
        let largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
        let d = [
            'L', start.x, start.y,
            'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
            'Z'
        ].join(' ')
        return d
      },
      strokeWidth = radius/200

      grandDaddy.select('.viz-divider').attr('class', 'viz-divider on')

      defs.append('clipPath')
        .attr('id', 'winter-polar-clip')
        .append('rect')
          .attr('x', 0)
          .attr('y', -1)
          .attr('width', '100%')
          .attr('height', '101%')
          .attr('transform', 'rotate(-180)')
      defs.append('clipPath')
        .attr('id', 'summer-polar-clip')
        .append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('transform', 'rotate(0)')

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('style', 'stop-color: var(--warm); stop-opacity: 1')
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('style', 'stop-color: var(--cool); stop-opacity: 1')

      let rAxis = svg.append('g')
        .attr('class', 'r axis')
        .attr('transform', 'translate(' + radius + ' ' + radius + ')'),
      aAxis = svg.append('g')
        .attr('class', 'a axis')
        .attr('transform', 'translate(' + radius + ' ' + radius + ')')

      rAxis.selectAll('circle')
        .data([...r.ticks(5), 320, 340, 360, 380])
        .enter()
        .append('circle')
          .attr('class', (d) => {return 'grid-circle' + ((d > 300 && d < 400) ? ' secondary' : '')})
          .attr('stroke-width', strokeWidth/2)
          .attr('transform', 'rotate(-90)')
          .attr('r', r)
          .attr("stroke-dasharray", (d) => {return 2*Math.PI*r(d) + " " + 2*Math.PI*r(d)})
            .attr("stroke-dashoffset", (d) => {return 2*Math.PI*r(d)})
            .transition()
              .duration(800)
              .ease(easeCubic)
              .attr('stroke-dashoffset', 0)
      rAxis.append('circle')
        .attr('class', 'grid-circle')
        .attr('stroke-width', strokeWidth/2)
        .attr('transform', 'rotate(-90)')
        .attr('r', innerRadius)
        .attr("stroke-dasharray", 2*Math.PI*innerRadius + " " + 2*Math.PI*innerRadius)
          .attr("stroke-dashoffset", 2*Math.PI*innerRadius)
          .transition()
            .duration(800)
            .ease(easeCubic)
            .attr('stroke-dashoffset', 0)

      rAxis.selectAll('g')
        .data([...r.ticks(5).slice(1), 320, 340, 360, 380])
        .enter()
        .append('text')
        .attr('class', (d) => {return 'r tick' + ((d > 300 && d < 400) ? ' secondary' : '')})
        .attr('transform', function(d) {return 'translate(' + r(d)*Math.cos(-Math.PI/12) + ' ' + r(d)*Math.sin(-Math.PI/12) + ')'})
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .text(function (d) {return d})

      aAxis.selectAll('line')
        .data(Array(6))
        .enter()
        .append('line')
          .attr('class', 'grid-line')
          .attr('stroke-width', strokeWidth/2)
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', -innerRadius)
          .attr('y2', innerRadius)
          .attr('transform', function(_, i) {return 'rotate(' + (30*i) + ')'})
          .attr("stroke-dasharray", 2*innerRadius + " " + 2*innerRadius)
            .attr("stroke-dashoffset", 2*innerRadius)
            .transition()
              .duration(800)
              .ease(easeCubic)
              .attr('stroke-dashoffset', (_, i) => {
                if (i%2 === 0) {
                  return 0
                } else {
                  return 4*innerRadius
                }
              })

      aAxis.selectAll('text')
        .data(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        .enter()
        .append('text')
          .attr('class', 'a tick')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('dx', function(_, i) {return (innerRadius + (radius > 280 ? 24 : 16))*Math.cos((i/6 - 1/2)*Math.PI)})
          .attr('dy', function(_, i) {return (innerRadius + (radius > 280 ? 24 : 16))*Math.sin((i/6 - 1/2)*Math.PI)})
          .text(function (d) {return d})

    this.setState({
      vizCreated: true,
      updateFunc: (to, from) => {
        let newText = to !== -1 ? this.vizRef.current.querySelector('.viz-des-text:nth-child(' + (to + 1) + ')') : null
        if (to > from) {
          if (newText) {
            newText.classList.add('on')
          }
          let increment = (target) => {
            switch(target) {
              case 0: // One
                // Main data line
                svg.append('path').attr('class', 'data-line')
                  .datum(data.slice(0, 37))
                  .attr('transform', 'translate(' + radius + ' ' + radius + ')')
                  .attr('stroke', 'url(#polar-grad)')
                  .attr('stroke-width', strokeWidth)
                  .attr('d', lineRadial()
                    .angle(function(_, index) { return a(xDaysParsed[index]) })
                    .radius(function(d) { return r(d.level) })
                    .curve(curveBasis)
                  )
                totalLength = grandDaddy.select('.data-line').node().getTotalLength()
                grandDaddy.select('.data-line').attr("stroke-dasharray", totalLength + " " + totalLength)
                  .attr("stroke-dashoffset", totalLength)
                  .transition()
                    .duration(800)
                    .ease(easeCubic)
                    .attr('stroke-dashoffset', 0)
                break
              case 1: // All
                r.domain(extent(data, data => {return data.level})).nice()
                // Remove unneeded circles and ticks
                grandDaddy.selectAll('.grid-circle').filter((_, i) => {return i < 4})
                  .attr('class', 'grid-circle off')
                  .transition()
                    .duration(1200)
                    .ease(easeCubicIn)
                    .attr('r', 0)
                grandDaddy.selectAll('.r.tick').filter((_, i) => {return i < 3})
                  .attr('class', 'r tick off')
                  .transition()
                    .duration(1200)
                    .ease(easeCubicIn)
                    .attr('transform', 'translate(0 0)')
                // Move 400 circle and tick
                grandDaddy.selectAll('.grid-circle:nth-child(5)').transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('r', r)
                grandDaddy.selectAll('.r.tick:nth-child(4)')
                  .transition()
                    .duration(800)
                    .ease(easeCubicIn)
                    .attr('transform', function(d) {return 'translate(' + r(d)*Math.cos(-Math.PI/12) + ' ' + r(d)*Math.sin(-Math.PI/12) + ')'})
                // Add new circles and ticks
                grandDaddy.selectAll('.grid-circle.secondary').attr('class', 'grid-circle secondary on').transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('r', r)
                grandDaddy.selectAll('.r.tick.secondary').attr('class', 'r tick secondary on').transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('transform', function(d) {return 'translate(' + r(d)*Math.cos(-Math.PI/12) + ' ' + r(d)*Math.sin(-Math.PI/12) + ')'})

                grandDaddy.select('.data-line')
                .transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('d', lineRadial()
                    .angle(function(_, index) { return a(xDaysParsed[index]) })
                    .radius(function(d) { return r(d.level) })
                    .curve(curveBasis))
                    .on("end", () => {
                      let dataLine = grandDaddy.select('.data-line')
                      .datum(data)
                      .attr('d', lineRadial()
                        .angle(function(_, index) { return a(xDaysParsed[index]) })
                        .radius(function(d) { return r(d.level) })
                        .curve(curveBasis)),
                      newTotalLength = dataLine.node().getTotalLength()
                      dataLine.attr("stroke-dasharray", newTotalLength + " " + newTotalLength)
                        .attr("stroke-dashoffset", newTotalLength)
                        .transition()
                          .duration(800)
                          .ease(easeCubicOut)
                          .attr('stroke-dashoffset', 0)
                    })
                break
              case 2: // Stretches
                svg.append('path')
                  .attr('class', 'winter stretch')
                  .attr('clip-path', 'url(#winter-polar-clip)')
                  .datum(data.slice(3112, 3126))
                  .attr('transform', 'translate(' + radius + ' ' + radius + ')')
                  .attr('stroke-width', strokeWidth/2)
                  .attr('d', (data) => {
                    let line = lineRadial()
                    .angle(function(_, index) { return a(xDaysParsed[index+3112]) })
                    .radius(function(d) { return r(d.level) })
                    .curve(curveBasis)
                    , shell = describeArc(0, 0, innerRadius, 0, 90)
                    return line(data) + shell}
                  )
                svg.append('path')
                  .attr('class', 'summer stretch')
                  .attr('clip-path', 'url(#summer-polar-clip)')
                  .datum(data.slice(3086, 3100))
                  .attr('transform', 'translate(' + radius + ' ' + radius + ')')
                  .attr('stroke-width', strokeWidth/2)
                  .attr('d', (data) => {
                    let line = lineRadial()
                    .angle(function(_, index) { return a(xDaysParsed[index+3086]) })
                    .radius(function(d) { return r(d.level) })
                    .curve(curveBasis)
                    , shell = describeArc(0, 0, innerRadius, 180, 270)
                    return line(data) + shell}
                  )

                  grandDaddy.select('#winter-polar-clip rect').transition()
                    .duration(800)
                    .ease(easeCubic)
                    .attr('transform', 'rotate(-90)')
                  grandDaddy.select('#summer-polar-clip rect').transition()
                    .duration(800)
                    .ease(easeCubic)
                    .attr('transform', 'rotate(90)')
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
              case -1: // Init
                let dataLine = grandDaddy.select('.data-line')
                totalLength = dataLine.node().getTotalLength()

                dataLine.attr("stroke-dasharray", totalLength + " " + totalLength)
                  .attr("stroke-dashoffset", 0)
                  .transition()
                    .duration(800)
                    .ease(easeCubic)
                    .attr('stroke-dashoffset', totalLength)
                    .remove()
                break
              case 0: // One
                r.domain([0, max(data, (d, i) => {return d.level})]).nice()
                // Remove unneeded circles and ticks
                grandDaddy.selectAll('.grid-circle').filter((_, i) => {return i < 4})
                  .attr('class', 'grid-circle')
                  .transition()
                    .duration(800)
                    .ease(easeCubicIn)
                    .attr('r', r)
                grandDaddy.selectAll('.r.tick').filter((_, i) => {return i < 3})
                  .attr('class', 'r tick')
                  .transition()
                    .duration(800)
                    .ease(easeCubicIn)
                    .attr('transform', function(d) {return 'translate(' + r(d)*Math.cos(-Math.PI/12) + ' ' + r(d)*Math.sin(-Math.PI/12) + ')'})
                // Move 400 circle and tick
                grandDaddy.selectAll('.grid-circle:nth-child(5)').transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('r', r)
                grandDaddy.selectAll('.r.tick:nth-child(4)')
                  .transition()
                    .duration(800)
                    .ease(easeCubicIn)
                    .attr('transform', function(d) {return 'translate(' + r(d)*Math.cos(-Math.PI/12) + ' ' + r(d)*Math.sin(-Math.PI/12) + ')'})
                // Add new circles and ticks
                grandDaddy.selectAll('.grid-circle.secondary').attr('class', 'grid-circle secondary').transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('r', r)
                grandDaddy.selectAll('.r.tick.secondary').attr('class', 'r tick secondary').transition()
                  .duration(800)
                  .ease(easeCubicIn)
                  .attr('transform', function(d) {return 'translate(' + r(d)*Math.cos(-Math.PI/12) + ' ' + r(d)*Math.sin(-Math.PI/12) + ')'})

                grandDaddy.select('.data-line')
                .datum(data.slice(0, 37))
                .transition()
                  .duration(400)
                  .ease(easeCubicIn)
                  .style('opacity', 0)
                  .on('end', () => {
                    let dataLine = grandDaddy.select('.data-line')
                    .datum(data.slice(0, 37))
                    .style('opacity', 1)
                    .attr('d', lineRadial()
                      .angle(function(_, index) { return a(xDaysParsed[index]) })
                      .radius(function(d) { return r(d.level) })
                      .curve(curveBasis)),
                    newTotalLength = dataLine.node().getTotalLength()

                    dataLine.attr("stroke-dasharray", newTotalLength + " " + newTotalLength)
                      .attr("stroke-dashoffset", newTotalLength)
                      .transition()
                        .duration(800)
                        .ease(easeCubic)
                        .attr('stroke-dashoffset', 0)
                  })
                break
              case 1: // All
                grandDaddy.select('#winter-polar-clip rect').transition()
                  .duration(800)
                  .ease(easeCubic)
                  .attr('transform', 'rotate(-180)')
                grandDaddy.select('#summer-polar-clip rect').transition()
                  .duration(800)
                  .ease(easeCubic)
                  .attr('transform', 'rotate(0)')

                grandDaddy.select('.summer.stretch').transition()
                  .delay(800)
                  .remove()
                grandDaddy.select('.winter.stretch').transition()
                  .delay(800)
                  .remove()
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
                select('#polar-plot .viz').remove()
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
                      select('#polar-plot .viz').remove()
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
    document.querySelectorAll('#polar-plot .viz-scroll-anchor').forEach(el => {
      vizScrollObserver.observe(el)
    })
  }
  render() {
    return (
      <div id="polar-plot" className="viz-outer-wrap" ref={this.vizRef}>
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
          <div className="viz-des-wrap">
            {this.props.content.map((chunk, index) => {
              return (
                <p className="viz-des-text" key={index}>{chunk.des}</p>
              )
            })}
          </div>
          <div className="viz-svg-outer-wrap">
            <div className="viz-svg-wrap"></div>
          </div>
        </div>
      </div>
    )
  }
}

export default PolarPlot;
