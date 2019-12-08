import React, { ReactElement, useState, useEffect } from "react";
import { Container, Row, Col, NavLink, TabContent, TabPane, Nav, NavItem } from "reactstrap";
import classnames from 'classnames';

//init module
import DailyChart from "../charts/DailyChart";
import ConsoleLogs from '../console/ConsoleLogs'
import GaugeMeter from '../meters/gaugeMeter';
import moment from 'moment'
import { subscribeData, unsubscribe } from '../socketio/client'


const createHours = () => {
  var arr = [], i;
  for (i = 0; i < 24; i++) {
    arr.push(i + ":00");
  }
  return arr;
}

const reduceMessage = (limit: number, logs: any[], reverse = false) => {
  var totalRows = 0;
  logs.forEach((a: any, i: number) => {
    if (totalRows >= limit)
      logs.splice(i, 1);

    totalRows++;
  });
}

export default (): ReactElement => {

  const [voltageGauge, setVoltageGauge] = useState<number>(0);
  const [currentGauge, setCurrentGauge] = useState<number>(0);
  const [energyGauge, setEnergyGauge] = useState<number>(0);

  const [batteryData, setBatteryData] = useState<any>([]);
  // const [voltage, setVoltage] = useState<any>([{
  //   id: "volts",
  //   color: "hsl(214, 70%, 50%)",
  //   data: createHours().map((time: string) => {
  //     return {
  //       x: time,
  //       y: 0
  //     }
  //   })
  // }]);
  // const [current, setCurrent] = useState<any>([]);
  // const [power, setPower] = useState<any>([]);
  // const [energy, setEnergy] = useState<any>([]);

  const [logs, setLogs] = useState<any>([]);
  const [activeTab, setActiveTab] = useState('1');

  let dataLogs: any[] = [];
  const toggle = (tab: any) => {
    if (activeTab !== tab) setActiveTab(tab);
  }

  useEffect(() => {

    const cb = (data: any) => {
      dataLogs.unshift({
        LogLevelType: 'info',
        Timestamp: moment.utc().local(),
        Messages: JSON.stringify(data.sensor)
      });

      setVoltageGauge(data.sensor.voltage_usage);
      setCurrentGauge(data.sensor.current_usage);
      setEnergyGauge(data.sensor.active_power);

      const currTime = moment.utc().local().format('HH:mm:ss');

      setBatteryData([
        {
          id: "volts (V)",
          color: "hsl(157, 70%, 50%)",
          data: createHours().map((time: string) => {
            return {
              x: time,
              y: data.sensor.voltage_usage
            }
          })
        },
        {
          id: "current (A)",
          color: "hsl(298, 70%, 50%)",
          data: createHours().map((time: string) => {
            return {
              x: time,
              y: data.sensor.current_usage
            }
          })
        },
        {
          id: "power (W)",
          color: "hsl(226, 70%, 50%)",
          data: createHours().map((time: string) => {
            return {
              x: time,
              y: data.sensor.active_power
            }
          })
        }
      ])


      // prepareData(voltage_tmp, currTime, data.sensor.voltage_usage, 'volts', setVoltage);
      // prepareData(current_tmp, currTime, data.sensor.current_usage, 'current', setCurrent);
      // prepareData(power_tmp, currTime, data.sensor.active_power, 'power', setPower);
      // prepareData(energy_tmp, currTime, data.sensor.active_energy, 'energy', setEnergy);

      // reduceMessage(24, voltage_tmp, true);
      // reduceMessage(24, current_tmp, true);
      // reduceMessage(24, power_tmp, true);
      // reduceMessage(24, energy_tmp, true);

      reduceMessage(100, dataLogs);
      setLogs([...dataLogs])
    }
    subscribeData(cb);
    return () => unsubscribe();

  }, []);


  const prepareData = (objectArr: any[], currentTime: any, value: any, name: string, fn: any) => {
    if (!objectArr.find(data => data.x === currentTime)) {
      objectArr.push({ x: currentTime, y: value });
      fn([{
        id: name,
        color: "hsl(214, 70%, 50%)",
        data: objectArr.length > 0 ? objectArr : []
      }])
    }
  }

  return (
    <div>
      <Nav tabs>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === '1' })}
            onClick={() => { toggle('1'); }}
          >
            Daily
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent activeTab={activeTab}>
        <TabPane tabId="1">
          <Row>
            <Col sm="8">
              <Container>

                <Row>
                  <Col style={{ width: '100%', height: 350, marginTop: 10 }} sm="12">
                    <DailyChart data={batteryData} title="Voltage" legend="Volts" colors="category10" />
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <GaugeMeter title="" name="ssss" chartTitle="Voltage (V)"
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
                    />
                  </Col>
                  <Col>
                    <GaugeMeter title="" name="ssss" chartTitle="Current (A)"
                      min={0}
                      max={10}
                      data={currentGauge}
                      plotBands={[{
                        from: 0,
                        to: 6,
                        color: '#55BF3B' // green
                      }, {
                        from: 7,
                        to: 8,
                        color: '#DDDF0D' // yellow
                      }, {
                        from: 9,
                        to: 10,
                        color: '#DF5353' // red
                      }]}
                    />
                  </Col>
                  <Col>
                    <GaugeMeter title="" name="ssss" chartTitle="Watt (W)"
                      min={0}
                      max={2000}
                      data={energyGauge}
                      plotBands={[{
                        from: 0,
                        to: 600,
                        color: '#55BF3B' // green
                      }, {
                        from: 601,
                        to: 1500,
                        color: '#DDDF0D' // yellow
                      }, {
                        from: 1501,
                        to: 2000,
                        color: '#DF5353' // red
                      }]}
                    />
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col sm="4">
              <ConsoleLogs subscribData={logs} />
            </Col>
          </Row>
        </TabPane>
      </TabContent>
    </div>
  );
};

//export default Monitoring;
