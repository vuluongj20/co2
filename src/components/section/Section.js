import React, { Component } from 'react';
import './Section.css';

// import LineChart from './viz/LineChart';
import PolarPlot from './viz/PolarPlot';

class Section extends Component {
  constructor(props) {
    super(props)
    this.renderSwitch = this.renderSwitch.bind(this)
    this.sectionRef = React.createRef()
  }
  renderSwitch() {
    switch (this.props.content.key) {
      case 'line-chart':
        return <PolarPlot data={this.props.data} content={this.props.content.vizContent} />
      default:
        return null
    }
  }
  componentDidMount() {
    this.sectionRef.current.querySelectorAll('.animate').forEach(el => {
      this.props.animationObserver.observe(el)
    })
  }
  render() {
    let text = this.props.content.text
    return (
      <div className="section-wrap" ref={this.sectionRef}>
        {/* <div className="limit-box">
          <h2 className="header limited">
              {text.header[0] && <span className="header-span animate right">{text.header[0]}</span>}
              {text.header[1] && <span className="header-span animate left">{text.header[1]}</span>}
          </h2>
          {text.des.map((para, index) => {
            return (
              <p
                key={index}
                className="para limited animate blur"
                style={{
                  '--animation-speed': '800ms',
                  '--animation-delay': '800ms'
              }}>
                {para.map((segment, index) => {
                  switch(segment.type) {
                    case 'span':
                      return <span key={index}>{segment.content}</span>
                    case 'sub':
                      return <sub key={index}>{segment.content}</sub>
                    default:
                      return null
                  }
                })}
              </p>
            )
          })}
        </div> */}
        {this.renderSwitch()}
      </div>
    )
  }
}

export default Section;
