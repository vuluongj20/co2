import React, { Component } from 'react';
import './App.css';
import { csv, timeParse } from 'd3';

import Section from './components/section/Section';

const styles = {
  background: '#0D0D0D',
  backgroundOpaque: 'rgba(13, 13, 13, 0.3)',
  dark: '#DFDFE2',
  normal: '#CCCCD1',
  light: '#61616B',
  line: '#1D1D20',
  lineOpaque: 'rgba(222, 222, 222, 0.05)',
  theme: '#50c91d',
  error: '#d77642',
  warm: '#f07f42',
  cool: '#bc42f0'
},
vizs = [
  {
    key: 'line-chart',
    height: '600vh',
    text: {
      des: [
        [
          {
            type: 'span',
            content: "Industrialization has led to astonishing economic growth in many countries in the world. At the same time, the ever rising demand in energy has led to more coal and fuel burning, animal farming, and artificial deforestation. All of these activities have resulted in significant increases in atmospheric carbon dioxide and other greenhouse gases. But just how quickly have CO₂ levels increased in the last few decades?"
          }
        ],
        [
          {
            type: 'span',
            content: "The Mauna Loa Observatory in Hawaii has been recording atmospheric CO₂ levels since 1958. The dataset offers great insights into the state of the earth in the past, present, and where it could be in the future."
          }
        ]
      ]
    },
    vizContent: [
      {
        state: 'initial',
        des: 'Here is the data in its entirety. CO₂ is measured in ppm (parts-per-million). Hover over the plot for more details.',
        params: null
      },
      {
        state: 'linear',
        des: 'There is a clear and consistent upward trend through the years. The average increase is +0.4% each year.',
        params: [
          306.06644452,
          0.00430901514
        ]
      },
      {
        state: 'quadratic',
        des: 'In fact, the regression line curves upward. This means that CO₂ levels are not only increasing but also accelerating at an alarming rate.',
        params: [
          314.574751,
          0.00210065413,
          0.0000000973625567
        ]
      },
      {
        state: 'cosine',
        des: 'There are yearly peaks during winter months, when we burn more coal for energy, and plants naturally release more CO₂ when there is less sunlight.',
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
    height: '440vh',
    text: {
      des: [
        [
          {
            type: 'span',
            content: "There's another way to look at this. Say hi to polar plots! They're circular plots that use polar coordinate systems. They work great for time series with recurring patterns, like this one."
          }
        ]
      ]
    },
    vizContent: [
      {
        state: 'one',
        des: "Each circle corresponds to a full year. Here's what the data for 1958 looks like.",
      },
      {
        state: 'all',
        des: 'And here is the whole dataset. Notice the gradual trend outward, indicating a yearly increase in CO₂ levels.'
      },
      {
        state: 'stretches',
        des: 'The circles stretch outward in winter months (blue) and inward in summer months (red), due to the yearly cycles we saw above.'
      }
    ]
  }
],
mainContent = {
  meta: [
    {
      name: 'MADE BY',
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
                document.querySelector('.hero-arrow-wrap').classList.add('off')
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
            '--background-opaque': styles.backgroundOpaque,
            '--dark': styles.dark,
            '--normal': styles.normal,
            '--light': styles.light,
            '--line': styles.line,
            '--line-opaque': styles.lineOpaque,
            '--theme': styles.theme,
            '--error': styles.error,
            '--warm': styles.warm,
            '--cool': styles.cool
          }}>
          <div className="label-wrap">
            <div className="label-line"></div>
            <p className="label-text">CO₂</p>
          </div>
          <div className="hero-wrap">
            <div className="hero-inner-wrap">
              <h1 className="hero-text">
                <span className="hero-span span-1">A look at CO₂ levels</span>
                <span className="hero-span span-2">in the last few decades</span>
              </h1>
            </div>
            <div className="hero-arrow-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="34" viewBox="0 0 24 24" version="1">
                <g id="arrow-group">
                  <path d="M12 5 12 32"></path>
                  <path d="M3 24 12 32 21 24"></path>
                </g>
              </svg>
            </div>
          </div>
          {this.state.data && vizs.map((viz, index) => {
            return <Section key={index} data={this.state.data} content={viz} animationObserver={this.state.animationObserver}/>
          })}
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
      </div>
    )
  }
}

export default App;
