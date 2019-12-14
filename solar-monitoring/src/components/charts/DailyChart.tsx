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

  const Tooltip = ({ point }: any) => {
    const index = point.id.split(".")[1]
    return (
      <div style={{
        border: "solid 1px grey", padding: "9px 9px", background: "white", position: "absolute",
        left: 5,
        top: 20,
        width: 150
      }}>
        <div
          style={{
            color: "#808080",
            padding: '3px 0',
          }}
        >
          <strong>Date: </strong> {point.data.xFormatted.split(" ")[0]}
        </div>
        <div
          style={{
            color: "#808080",
            padding: '3px 0',
          }}
        >
          <strong>Time: </strong> {point.data.xFormatted.split(" ")[1]}
        </div>

      </div>
    )
  }

  return (
    <>
      <strong style={{ textAlign: 'center' }}>{props.title}</strong>

      <ResponsiveLine
        data={props.data}
        margin={{
          top: 10,
          right: 110,
          bottom: 70,
          left: 60
        }}
        xFormat='time:%Y-%m-%d %H:%M %S'
        xScale={{
          type: 'time',
          format: "%Y-%m-%d %H:%M %S",
          precision: 'second' //second, minute, day
          //minute
          //day
        }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        //curve='linear'
        curve='monotoneX'
        enableArea={true}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          orient: 'bottom',
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          format: '%H:%M %S',
          tickValues: 'every 2 second', //hours , minutes
          legend: 'Time',
          legendOffset: 36,
          legendPosition: 'middle' // start, middle, end

        }}
        axisLeft={{  //Vertical
          orient: 'left',
          tickSize: 5,
          tickPadding: 0,
          tickRotation: 0,
          format: (e: any) => {
            // if (Math.floor(e) != e) {
            //   return;
            // }
            return parseFloat(e).toFixed(2);
          },
          legend: props.legend,
          legendOffset: -40,
          legendPosition: 'middle'
        }}
        colors={{ scheme: props.colors }}
        //colors={['#808080', 'red', '#91BC81']}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabel="y"
        pointLabelYOffset={-12}

        animate={false}
        motionStiffness={120}
        motionDamping={50}
        isInteractive={false}
        enableSlices={false}

        useMesh={true}
        tooltip={Tooltip}
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

// DailyChart.propTypes = {
//     data: PropTypes.array.isRequired
//   };

export default DailyChart;

