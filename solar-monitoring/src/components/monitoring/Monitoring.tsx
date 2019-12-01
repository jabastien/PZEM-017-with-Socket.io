import React, { ReactElement, useState, useEffect } from "react";
import { Container, Row, Col, NavLink, TabContent, TabPane, Nav, NavItem } from "reactstrap";
import classnames from 'classnames';
import DailyChart from "../charts/DailyChart";
import ConsoleLogs from '../console/ConsoleLogs'
import moment from 'moment'
import { subscribeData, unsubscribe } from '../socketio/client'


const createHours = () => {
  var arr = [], i;
  for (i = 0; i < 24; i++) {
    arr.push(i + ":00");
  }
  return arr;
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
        Timestamp: moment.utc(),
        Messages: JSON.stringify(data.sensor)
      });

      const currTime = moment.utc().local().format('HH:mm');

      //############# Voltage ###########
      if (!voltage_tmp.find(data => data.x === currTime)) {
        voltage_tmp.push({ x: currTime, y: data.sensor.voltage_usage });
        setVoltage([{
          id: "volts",
          color: "hsl(214, 70%, 50%)",
          data: voltage_tmp.length > 0 ? voltage_tmp : []
        }])   
      }


      //############# Current ###########
      if (!current_tmp.find(data => data.x === currTime)) {
        current_tmp.push({ x: currTime, y: data.sensor.current_usage });
        setCurrent([{
          id: "current",
          color: "hsl(214, 70%, 50%)",
          data: current_tmp.length > 0 ? current_tmp : []
        }])   
      }

      //############# Current ###########
      if (!power_tmp.find(data => data.x === currTime)) {
        power_tmp.push({ x: currTime, y: data.sensor.active_power });
        setPower([{
          id: "power",
          color: "hsl(214, 70%, 50%)",
          data: power_tmp.length > 0 ? power_tmp : []
        }])  
      }

      //############# Current ###########
      if (!energy_tmp.find(data => data.x === currTime)) {
        energy_tmp.push({ x: currTime, y: data.sensor.active_energy });
        setEnergy([{
          id: "energy",
          color: "hsl(214, 70%, 50%)",
          data: energy_tmp.length > 0 ? energy_tmp : []
        }])   
      }

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

  const reduceMessage = (limit: number, logs: any[], reverse = false) => {
    var totalRows = 0;
    (reverse ? logs.reverse() : logs).forEach((a: any, i: number) => {
      if (totalRows >= limit)
        logs.splice(i, 1);

      totalRows++;
    });
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
