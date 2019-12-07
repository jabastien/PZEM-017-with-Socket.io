import React, { useState, useEffect, ReactElement } from 'react';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HC_more from "highcharts/highcharts-more"; 
import  './gauge.css';

HC_more(Highcharts);

interface GaugeMeterProps {
    title: string;
    name: string;
    chartTitle: string | 'km/h'
}

const GaugeMeter = (props: GaugeMeterProps): ReactElement => {

    const [options, setOptions] = useState();

    useEffect(() => {

        setOptions({
            title: {
                text: props.title
            },
            chart: {
                type: 'gauge',
                plotBackgroundColor: null,
                plotBackgroundImage: null,
                plotBorderWidth: 0,
                plotShadow: false
            },
            pane: {
                startAngle: -150,
                endAngle: 150,
                background: [{
                    backgroundColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, '#FFF'],
                            [1, '#333']
                        ]
                    },
                    borderWidth: 0,
                    outerRadius: '109%'
                }, {
                    backgroundColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, '#333'],
                            [1, '#FFF']
                        ]
                    },
                    borderWidth: 1,
                    outerRadius: '107%'
                }, {
                    // default background
                }, {
                    backgroundColor: '#DDD',
                    borderWidth: 0,
                    outerRadius: '105%',
                    innerRadius: '103%'
                }]
            },
            // the value axis
            yAxis: {
                min: 0,
                max: 200,

                minorTickInterval: 'auto',
                minorTickWidth: 1,
                minorTickLength: 10,
                minorTickPosition: 'inside',
                minorTickColor: '#666',

                tickPixelInterval: 30,
                tickWidth: 2,
                tickPosition: 'inside',
                tickLength: 10,
                tickColor: '#666',
                labels: {
                    step: 2,
                    rotation: 'auto'
                },
                title: {
                    text: props.chartTitle
                },
                plotBands: [{
                    from: 0,
                    to: 120,
                    color: '#55BF3B' // green
                }, {
                    from: 120,
                    to: 160,
                    color: '#DDDF0D' // yellow
                }, {
                    from: 160,
                    to: 200,
                    color: '#DF5353' // red
                }]
            },
            series: [{
                name: props.name,
                data: [80],
                tooltip: {
                    valueSuffix: ' ' + props.chartTitle
                }
            }]
        });
    }, [])

    return <HighchartsReact
        constructorType={"chart"}
        //ref={this.chartComponent}
        highcharts={Highcharts}
        options={options}
    />
};

export default GaugeMeter;

