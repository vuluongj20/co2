import React, { Component } from 'react';
import './App.css';
import { csv, timeParse } from 'd3';

import Section from './components/section/Section';

const styles = {
  background: '#F9F9FA',
  invertedBackground: '#121214',
  dark: '#333334',
  invertedDark: '#EFEFF1',
  normal: '#555556',
  invertedNormal: '#CCCCCD',
  light: '#888889',
  line: '#E6E6E8',
  theme: '#4BA824',
  error: '#A85224',
  warm: '#EC5F13',
  cool: '#AB13EC'
},
vizs = [
  {
    key: 'line-chart',
    height: '500vh',
    text: {
      header: ['NOT SO LINEAR.', ''],
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
            content: ' levels (measured in ppm - parts per million) have changed since the first recordings in 1958. Inference for regression was done with PyStan. A basic linear regression proved insufficient, and slightly more complex terms were added to improve model performance.'
          }
        ]
      ]
    },
    vizContent: [
      {
        state: 'initial',
        des: 'The original data looks like this. There is a clear and consistent upward trend through the years.',
        params: null
      },
      {
        state: 'linear',
        des: 'A straight line would obviously be a pretty bad fit. The MSE (Mean Squared Error) is quite high.',
        params: [
          306.06644452,
          0.00430901514
        ]
      },
      {
        state: 'quadratic',
        des: 'A quadratic curve performs much better. The MSE is now one third that of the straight line.',
        params: [
          314.574751,
          0.00210065413,
          0.0000000973625567
        ]
      },
      {
        state: 'cosine',
        des: 'Here comes the magic: we can approximate the data by adding a cosine term to the regression function. The MSE is now significantly lower.',
        params: [
          314.569048,
          0.00210632696,
          0.0000000970576557,
          2.86111474,
          -0.554076698]
      }
    ]
  },
  {
    key: 'polar-plot',
    height: '400vh',
    text: {
      header: ['ROUND AND', 'ROUND WE GO.'],
      des: [
        [
          {
            type: 'span',
            content: "Say hi to polar plots! They're circular plots that use polar coordinate systems. This makes them highly appropriate for time series with recurring patterns."
          }
        ]
      ]
    },
    vizContent: [
      {
        state: 'one',
        des: 'Each revolution corresponds to a full year.',
      },
      {
        state: 'all',
        des: 'The whole dataset looks like this. Notice how the rise in CO2 levels is expressed by a consistent trend outward.'
      },
      {
        state: 'stretches',
        des: 'The circles stretch outward in winter months (blue) and inward in summer months (red), due to the annual seasonal fluctuations we saw above.'
      }
    ]
  }
],
mainContent = {
  meta: [
    {
      name: 'AUTHOR',
      content: ['Vu Luong']
    },
    {
      name: 'TOOLS/FRAMEWORKS',
      content: ['PyStan', 'React', 'D3.js']
    },
    {
      name: 'LINKS',
      links: true,
      content: [
        {
          name: 'Data Set',
          link: 'https://www.esrl.noaa.gov/gmd/ccgg/trends/data.html'
        },
        {
          name: 'Code for Stan Inference',
          link: 'https://github.com/vuluongj20/misc/blob/master/CO2.ipynb'
        },
        {
          name: 'Project Report',
          link: 'data/Project Report.pdf'
        }
      ]
    }
  ],
  endNote: "That's all for now. Cheers :)"
}

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
            threshold: 0.5
          }
        )
      }, () => {
        document.querySelectorAll('.parent.animate').forEach(el => {
          this.state.animationObserver.observe(el)
        })
      })
    })
  }
  render() {
    document.body.style.background = styles.background
    return (
      <div
        id="App"
        style={{
            '--background': styles.background,
            '--inverted-background': styles.invertedBackground,
            '--dark': styles.dark,
            '--inverted-dark': styles.invertedDark,
            '--normal': styles.normal,
            '--inverted-normal': styles.invertedNormal,
            '--light': styles.light,
            '--line': styles.line,
            '--theme': styles.theme,
            '--error': styles.error,
            '--warm': styles.warm,
            '--cool': styles.cool
          }}>
          <div className="hero-wrap">
            <h1 className="hero-text">
              <span className="hero-span span-1">C</span>
              <span className="hero-span span-2">O</span>
              <sub className="hero-span span-3">2</sub>
            </h1>
            <p className="hero-des">
              An exploration into data visualization, with carbon dioxide records from the Mauna Loa Observatory in Hawaii.
            </p>
          </div>
          <div className="meta-wrap">
            <div className="meta-inner-wrap limited">
              {mainContent.meta.map((column, index) => {
                return (
                  <div className="meta-column animate parent blur" key={index}>
                    <p className="meta-column-name">{column.name}</p>
                    {column.links ? (column.content.map((el, index) => {
                      return <a className="meta-column-link" key={index} href={el.link}>{el.name}</a>
                    }))
                    : (column.content.map((el, index) => {
                      return <p className="meta-column-el" key={index}>{el}</p>
                    }))}
                  </div>
                )
              })}
            </div>
          </div>
          {this.state.data && vizs.map((viz, index) => {
            return <Section key={index} data={this.state.data} content={viz} animationObserver={this.state.animationObserver}/>
          })}
          <div className="end-note-wrap">
            <p className="end-note animate parent blur">{mainContent.endNote}</p>
          </div>
          <div className="footer-wrap">
            <p className="footer-name animate parent blur">CO<sub>2</sub></p>
            <p className="footer-text animate parent blur">Made by Vu Luong, with ♥</p>
          </div>
      </div>
    )
  }
}

export default App;
