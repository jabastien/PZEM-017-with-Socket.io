import React, { ReactElement } from 'react';
import { ResponsiveLine } from '@nivo/line';

type ChartData = {
    x: string;
    y: number;
};

type ChartModel = {
    id: string;
    color: string;
    data: ChartData[]
}

interface DailyChartProps {
    data: ChartModel[];
    title: string;
    legend: string;
    colors: any | undefined
}

const DailyChart = (props: DailyChartProps): ReactElement => {

    return (
        <>
            <strong style={{ textAlign: 'center' }}>{props.title}</strong>
            <ResponsiveLine
                data={props.data}
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{ type: 'linear', stacked: true, min: 'auto', max: 'auto' }}
                //curve={""}
                enableArea={true}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                    orient: 'bottom',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: 'date time',
                    legendOffset: 36,
                    legendPosition: 'middle'
                }}
                axisLeft={{
                    orient: 'left',
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: props.legend,
                    legendOffset: -40,
                    legendPosition: 'middle'
                }}
                colors={{ scheme: props.colors }}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabel="y"
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                    {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        effects: [
                            {
                                on: 'hover',
                                style: {
                                    itemBackground: 'rgba(0, 0, 0, .03)',
                                    itemOpacity: 1
                                }
                            }
                        ]
                    }
                ]}
                layers={[
                    'grid',
                    'markers',
                    'axes',
                    //Area,
                    //'crosshair',
                    'lines',
                    'points',
                    'slices',
                    'mesh',
                    'legends'
                ]}
            />
        </>
    );
};

export default DailyChart;

