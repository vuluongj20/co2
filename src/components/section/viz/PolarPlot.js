import React, { Component } from 'react';
import './PolarPlot.scss';
import { select,
  scaleLinear, extent,
  max,
  min,
  lineRadial,
  curveBasis,
  easeQuad,
  easeQuadOut,
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
    let margin = 80,
      radius = Math.min(window.innerWidth - 440, window.innerHeight - 200)/2,
      innerRadius = radius - margin,
      grandDaddy = select('#polar-plot'),
      svg = grandDaddy.select('.viz-svg-wrap')
      .append('svg')
        .attr('width', radius*2)
        .attr('height', radius*2)
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
      gradient = svg.append('defs').append('linearGradient')
        .attr('id', 'polar-grad')
        .attr('x1', '0%')
        .attr('x2', '100%')
        .attr('y1', '50%')
        .attr('y2', '50%')

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
          .attr('r', r)
      rAxis.append('circle')
        .attr('class', 'grid-circle')
        .attr('r', innerRadius)

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
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', -innerRadius)
          .attr('y2', innerRadius)
          .attr('transform', function(_, i) {return 'rotate(' + (30*i) + ')'})

      aAxis.selectAll('text')
        .data(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
        .enter()
        .append('text')
          .attr('class', 'a tick')
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')
          .attr('dx', function(_, i) {return (innerRadius + 24)*Math.cos((i/6 - 1/2)*Math.PI)})
          .attr('dy', function(_, i) {return (innerRadius + 24)*Math.sin((i/6 - 1/2)*Math.PI)})
          .text(function (d) {return d})

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
                svg.append('path').attr('class', 'data-line')
                  .datum(data.slice(0, 37))
                  .attr('transform', 'translate(' + radius + ' ' + radius + ')')
                  .attr('stroke', 'url(#polar-grad)')
                  .attr('stroke-width', 1)
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
              case 1: // Linear
                r.domain(extent(data, data => {return data.level}))
                // Remove unneeded circles and ticks
                grandDaddy.selectAll('.grid-circle').filter((_, i) => {return i < 4})
                  .attr('class', 'grid-circle off')
                  .transition()
                    .duration(800)
                    .ease(easeCubicIn)
                    .attr('r', 0)
                grandDaddy.selectAll('.r.tick').filter((_, i) => {return i < 3})
                  .attr('class', 'r tick off')
                  .transition()
                    .duration(800)
                    .ease(easeCubicIn)
                    .attr('transform', 0)
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
                          .duration(1200)
                          .ease(easeCubicOut)
                          .attr('stroke-dashoffset', 0)
                    })
                // let regLine = svg.append('path')
                //   .datum(data)
                //   .attr('class', 'reg-line')
                //   .attr('d', line()
                //     .x(function(d) { return x(d.date) + margin.left })
                //     .y(function(d, i) {return y(yReg[i]) + margin.top })
                // ),
                // regLineLabel = svg.append('g')
                //   .attr('class', 'reg-line-label')
                //   .attr('transform',
                //     'translate('
                //     + (x(data[Math.ceil(data.length*0.52)]['date']) + margin.left + 60)
                //     + ', '
                //     + (y(yReg[Math.ceil(yReg.length*0.52)]) + margin.top + 20)
                //     + ')'
                //   )
                // grandDaddy.select('.bottom-axis').raise()
                // regLineLabel.style('opacity', 0)
                //   .transition()
                //     .duration(720)
                //     .ease(easeQuad)
                //     .style('opacity', 1)
                // regLineLabel.append('rect')
                //   .attr('class', 'reg-line-label-rect linear')
                //   .attr('rx', 4)
                //   .attr('ry', 4)
                //   .style('width', '4.6em')
                // let regLineLabelText = regLineLabel.append('text')
                //     .attr('class', 'reg-line-label-text')
                // regLineLabelText.append('tspan')
                //     .attr('class', 'linear span')
                //     .text('y = αx')
                // regLineLength = regLine.node().getTotalLength()
                // regLine.attr("stroke-dasharray", regLineLength + " " + regLineLength)
                //   .attr("stroke-dashoffset", regLineLength)
                //   .transition()
                //     .duration(800)
                //     .ease(easeCubicOut)
                //     .attr('stroke-dashoffset', 0)
                // grandDaddy.select('.data-line').attr('class', 'data-line faded')
                // grandDaddy.selectAll('.reg-line-label-text>tspan:not(.linear)')
                //   .each(function(d) {
                //     let currentSpan = select(this)
                //     if (!currentSpan.node().classList.contains('off')) {
                //       currentSpan.node().classList.add('off')
                //     }
                //   })
                break
              // case 2: // Quadratic
              //   yReg = xDays.map(d => this.props.content[2].params[0] + this.props.content[2].params[1]*d + this.props.content[2].params[2]*d**2)
              //   grandDaddy.select('.reg-line').transition()
              //     .duration(800)
              //     .ease(easeCubicOut)
              //     .attr('d', line()
              //       .x(function(d) { return x(d.date) + margin.left })
              //       .y(function(d, i) {return y(yReg[i]) + margin.top })
              //     )
              //   regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
              //   grandDaddy.select('.reg-line').attr("stroke-dasharray", 0)
              //     .attr('stroke-dashoffset', 0)
              //   grandDaddy.select('.reg-line-label-rect')
              //     .attr('class', 'reg-line-label-rect quadratic')
              //     .transition()
              //       .duration(600)
              //       .ease(easeCubicOut)
              //       .style('width', '7.7em')
              //   grandDaddy.select('.reg-line-label-text').append('tspan')
              //     .attr('class', 'quadratic span')
              //     .text(' + βx\u00b2')
              //     .style('opacity', 0)
              //       .transition()
              //         .duration(800)
              //         .ease(easeQuad)
              //         .style('opacity', 1)
              //   grandDaddy.selectAll('.reg-line-label-text>tspan:not(.quadratic)')
              //     .each(function(d) {
              //       let currentSpan = select(this)
              //       if (!currentSpan.node().classList.contains('off')) {
              //         currentSpan.node().classList.add('off')
              //       }
              //     })
              //   break
              // case 3: // Cosine
              //   yReg = xDays.map(d => this.props.content[3].params[0]
              //     + this.props.content[3].params[1]*d
              //     + this.props.content[3].params[2]*d**2
              //     + this.props.content[3].params[3]*Math.cos(2*Math.PI*d/365.25 + this.props.content[3].params[4])
              //   )
              //   grandDaddy.select('.reg-line').attr("stroke-dasharray", regLineLength + " " + regLineLength)
              //     .transition()
              //       .duration(800)
              //       .ease(easeCubicOut)
              //       .attr('d', line()
              //         .x(function(d) { return x(d.date) + margin.left })
              //         .y(function(d, i) {return y(yReg[i]) + margin.top })
              //     )
              //   regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
              //   grandDaddy.select('.reg-line').attr("stroke-dasharray", 0)
              //     .attr('stroke-dashoffset', 0)
              //   grandDaddy.select('.reg-line-label-rect')
              //     .attr('class', 'reg-line-label-rect cosine')
              //     .transition()
              //       .duration(600)
              //       .ease(easeCubicOut)
              //       .style('width', '15.6em')
              //   grandDaddy.select('.reg-line-label-text').append('tspan')
              //     .attr('class', 'cosine span')
              //     .text(' + cos(2πt + φ)')
              //     .style('opacity', 0)
              //       .transition()
              //         .duration(800)
              //         .ease(easeQuad)
              //         .style('opacity', 1)
              //   grandDaddy.selectAll('.reg-line-label-text>tspan:not(.cosine)')
              //     .each(function(d) {
              //       let currentSpan = select(this)
              //       if (!currentSpan.node().classList.contains('off')) {
              //         currentSpan.node().classList.add('off')
              //       }
              //     })
              //   break
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
            console.log(target)
            switch(target) {
              // case -1:
              //   let dataLineLength = grandDaddy.select('.data-line').node().getTotalLength()
              //   grandDaddy.select('.data-line').attr('stroke-dashoffset', 0)
              //     .transition()
              //       .duration(800)
              //       .ease(easeCubicOut)
              //       .attr('stroke-dashoffset', -dataLineLength)
              //       .remove()
              //   break
              // case 0: // Initial
              //   regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
              //   grandDaddy.select('.reg-line').attr('stroke-dashoffset', 0)
              //     .transition()
              //       .duration(800)
              //       .ease(easeCubicOut)
              //       .attr('stroke-dashoffset', -regLineLength)
              //       .remove()
              //   grandDaddy.select('.data-line').attr('class', 'data-line')
              //   grandDaddy.select('.reg-line-label').style('opacity', 1)
              //     .transition()
              //       .duration(800)
              //       .ease(easeCubicOut)
              //       .style('opacity', 0)
              //       .remove()
              //   break
              // case 1: // Linear
              //   yReg = xDays.map(d => this.props.content[1].params[0] + this.props.content[1].params[1]*d)
              //   grandDaddy.select('.reg-line').transition()
              //     .duration(800)
              //     .ease(easeCubicOut)
              //     .attr('d', line()
              //       .x(function(d) { return x(d.date) + margin.left })
              //       .y(function(d, i) {return y(yReg[i]) + margin.top })
              //   )
              //   regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
              //   grandDaddy.select('.reg-line').attr("stroke-dasharray", regLineLength + " " + regLineLength)
              //   grandDaddy.select('.reg-line-label-text>.quadratic.span').style('opacity', 1)
              //     .transition()
              //       .duration(320)
              //       .ease(easeCubicOut)
              //       .style('opacity', 0)
              //       .remove()
              //   grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect linear')
              //     .transition()
              //       .duration(600)
              //       .ease(easeCubicOut)
              //       .style('width', '4.6em')
              //   setTimeout(() => {
              //     grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect linear')
              //   })
              //   grandDaddy.select('.reg-line-label-text>.linear.span').attr('class', 'linear span on')
              //   break
              // case 2: // Quadratic
              //   yReg = xDays.map(d => this.props.content[2].params[0]
              //     + this.props.content[2].params[1]*d
              //     + this.props.content[2].params[2]*d**2)
              //   grandDaddy.select('.reg-line').transition()
              //     .duration(800)
              //     .ease(easeCubicOut)
              //     .attr('d', line()
              //       .x(function(d) { return x(d.date) + margin.left })
              //       .y(function(d, i) {return y(yReg[i]) + margin.top })
              //   )
              //   regLineLength = grandDaddy.select('.reg-line').node().getTotalLength()
              //   grandDaddy.select('.reg-line').attr("stroke-dasharray", regLineLength + " " + regLineLength)
              //   grandDaddy.select('.reg-line-label-text>.cosine.span').style('opacity', 1)
              //     .transition()
              //       .duration(320)
              //       .ease(easeCubicOut)
              //       .style('opacity', 0)
              //       .remove()
              //   grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect quadratic')
              //     .transition()
              //       .duration(600)
              //       .ease(easeCubicOut)
              //       .style('width', '7.7em')
              //   setTimeout(() => {
              //     grandDaddy.select('.reg-line-label-rect').attr('class', 'reg-line-label-rect quadratic')
              //   })
              //   grandDaddy.select('.reg-line-label-text>.quadratic.span').attr('class', 'quadratic span on')
              //   break
              default:
            }
          }
          for (let i = from; i > to; i--) {
            let prevText = this.vizRef.current.querySelector('.viz-des-text:nth-child(' + (i + 1) + ')')
            console.log('hey')
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
    this.createViz(this.props.data)
    // let vizObserver = new IntersectionObserver(
    //   (entries, observer) => {
    //     if (entries[0].isIntersecting && !this.state.vizCreated) {
    //       this.setState({
    //         vizCreated: true
    //       }, () => {
    //         this.createViz(this.props.data)
    //       })
    //     }
    //   },
    //   {
    //     rootMargin: '0 0 -70%',
    //     threshold: 0
    //   })
    // vizObserver.observe(this.vizRef.current)

    let vizScrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            let index = entry.target.dataset.index
            console.log(index)
            if (!this.state.vizCreated) {
              this.createViz(this.props.data)
            }
            this.state.updateFunc(Number(index), this.state.currentState)
          }
        })
      },
      {
        threshold: 0
      }
    )
    document.querySelectorAll('.viz-scroll-anchor').forEach(el => {
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
        <div className="viz-wrap" id="line-chart">
          <div className="viz-svg-wrap"></div>
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

export default PolarPlot;
