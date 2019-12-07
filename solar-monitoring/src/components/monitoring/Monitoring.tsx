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
  const [voltage, setVoltage] = useState<any>([{
    id: "volts",
    color: "hsl(214, 70%, 50%)",
    data: createHours().map((time: string) => {
      return {
        x: time,
        y: 0
      }
    })
  }]);
  const [current, setCurrent] = useState<any>([]);
  const [power, setPower] = useState<any>([]);
  const [energy, setEnergy] = useState<any>([]);

  const [logs, setLogs] = useState<any>([]);
  const [activeTab, setActiveTab] = useState('1');


  let dataLogs: any[] = [];

  let voltage_tmp: any[] = [];
  let current_tmp: any[] = [];
  let power_tmp: any[] = [];
  let energy_tmp: any[] = [];

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

      const currTime = moment.utc().local().format('HH:mm:ss');

      prepareData(voltage_tmp, currTime, data.sensor.voltage_usage, 'volts', setVoltage);
      prepareData(current_tmp, currTime, data.sensor.current_usage, 'current', setCurrent);
      prepareData(power_tmp, currTime, data.sensor.active_power, 'power', setPower);
      prepareData(energy_tmp, currTime, data.sensor.active_energy, 'energy', setEnergy);

      reduceMessage(24, voltage_tmp, true);
      reduceMessage(24, current_tmp, true);
      reduceMessage(24, power_tmp, true);
      reduceMessage(24, energy_tmp, true);

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
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === '2' })}
            onClick={() => { toggle('2'); }}
          >
            Weekly
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === '3' })}
            onClick={() => { toggle('3'); }}
          >
            Monthly
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
                    <DailyChart data={voltage} title="Voltage" legend="Volts" colors="category10" />
                  </Col>
                </Row>
                <Row>
                  <Col style={{ width: '100%', height: 350, marginTop: 30 }} sm="12">
                    <DailyChart data={current} title="Current" legend="Amp" colors="accent" />
                  </Col>
                </Row>
                <Row>
                  <Col style={{ width: '100%', height: 350, marginTop: 30 }} sm="12">
                    <DailyChart data={power} title="Power" legend="Watt" colors="dark2" />
                  </Col>
                </Row>
                <Row>
                  <Col style={{ width: '100%', height: 350, marginTop: 30 }} sm="12">
                    <DailyChart data={energy} title="Energy" legend="Whr" colors="nivo" />
                  </Col>
                </Row>
              </Container>
            </Col>
            <Col sm="4">

              <ConsoleLogs subscribData={logs} />
            </Col>
          </Row>
        </TabPane>

        <TabPane tabId="2">
          <Row>
            <Col sm="12">

            </Col>
          </Row>
        </TabPane>

        <TabPane tabId="3">
          <Row>
            <Col sm="12">

            </Col>
          </Row>
        </TabPane>

      </TabContent>
    </div>
  );
};

//export default Monitoring;
