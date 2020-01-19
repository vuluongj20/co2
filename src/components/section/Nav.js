import React, { Component } from 'react';
import './Nav.css';


class Nav extends Component {
  componentDidMount() {
  }
  render() {
    let text = this.props.content.text
    return (
      <div className="nav-wrap" ref={this.sectionRef} style={{height: this.props.content.height}}>
      </div>
    )
  }
}

export default Section;
