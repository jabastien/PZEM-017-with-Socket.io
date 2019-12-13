/*
  FOR Sensor PZEM-017
  D3 : RX
  D4 : TX

  FOR OLED DISPLAY
  D1 : SCK
  D2 : SDA

  Relay Switch
  D5
  D6
  D7
  D8
  D9

  Note: For Relay switch i am using active "Low"

  RegAddr Description                 Resolution
  0x0000  Voltage value               1LSB correspond to 0.01V
  0x0001  Current value low 16 bits   1LSB correspond to 0.01A
  0x0002  Power value low 16 bits     1LSB correspond to 0.1W
  0x0003  Power value high 16 bits    1LSB correspond to 0.1W
  0x0004  Energy value low 16 bits    1LSB correspond to 1Wh
  0x0005  Energy value high 16 bits   1LSB correspond to 1Wh
  0x0006  High voltage alarm          0xFFF is alarm, 0x0000 is not alarm
  0x0007  Low voltage alarm           0xFFF is alarm, 0x0000 is not alarm

  Read and modify the slave parameters
  - At present,it only supports reading and modifying slave address and power alarm threshold
  The register is arranged as the following table

  0x0000  High voltage alarm threshold (5~350V) ,default is 300V        1LSB correspond to 0.01V
  0x0001  Low voltage alarm threshold（1~350V）,default is 7V            1LSB correspond to 0.01V
  0x0002  Modbus-RTU address                                            The range is 0x0001~0x00F7
  0x0003  The current range(only for PZEM-017)                          0x0000：100A
                                                                        0x0001：50A
                                                                        0x0002: 200A
                                                                        0x0003：300A

  Ref: http://solar4living.com/pzem-arduino-modbus.htm
  Ref: https://github.com/armtronix/Wifi-Single-Dimmer-Board/blob/ba577f0539a1fc73145e24bb50342eb1dca86594/Wifi-Single-Dimmer-Board/Arduino_Code/Wifi_single_dimmer_tasmota/sonoff_betaV0.3/xnrg_06_pzem_dc.ino
  Ref: https://github.com/EvertDekker/Pzem016Test/blob/e95c1e6bb2d384a93910be2c8b867e40669a24b4/Pzem016Test.ino
  Ref: https://github.com/Links2004/arduinoWebSockets/blob/master/examples/esp8266/WebSocketClientSocketIO/WebSocketClientSocketIO.ino
  Ref: https://github.com/washo4evr/Socket.io-v1.x-Library/blob/master/SocketIOClient.h

  Fix complile issue
  https://github.com/esp8266/Arduino/commit/b71872ccca14c410a19371ed6a4838dbaa67e62b

*/


#include <Arduino.h>
#include <ESP8266WiFi.h>

#include <time.h>
#include <WiFiClientSecureAxTLS.h>
#include <ESP8266WebServer.h>

#include <Wire.h>
#include <ACROBOTIC_SSD1306.h>

#include <SocketIOClient.h>
#include <ArduinoJson.h>
#include <Hash.h>
#include <string.h>
#include <ModbusMaster.h>
#include <SoftwareSerial.h>
#define USE_SERIAL Serial

// config parameters
#define device_id "e49n2dix"
#define ssid "X-WIFI"
#define password "12345678"
#define ServerHost "192.168.137.101"
#define ServerPort 4000
#define SocketIoChannel "ESP"

// Line config
#define LINE_TOKEN "N0efytMxCMsZETa4__TEST"

// Config time
int timezone = 7;
char ntp_server1[20] = "ntp.ku.ac.th";
char ntp_server2[20] = "fw.eng.ku.ac.th";
char ntp_server3[20] = "time.uni.net.th";



float activeVoltageInverter = 13.4;
float inActiveVoltageInverter = 12.15;

SocketIOClient socket;
SoftwareSerial pzemSerial(D3, D4); //rx, tx
ModbusMaster modbus;
ESP8266WebServer server(80);

extern String RID;
extern String Rname;
extern String Rcontent;

//Indicates that the master needs to read 8 registers with slave address 0x01 and the start address of the register is 0x0000.
static uint8_t pzemSlaveAddr = 0x01; // PZEM default address
#define LEDPIN 16
int SW1 = D5;
int SW2 = D6;
int SW3 = D7;
int SW4 = D8;
int SW5 = D9;

void setup() {

  // OLED Display
  InitialOLED();

  pzemSerial.begin(9600);
  USE_SERIAL.begin(115200); //For debug on cosole (PC)
  //resetEnergy(pzemSlaveAddr);
  modbus.begin(pzemSlaveAddr, pzemSerial);
  //  pinMode(16, OUTPUT);
  //  digitalWrite(LEDPIN, LOW);

  resetEnergy(pzemSlaveAddr);

  setup_Wifi();

  if (!socket.connect(ServerHost, ServerPort)) {
    Serial.println("connection failed");
  }
  if (socket.connected()) {
    socket.send("connection", "message", "Connected !!!!");
  }

  handleRelaySwitch();
}

bool inverterStarted  = false;
void loop() {
  uint8_t result;
  //digitalWrite(LEDPIN, HIGH);

  //Web server
  server.handleClient();

  //Indicates that the master needs to read 8 registers with slave address 0x01 and the start address of the register is 0x0000.
  result = modbus.readInputRegisters(0x0000, 8); //read the 8 registers of the PZEM-017
  //digitalWrite(LEDPIN, LOW);

  oled.setTextXY(2, 1);
  oled.putString("- S1:" + String((digitalRead(SW1) == LOW) ? "ON" : "OFF") + " S2:" + String((digitalRead(SW2) == LOW) ? "ON" : "OFF") + " S3:" + String((digitalRead(SW3) == LOW) ? "ON" : "OFF") + " -");

  if (result == modbus.ku8MBSuccess)
  {
    uint32_t tempdouble = 0x00000000;

    //    float voltage = (float)node.getResponseBuffer(0x0000) / 100.0;
    //    float current = (float)node.getResponseBuffer(0x0001) / 10000.0f;
    //
    //    tempdouble |= node.getResponseBuffer(0x0002);       //LowByte
    //    tempdouble |= node.getResponseBuffer(0x0003) << 8;  //highByte
    //    float power = tempdouble / 10.0f;
    //
    //    tempdouble = node.getResponseBuffer(0x0004);       //LowByte
    //    tempdouble |= node.getResponseBuffer(0x0005) << 8;  //highByte
    //    float energy = tempdouble / 1000.0f;

    //Real
    float voltage_usage = (float)modbus.getResponseBuffer(0x0000) / 100.0f;
    float current_usage = (float)modbus.getResponseBuffer(0x0001) / 1000.000f;

    tempdouble =  (modbus.getResponseBuffer(0x0003) << 16) + modbus.getResponseBuffer(0x0002);
    float active_power = tempdouble / 100.0f;

    tempdouble =  (modbus.getResponseBuffer(0x0005) << 16) + modbus.getResponseBuffer(0x0004);
    float active_energy = tempdouble;

    uint16_t over_power_alarm = modbus.getResponseBuffer(0x0006);
    uint16_t lower_power_alarm = modbus.getResponseBuffer(0x0007);


    //    // For test offline mode
    //    float voltage_usage  = random(2, 5);
    //    float current_usage = random(2, 5);
    //    float active_power = random(3, 6);
    //    float active_energy = random(2, 5);
    //    uint16_t over_power_alarm = 0;
    //    uint16_t lower_power_alarm = 1;

    //    USE_SERIAL.print("VOLTAGE:           ");   USE_SERIAL.print(voltage_usage);       USE_SERIAL.println(" V");   // V
    //    USE_SERIAL.print("CURRENT_USAGE:     ");   USE_SERIAL.print(current_usage, 3);    USE_SERIAL.println(" A");   // A
    //    USE_SERIAL.print("ACTIVE_POWER:      ");   USE_SERIAL.print(active_power, 3);     USE_SERIAL.println(" W");   // W
    //    USE_SERIAL.print("ACTIVE_ENERGY:     ");   USE_SERIAL.print(active_energy, 3);    USE_SERIAL.println(" Wh");  // Kwh
    //    USE_SERIAL.print("OVER_POWER_ALARM:  ");   USE_SERIAL.println(over_power_alarm);
    //    USE_SERIAL.println("====================================================");

    //Build Messages For Line Notify
    String batteryStatusMessage = "\r\n===============\r\n - Battery Status - \r\n";
    batteryStatusMessage += "VOLTAGE: " + String(voltage_usage) + "V\r\n";
    batteryStatusMessage += "CURRENT: " + String(current_usage) + "A\r\n";
    batteryStatusMessage += "POWER: " + String(active_power) + "W\r\n";
    batteryStatusMessage += "ENERGY: " + String(active_energy) + "WH";

    bool activeInverter = (voltage_usage >= activeVoltageInverter) ? true : (voltage_usage <= inActiveVoltageInverter) ? false : inverterStarted;
    if (inverterStarted != activeInverter) {
      actionCommand("SW1", activeInverter ? "state:on" : "state:off", batteryStatusMessage);
      inverterStarted = activeInverter;
      USE_SERIAL.println("inverterStarted: " + String(inverterStarted) + " activeInverter:" + String(activeInverter));
    }

    createResponse(voltage_usage, current_usage, active_power, active_energy, over_power_alarm, lower_power_alarm, true);
  } else {
    clearMessage();
    printMessage(4, 1, "ERROR !!", false);
    printMessage(5, 1, "Failed to read modbus", true);
    createResponse(0, 0, 0, 0, 0, 0, false);
  }

  if (!socket.connected()) {
    socket.connect(ServerHost, ServerPort);
    clearMessage();
    printMessage(4, 1, "Socket.io reconnecting...", false);
    delay(2000);
  }

  if (socket.monitor() && RID == SocketIoChannel && Rname.indexOf("SW") != -1) {
    actionCommand(Rname, Rcontent, "");
  }

  delay(2000);
}

String createResponse(float voltage_usage, float current_usage, float active_power, float active_energy, uint16_t over_power_alarm, uint16_t lower_power_alarm, bool isOledPrint) {
  uint64_t now = millis();
  StaticJsonDocument<1024> doc;
  doc["data"] = "ESP8266";
  doc["time"] = NowString();

  JsonObject object = doc.createNestedObject("sensor");
  object["voltage_usage"] = voltage_usage;
  object["current_usage"] = current_usage;
  object["active_power"] = active_power;
  object["active_energy"] = active_energy;
  object["over_power_alarm"] = over_power_alarm;
  object["lower_power_alarm"] = lower_power_alarm;

  if (isOledPrint) {
    static char outstr[15];
    oled.setTextXY(4, 1);
    oled.putString("Voltage :" + String(dtostrf(voltage_usage, 7, 2, outstr)) + "  V");

    oled.setTextXY(5, 1);
    oled.putString("Current : " + String(dtostrf(current_usage, 7, 3, outstr))  + " A");

    oled.setTextXY(6, 1);
    oled.putString("Power   : " + String(dtostrf(active_power, 7, 3, outstr)) + " W");

    oled.setTextXY(7, 1);
    oled.putString("Energy  : " + String(dtostrf(active_energy, 7, 3, outstr)) + " Wh");
  }

  //JsonArray alarm = object.createNestedArray("alarm");
  //    alarm.add(48.756080);
  //    alarm.add(2.302038);

  String output;
  serializeJson(doc, output);

  //socket.send(SocketIoChannel, "message", "ddddddddddddd");
  socket.sendJSON(SocketIoChannel, output);

  USE_SERIAL.print(output);
}


void actionCommand(String switchName, String payload, String messageInfo) {
  Serial.println("State => " + payload);
  if (switchName == "") return;

  if (switchName == "SW1") //Inverter
    digitalWrite(SW1, (payload == "state:on") ? LOW : HIGH);

  if (switchName == "SW2") {
    digitalWrite(SW2, (payload == "state:on") ? LOW : HIGH);
  }

  if (switchName == "SW3")
    digitalWrite(SW3, (payload == "state:on") ? LOW : HIGH);

  if (switchName == "SW4")
    digitalWrite(SW4, (payload == "state:on") ? LOW : HIGH);

  if (switchName == "SW5")
    digitalWrite(SW5, (payload == "state:on") ? LOW : HIGH);

  if (switchName == "checking")
    Line_Notify(deviceInfo());

  String relayStatus = (payload == "state:on") ? "ON" : "OFF";
  String msq = (messageInfo != "") ? messageInfo : "";
  msq += "\r\n===============\r\n- Relay Switch Status -\r\n" + switchName + ":" + relayStatus;
  Line_Notify(msq);

  Serial.println("[" + switchName + "]: " + relayStatus);
}

String deviceInfo() {
  String status = "\r\nRelay Switch Status";
  status += "\r\nSW1:" + String((digitalRead(SW1) == LOW) ? "ON" : "OFF");
  status += "\r\nSW2:" + String((digitalRead(SW2) == LOW) ? "ON" : "OFF");
  status += "\r\nSW3:" + String((digitalRead(SW3) == LOW) ? "ON" : "OFF");
  status += "\r\nSW4:" + String((digitalRead(SW4) == LOW) ? "ON" : "OFF");
  status += "\r\nSW5:" + String((digitalRead(SW5) == LOW) ? "ON" : "OFF");
  return status;
}

void printMessage(int X, int Y, String message, bool isPrintLn) {
  oled.setTextXY(X, Y);
  oled.putString(message);
  if (isPrintLn)
    USE_SERIAL.println(message);
  else
    USE_SERIAL.print(message);
}

void clearMessage() {
  for (int i = 4; i < 8; i++) {
    oled.setTextXY(i, 1);
    oled.putString("                              ");
  }
}

void resetEnergy(uint8_t slaveAddr) {
  //The command to reset the slave's energy is (total 4 bytes):
  //Slave address + 0x42 + CRC check high byte + CRC check low byte.
  uint16_t u16CRC = 0xFFFF;
  static uint8_t resetCommand = 0x42;
  u16CRC = crc16_update(u16CRC, slaveAddr);
  u16CRC = crc16_update(u16CRC, resetCommand);
  USE_SERIAL.println("Resetting Energy");
  pzemSerial.write(slaveAddr);
  pzemSerial.write(resetCommand);
  pzemSerial.write(lowByte(u16CRC));
  pzemSerial.write(highByte(u16CRC));
  delay(1000);
}

void changeAddress(uint8_t OldslaveAddr, uint8_t NewslaveAddr)
{
  static uint8_t SlaveParameter = 0x06;
  static uint16_t registerAddress = 0x0003; // Register address to be changed
  uint16_t u16CRC = 0xFFFF;
  u16CRC = crc16_update(u16CRC, OldslaveAddr);
  u16CRC = crc16_update(u16CRC, SlaveParameter);
  u16CRC = crc16_update(u16CRC, highByte(registerAddress));
  u16CRC = crc16_update(u16CRC, lowByte(registerAddress));
  u16CRC = crc16_update(u16CRC, highByte(NewslaveAddr));
  u16CRC = crc16_update(u16CRC, lowByte(NewslaveAddr));

  USE_SERIAL.println("Changing Slave Address");

  pzemSerial.write(OldslaveAddr);
  pzemSerial.write(SlaveParameter);
  pzemSerial.write(highByte(registerAddress));
  pzemSerial.write(lowByte(registerAddress));
  pzemSerial.write(highByte(NewslaveAddr));
  pzemSerial.write(lowByte(NewslaveAddr));
  pzemSerial.write(lowByte(u16CRC));
  pzemSerial.write(highByte(u16CRC));
  delay(1000);
}

void setup_Wifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  if (WiFi.getMode() & WIFI_AP) {
    WiFi.softAPdisconnect(true);
  }

  USE_SERIAL.println();
  printMessage(0, 1, "WIFI Connecting...", true);
  oled.setTextXY(1, 1);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
    oled.putString(".");
  }

  //setup_IpAddress();

  oled.clearDisplay();

  USE_SERIAL.println();
  USE_SERIAL.print("WIFI Connected ");
  String ip = WiFi.localIP().toString();    USE_SERIAL.println(ip.c_str());
  USE_SERIAL.println("Socket.io Server: "); USE_SERIAL.print(ServerHost);
  USE_SERIAL.println();

  oled.setTextXY(0, 1); oled.putString("IP Addr : " + ip);
  oled.setTextXY(1, 1); oled.putString("Server  : " + String(ServerHost));
}

void setup_IpAddress() {
  IPAddress local_ip = {192, 168, 137, 144};
  IPAddress gateway = {192, 168, 137, 1};
  IPAddress subnet = {255, 255, 255, 0};
  WiFi.config(local_ip, gateway, subnet);
}

void InitialOLED() {
  Wire.begin();
  oled.init();                      // Initialze SSD1306 OLED display
  //oled.setInverseDisplay();
  oled.deactivateScroll();
  oled.clearDisplay();              // Clear screen
  oled.setFont(font5x7);
  //oled.setFont(font8x8);

  for (int i = 0; i < 8; i++) {
    oled.setTextXY(i, 1);
    oled.putString("                              ");
  }
}


void Line_Notify(String message) {
  axTLS::WiFiClientSecure client;
  if (!client.connect("notify-api.line.me", 443)) {
    Serial.println("connection failed");
    return;
  }

  String req = "";
  req += "POST /api/notify HTTP/1.1\r\n";
  req += "Host: notify-api.line.me\r\n";
  req += "Authorization: Bearer " + String(LINE_TOKEN) + "\r\n";
  req += "Cache-Control: no-cache\r\n";
  req += "User-Agent: ESP8266\r\n";
  req += "Content-Type: application/x-www-form-urlencoded\r\n";
  req += "Content-Length: " + String(String("message=" + message).length()) + "\r\n";
  req += "\r\n";
  req += "message=" + message;
  Serial.println(req);
  client.print(req);
  delay(20);

  Serial.println("-------------");
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") {
      break;
    }
    Serial.println(line);
  }
  Serial.println("-------------");
}

void handleRoot() {
  String cmd;
  cmd += "<!DOCTYPE HTML>\r\n";
  cmd += "<html>\r\n";
  cmd += "<head>";
  cmd += "<meta http-equiv='refresh' content='5'/>";
  cmd += "</head>";

  cmd += (digitalRead(SW1) == LOW) ? "<br/>SW1  : ON" : "<br/>SW1  : OFF";
  cmd += (digitalRead(SW2) == LOW) ? "<br/>SW2  : ON" : "<br/>SW2  : OFF";
  cmd += (digitalRead(SW3) == LOW) ? "<br/>SW3  : ON" : "<br/>SW3  : OFF";
  cmd += (digitalRead(SW4) == LOW) ? "<br/>SW4  : ON" : "<br/>SW4  : OFF";
  cmd += (digitalRead(SW5) == LOW) ? "<br/>SW5  : ON" : "<br/>SW5  : OFF";

  cmd += "<html>\r\n";
  server.send(200, "text/html", cmd);
}

void handleRelaySwitch() {

  pinMode(SW1, OUTPUT); digitalWrite(SW1, HIGH);
  pinMode(SW2, OUTPUT); digitalWrite(SW2, HIGH);
  pinMode(SW3, OUTPUT); digitalWrite(SW3, HIGH);
  pinMode(SW4, OUTPUT); digitalWrite(SW4, HIGH);
  pinMode(SW5, OUTPUT); digitalWrite(SW5, HIGH);

  server.on("/", handleRoot);
  server.on("/sw1=1", []() {
    server.send(200, "text/plain", "SW1 = ON"); digitalWrite(SW1, LOW);
  });

  server.on("/sw1=0", []() {
    server.send(200, "text/plain", "SW1 = OFF");  digitalWrite(SW1, HIGH);
  });

  server.on("/sw2=1", []() {
    server.send(200, "text/plain", "SW2 = ON"); digitalWrite(SW2, LOW);
  });

  server.on("/sw2=0", []() {
    server.send(200, "text/plain", "SW2 = OFF");  digitalWrite(SW2, HIGH);
  });

  server.on("/sw3=1", []() {
    server.send(200, "text/plain", "SW3 = ON"); digitalWrite(SW3, LOW);
  });

  server.on("/sw3=0", []() {
    server.send(200, "text/plain", "SW3 = OFF");  digitalWrite(SW3, HIGH);
  });

  server.on("/sw4=1", []() {
    server.send(200, "text/plain", "SW4 = ON"); digitalWrite(SW4, LOW);
  });

  server.on("/sw4=0", []() {
    server.send(200, "text/plain", "SW4 = OFF");  digitalWrite(SW4, HIGH);
  });

  server.on("/sw5=1", []() {
    server.send(200, "text/plain", "SW5 = ON"); digitalWrite(SW5, LOW);
  });

  server.on("/sw5=0", []() {
    server.send(200, "text/plain", "SW5 = OFF");  digitalWrite(SW5, HIGH);
  });

  server.onNotFound(handleNotFound);
  server.begin();
  Serial.println("HTTP server started");
}

void handleNotFound() {
  String message = "File Not Found\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  for (uint8_t i = 0; i < server.args(); i++) {
    message += " " + server.argName(i) + ": " + server.arg(i) + "\n";
  }
  server.send(404, "text/plain", message);
}

String NowString() {
  time_t now = time(nullptr);
  struct tm* newtime = localtime(&now);

  String tmpNow = "";
  tmpNow += String(newtime->tm_hour);
  tmpNow += ":";
  tmpNow += String(newtime->tm_min);
  tmpNow += ":";
  tmpNow += String(newtime->tm_sec);
  return tmpNow;
}
