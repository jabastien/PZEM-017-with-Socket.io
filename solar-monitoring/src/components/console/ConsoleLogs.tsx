import React from 'react'
import { Row, Col, NavLink, TabContent, TabPane, Nav, NavItem } from "reactstrap";
import classnames from 'classnames';
//import spinnerIcon from '../../assets/images/icon/spinner-preloader.gif';
import './console.css';

interface ConsoleLogProps {
    subscribData: any[]
}

const ConsoleLogs = (props: ConsoleLogProps) => {

    return (<div className="card-container-reflux">
        {
            <>
            <Nav tabs>
                <NavItem>
                    <NavLink
                        className={classnames({ active: true })}
                       
                    >
                        Console Logs
                  </NavLink>
                </NavItem>
            </Nav>

            <TabContent activeTab="1">
                <TabPane tabId="1">
                    <Row>
                        <Col sm="12">
                            {/* <Avatar size="small" src={spinnerIcon} /> */}
                            <div id="logs" className="terminal">
                                <ul>
                                    {

                                        props.subscribData.map((data: any, index: number) => {
                                            let classType = "orange logtype-" + data.LogLevelType.toLowerCase();
                                            return (<li key={index}>
                                                <span className="white">{new Date(data.Timestamp).toLocaleString()}</span>
                                                <span className={classType}> [{data.LogLevelType === 'Information' ? 'Info' : data.LogLevelType}] </span>
                                                <span> {data.Messages}</span>
                                            </li>)
                                        })

                                    }
                                </ul>
                            </div>
                        </Col>
                    </Row>
                </TabPane>
            </TabContent>
</>
        }
    </div>)
}

export default ConsoleLogs;