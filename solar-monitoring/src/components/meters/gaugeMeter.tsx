import React, { useState, useEffect, ReactElement } from 'react';
import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import HC_more from "highcharts/highcharts-more";
import './gauge.css';

HC_more(Highcharts);

interface GaugeMeterProps {
    title: string;
    name: string;
    min: number,
    max: number,
    data: number,
    plotBands: any[],
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
                min: props.min,
                max: props.max,

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
                plotBands: props.plotBands
            },
            series: [{
                name: props.name,
                data: [props.data],
                tooltip: {
                    valueSuffix: ' ' + props.chartTitle
                }
            }]
        });
    }, [])

    useEffect(() => {
        if (options) {
            let updateObject = { ...options };
            updateObject.series[0].data = [props.data];
            setOptions(updateObject);
        }

    }, [props.data])

    return <HighchartsReact
        constructorType={"chart"}
        //ref={this.chartComponent}
        highcharts={Highcharts}
        options={options}
    />
};

export default GaugeMeter;

