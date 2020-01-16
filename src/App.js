import React, { Component } from 'react';
import './App.css';
import { csv, timeParse } from 'd3';

import Section from './components/section/Section';

const styles = {
  background: '#FFFFFF',
  invertedBackground: '#060608',
  dark: '#121214',
  invertedDark: '#FFFFFF',
  normal: '#444455',
  light: '#888899',
  line: '#E8E8E9',
  theme: '#4BA824'
},
vizs = [
  {
    key: 'line-chart',
    text: {
      header: ['A sharp', 'increase.'],
      des: [
        [
          {
            type: 'span',
            content: 'A simple line plot can show us how the CO'
          },
          {
            type: 'sub',
            content: '2'
          },
          {
            type: 'span',
            content: ' levels (measured in ppm - parts per million) has changed since the first recordings in 1980.'
          }
        ]
      ]
    },
    vizContent: [
      {
        state: 'initial',
        des: 'The original data looks like this.',
        params: null
      },
      {
        state: 'linear',
        des: 'There is a clear and consistent upward trend through the years.',
        params: [
          306.06644452,
          0.00430901514
        ]
      },
      {
        state: 'quadratic',
        des: 'But a quadratic trend line would be a better fit.',
        params: [
          314.574751,
          0.00210065413,
          0.0000000973625567
        ]
      },
      {
        state: 'cosine',
        des: 'The levels also have a seasonal component. This could be modeled by adding a cosine term to the function.',
        params: [
          314.569048,
          0.00210632696,
          0.0000000970576557,
          2.86111474,
          -0.554076698]
      }
    ]
  }
]

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }
  componentDidMount() {
    csv('data/weekly_in_situ_co2_mlo.csv').then(data => {
      data.forEach(function(d) {
        d.date = timeParse('%Y-%m-%d')(d.date)
        d.level = +d.level
      })
      this.setState({
        data: data,
        animationObserver: new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('on')
              }
            })
          },
          {
            threshold: 1
          }
        )
      })
    })
  }
  render() {
    return (
      <div
        id="App"
        style={{
            '--background': styles.background,
            '--inverted-background': styles.invertedBackground,
            '--dark': styles.dark,
            '--inverted-dark': styles.invertedDark,
            '--normal': styles.normal,
            '--light': styles.light,
            '--line': styles.line,
            '--theme': styles.theme,
            '--theme-readable': styles.themeReadable
          }}>
          {/* <div className="hero-wrap">
            <h1 className="hero-text">
              <span className="hero-span span-1">C</span>
              <span className="hero-span span-2">O</span>
              <sub className="hero-span span-3">2</sub>
            </h1>
            <p className="hero-des">
              An exploration into new formats for data visualization, with CO<sub>2</sub> measurements from the Mauna Loa Observatory in Hawaii.
            </p>
          </div> */}
          {this.state.data && vizs.map((viz, index) => {
            return <Section key={index} data={this.state.data} content={viz} animationObserver={this.state.animationObserver}/>
          })}
      </div>
    )
  }
}

export default App;
