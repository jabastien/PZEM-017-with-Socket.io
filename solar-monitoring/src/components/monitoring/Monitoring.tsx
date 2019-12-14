import React, { ReactElement, useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  NavLink,
  TabContent,
  TabPane,
  Nav,
  NavItem,
  Button
} from "reactstrap";
import classnames from "classnames";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLightbulb,
  faShower,
  faWater,
  faBroadcastTower,
  faCheckCircle,
  faSyncAlt
} from "@fortawesome/free-solid-svg-icons";

//init module
import DailyChart from "../charts/DailyChart";
import ConsoleLogs from "../console/ConsoleLogs";
import GaugeMeter from "../meters/gaugeMeter";
import Gauge from "../meters/Gauge";
import moment from "moment";
import { subscribeData, unsubscribe } from "../socketio/client";
import "./monitering.css";

const reduceMessage = (limit: number, logs: any[], reverse = false) => {
  var totalRows = 0;
  logs.forEach((a: any, i: number) => {
    if (totalRows >= limit) logs.splice(i, 1);

    totalRows++;
  });
};

const reduceData = (limit: number, logs: any[]) => {
  var totalRows = 0;
  logs.forEach((a: any, i: number) => {
    if (totalRows >= limit) logs.shift();

    totalRows++;
  });
};

export default (): ReactElement => {
  const [voltageGauge, setVoltageGauge] = useState<number>(0);
  const [currentGauge, setCurrentGauge] = useState<number>(0);
  const [powerGauge, setPowerGauge] = useState<number>(0);
  const [energyGauge, setEnergyGauge] = useState<number>(0);
  const [batteryData, setBatteryData] = useState<any>([
    {
      id: "power (W)",
      color: "hsl(226, 70%, 50%)",
      data: []
    },
    {
      id: "current (A)",
      color: "hsl(298, 70%, 50%)",
      data: []
    },
    {
      id: "volts (V)",
      color: "hsl(157, 70%, 50%)",
      data: []
    }
  ]);
  const [deviceData, setDeviceData] = useState<any>([]);
  const [logs, setLogs] = useState<any>([]);
  const [activeTab, setActiveTab] = useState("1");
  const [inverterSwitch, setInverterSwitch] = useState(false);
  const [lampSwitch, setLampSwitch] = useState(false);
  const [waterfallPumpSwitch, setWaterfallPumpSwitch] = useState(false);
  const [waterSprinkler, setWaterSprinkler] = useState(false);
  const [percentageCharge, setPercentageCharge] = useState(0);

  let dataLogs: any[] = [];
  const toggle = (tab: any) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  useEffect(() => {
    const cb = (data: any) => {
      dataLogs.unshift({
        LogLevelType: "info",
        Timestamp: moment.utc().local(),
        Messages: JSON.stringify(data.sensor)
      });

      setVoltageGauge(data.sensor.voltage_usage);
      setCurrentGauge(data.sensor.current_usage);
      setPowerGauge(data.sensor.active_power);
      setEnergyGauge(data.sensor.active_energy);
      

      setDeviceData({
        voltage: data.sensor.voltage_usage,
        current: data.sensor.current_usage,
        power: data.sensor.active_power,
        energy: data.sensor.active_energy
      });

      reduceMessage(100, dataLogs);
      setLogs([...dataLogs]);
    };
    subscribeData(cb);

    console.log("batteryData:", batteryData);
    return () => unsubscribe();
  }, []);

  const rangePercentage = (
    input: number,
    range_min: number,
    range_max: number,
    range_2ndMax: number
  ) => {
    var percentage = ((input - range_min) * 100) / (range_max - range_min);
    if (percentage > 100) {
      if (typeof range_2ndMax !== "undefined") {
        percentage =
          ((range_2ndMax - input) * 100) / (range_2ndMax - range_max);
        if (percentage < 0) {
          percentage = 0;
        }
      } else {
        percentage = 100;
      }
    } else if (percentage < 0) {
      percentage = 0;
    }
    return percentage;
  };

  const maxArr = 6;
  const maxBatteryLevel = 13.0;
  const minBatteryLevel = 10.5;
  useEffect(() => {
    const currTime = moment.utc().format("Y-M-D HH:mm ss");
    console.log(currTime);
    let chartData = [...batteryData];

    if (deviceData.power) {
      const powerIndex = 0;
      reduceData(maxArr, chartData[powerIndex].data);
      chartData[powerIndex].data = [
        ...chartData[powerIndex].data,
        {
          x: currTime,
          y: deviceData.power
          //y: Math.floor(Math.random() * 90 + 10)
        }
      ];
    }

    if (deviceData.current) {
      const currentIndex = 1;
      reduceData(maxArr, chartData[currentIndex].data);
      chartData[currentIndex].data = [
        ...chartData[currentIndex].data,
        {
          x: currTime,
          y: deviceData.current
          //y: Math.floor(Math.random() * 90 + 10)
        }
      ];
    }

    if (deviceData.voltage) {
      const voltageIndex = 2;
      setPercentageCharge(
        rangePercentage(
          deviceData.voltage,
          minBatteryLevel,
          maxBatteryLevel,
          100
        )
      );
      reduceData(maxArr, chartData[voltageIndex].data);
      chartData[voltageIndex].data = [
        ...chartData[voltageIndex].data,
        {
          x: currTime,
          y: deviceData.voltage
          //y: Math.floor(Math.random() * 90 + 10)
        }
      ];
    }

    setBatteryData(chartData);
  }, [deviceData]);

  const handleSwitch = (sw: number) => {
    switch (sw) {
      case 1:
        setInverterSwitch(!inverterSwitch);
        break;
      case 2:
        setLampSwitch(!lampSwitch);
        break;
      case 3:
        setWaterfallPumpSwitch(!waterfallPumpSwitch);
        break;
      case 4:
        setWaterSprinkler(!waterSprinkler);
        break;
      default:
        break;
    }
  };

  const handleSystemCheck = () => {};

  const handleEnergyReset = () => {};

  const Blik = (status: boolean) => {
    return status ? (
      <div className="led-box" style={{ marginRight: "10px" }}>
        <div className="led-green" style={{ marginLeft: "5px" }}></div>
      </div>
    ) : (
      <div className="led-box" style={{ marginRight: "10px" }}>
        <div className="led-red" style={{ marginLeft: "5px" }}></div>
      </div>
    );
  };

  const rangNumber = (start: number, end: number) => {
    var foo = [];
    for (let i = start; i <= end; i++) {
      foo.push(i);
    }
    return foo;
  };

  return (
    <div>
      <Nav tabs>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === "1" })}
            onClick={() => {
              toggle("1");
            }}
          >
            IoT - Solar Project
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="1">
          <Row>
            <Col sm="9">
              <Container>
                <Row>
                  <Col
                    style={{ width: "100%", height: 350, marginTop: 10 }}
                    sm="12"
                  >
                    <DailyChart
                      data={batteryData}
                      title="Real time Battery monitoring"
                      legend="Solar Power"
                      colors="category10"
                    />
                  </Col>
                </Row>
                <Row style={{paddingTop: 20}} >
                  <Col      sm="4">
                    <Gauge
                      min={0}
                      max={18}
                      chartTitle="Voltage"
                      units="V"
                      plotBands={[
                        {
                          from: 0,
                          to: 9.0,
                          color: "rgba(255, 50, 50, .50)"
                        },
                        {
                          from: 9.1,
                          to: 12.5,
                          color: "rgba(255, 255, 10, .50)"
                        },
                        {
                          from: 11.1,
                          to: 14.5,
                          color: "rgba(0, 255, 10, .50)"
                        },
                        {
                          from: 14.5,
                          to: 18,
                          color: "rgba(10, 10, 10, .25)"
                        }
                      ]}
                      majorTicks={rangNumber(0, 18)}
                      value={voltageGauge}
                    />

                    {/* <GaugeMeter title="Voltage" name="ssss" chartTitle="Voltage (V)"
                      min={0}
                      max={18}
                      data={voltageGauge}
                      plotBands={[{
                        from: 11.1,
                        to: 14.5,
                        color: '#55BF3B' // green
                      }, {
                        from: 14.6,
                        to: 18,
                        color: '#DDDF0D' // yellow
                      }, {
                        from: 11.0,
                        to: 0,
                        color: '#DF5353' // red
                      }]}
                    /> */}
                  </Col>
                  <Col sm="4">
                    <Gauge
                      chartTitle="Current"
                      min={0}
                      max={10}
                      units="A"
                      plotBands={[
                        {
                          from: 0,
                          to: 2,
                          color: "rgba(0, 255, 10, .50)"
                        },
                        {
                          from: 2,
                          to: 5,
                          color: "rgba(10, 10, 10, .25)"
                        },
                        {
                          from: 5,
                          to: 8,
                          color: "rgba(255, 255, 10, .50)"
                        },
                        {
                          from: 8,
                          to: 10,
                          color: "rgba(255, 50, 50, .50)"
                        }
                      ]}
                      majorTicks={rangNumber(0, 10)}
                      value={currentGauge}
                    />
                    {/* <GaugeMeter
                      title="Current"
                      name="ssss"
                      chartTitle="Current (A)"
                      min={0}
                      max={10}
                      data={currentGauge}
                      plotBands={[
                        {
                          from: 0,
                          to: 6,
                          color: "#55BF3B" // green
                        },
                        {
                          from: 7,
                          to: 8,
                          color: "#DDDF0D" // yellow
                        },
                        {
                          from: 9,
                          to: 10,
                          color: "#DF5353" // red
                        }
                      ]}
                    /> */}
                  </Col>
                  <Col sm="4">
                    <Gauge
                      chartTitle="Watt"
                      min={0}
                      max={2000}
                      units="W"
                      plotBands={[
                        {
                          from: 0,
                          to: 600,
                          color: "rgba(0, 255, 10, .50)"
                        },
                        {
                          from: 600,
                          to: 1000,
                          color: "rgba(10, 10, 10, .25)"
                        },
                        {
                          from: 1000,
                          to: 1600,
                          color: "rgba(255, 255, 10, .50)"
                        },
                        {
                          from: 1600,
                          to: 2000,
                          color: "rgba(255, 50, 50, .50)"
                        }
                      ]}
                      majorTicks={[
                        0,
                        200,
                        400,
                        600,
                        800,
                        1000,
                        1200,
                        1400,
                        1600,
                        1800,
                        20000
                      ]}
                      value={powerGauge}
                    />
                    {/* <GaugeMeter
                      title="Watt"
                      name=""
                      chartTitle="Watt (W)"
                      min={0}
                      max={2000}
                      data={energyGauge}
                      plotBands={[
                        {
                          from: 0,
                          to: 600,
                          color: "#55BF3B" // green
                        },
                        {
                          from: 601,
                          to: 1500,
                          color: "#DDDF0D" // yellow
                        },
                        {
                          from: 1501,
                          to: 2000,
                          color: "#DF5353" // red
                        }
                      ]}
                    /> */}
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col sm="3">
              <div>
                <strong style={{ textAlign: "center" }}>Relay Switch</strong>
              </div>
              <br />
              <div>
                {inverterSwitch ? "ON " : "OFF "}{" "}
                <Button
                  onClick={() => handleSwitch(1)}
                  color="primary"
                  style={{ margin: 5, width: 200, height: 50 }}
                >
                  Inverter <FontAwesomeIcon icon={faBroadcastTower} size="lg" />
                  {Blik(inverterSwitch)}
                </Button>
              </div>
              <div>
                {lampSwitch ? "ON " : "OFF "}{" "}
                <Button
                  onClick={() => handleSwitch(2)}
                  color="warning"
                  style={{ margin: 5, width: 200, height: 50 }}
                >
                  Lamp <FontAwesomeIcon icon={faLightbulb} size="lg" />
                  {Blik(lampSwitch)}
                </Button>
              </div>
              <div>
                {waterfallPumpSwitch ? "ON " : "OFF "}{" "}
                <Button
                  onClick={() => handleSwitch(3)}
                  color="info"
                  style={{ margin: 5, width: 200, height: 50 }}
                >
                  Waterfall Pump <FontAwesomeIcon icon={faWater} size="lg" />
                  {Blik(waterfallPumpSwitch)}
                </Button>
              </div>
              <div>
                {waterSprinkler ? "ON " : "OFF "}
                <Button
                  onClick={() => handleSwitch(4)}
                  color="success"
                  style={{ margin: 5, width: 200, height: 50 }}
                >
                  Water Sprinkler <FontAwesomeIcon icon={faShower} size="lg" />
                  {Blik(waterSprinkler)}
                </Button>
              </div>

              <br />
              <div>
                <strong style={{ textAlign: "center" }}>State of Charge</strong>
              </div>
              <div className="single-chart">
                <svg viewBox="0 0 36 36" className="circular-chart green">
                  <path
                    className="circle-bg"
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    stroke-dasharray={percentageCharge.toFixed(2) + ", 100"}
                    d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" className="percentage">
                    {percentageCharge.toFixed(1) + "%"}
                  </text>
                </svg>
              </div>

              <div>
                <Button
                  onClick={handleSystemCheck}
                  color="secondary"
                  style={{ margin: 5, width: 200, height: 50 }}
                >
                  Check <FontAwesomeIcon icon={faCheckCircle} size="lg" />
                </Button>
              </div>

              <div>
                <Button
                  onClick={handleEnergyReset}
                  color="danger"
                  style={{ margin: 5, width: 200, height: 50 }}
                >
                  Energy Reset <FontAwesomeIcon icon={faSyncAlt} size="lg" />
                </Button>
              </div>
            </Col>
          </Row>
          <Row>
            <Col>
              <ConsoleLogs subscribData={logs} />
            </Col>
          </Row>
        </TabPane>
      </TabContent>
    </div>
  );
};
