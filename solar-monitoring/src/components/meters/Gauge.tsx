import React, { useEffect, ReactElement } from 'react'
import { RadialGauge, RadialGaugeOptions } from 'canvas-gauges'

interface IGauge {
  value: number;
  chartTitle: string;
  units: string
  min: number;
  max: number;
  majorTicks: any[];
  plotBands: any[];
  width?:number | undefined;
  height?:number | undefined;
}

class ReactRadialGauge extends React.Component<IGauge> {
  gauge: RadialGauge | null = null;
  options: RadialGaugeOptions;

  constructor(props: IGauge) {
    super(props);

    this.options = {
      renderTo: '',
      width: this.props.width || 280,
      title: this.props.chartTitle,
      height: this.props.height || 280,
      units: this.props.units,
      minValue: this.props.min,
      maxValue: this.props.max,
      majorTicks: this.props.majorTicks || [],
      minorTicks: 6,
      strokeTicks: true,
      highlights: this.props.plotBands,
      colorPlate: "#fff",
      borderShadowWidth: 1,
      valueBox: true,
      valueInt: 2,
      needleType: "arrow",
      needleWidth: 2,
      needleCircleSize: 7,
      colorValueBoxRect: "#fff",
      needleCircleOuter: true,
      needleCircleInner: false,
      animationDuration: 700,
      animationRule: "linear"
    };
  }


  componentDidMount() {
    this.gauge = new RadialGauge(this.options).draw();
  }

  render() {
    if (this.gauge != null) {
      this.gauge.update({
        ...this.options,
        value: this.props.value
      });
    }

    return (
      <canvas ref={(canvas) => {
        if (canvas != null) {
          this.options.renderTo = canvas;
        }
      }} />
    )
  }
}

export default ReactRadialGauge
