#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <SocketIOClient.h>
#include <ArduinoJson.h>
#include <Hash.h>

#include <ModbusMaster.h>
#include <SoftwareSerial.h>
#define USE_SERIAL Serial

const char* device_id = "e49n2dix";


// WiFi parameters
const char* ssid = "X-WIFI";
const char* password = "giffyhackman";
char* IpAddress = "192.168.137.17";
const int ServerPort = 4000;


SocketIOClient client;
SoftwareSerial pzemSerial(D3, D2); //rx, tx
ModbusMaster node;

/*
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


//Indicates that the master needs to read 8 registers with slave address 0x01 and the start address of the register is 0x0000.
static uint8_t pzemSlaveAddr = 0x01; // PZEM default address
#define LEDPIN 16

void setup() {
  pzemSerial.begin(9600);
  USE_SERIAL.begin(115200); //For debug on cosole (PC)
  //resetEnergy(pzemSlaveAddr);
  node.begin(pzemSlaveAddr, pzemSerial);
  pinMode(16, OUTPUT);
  digitalWrite(LEDPIN, 0);

  resetEnergy(pzemSlaveAddr);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  if (WiFi.getMode() & WIFI_AP) {
    WiFi.softAPdisconnect(true);
  }

  USE_SERIAL.println();
  USE_SERIAL.println("Connecting wifi network");
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  setup_IpAddress();

  USE_SERIAL.println();
  USE_SERIAL.print("WIFI Connected ");
  String ip = WiFi.localIP().toString();
  USE_SERIAL.println(ip.c_str());
  USE_SERIAL.println("Socket.io Server: "); USE_SERIAL.print(IpAddress);
  USE_SERIAL.println();

  if (!client.connect(IpAddress, ServerPort)) {
    Serial.println("connection failed");
  }
  if (client.connected()) {
    client.send("connection", "message", "Connected !!!!");
  }
}

void loop() {
  uint8_t result;
  digitalWrite(LEDPIN, 1);

  //Indicates that the master needs to read 8 registers with slave address 0x01 and the start address of the register is 0x0000.
  result = node.readInputRegisters(0x0000, 8); //read the 8 registers of the PZEM-017
  digitalWrite(LEDPIN, 0);

  // if (result == node.ku8MBSuccess)
  if (true)
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


    float voltage_usage = (float)node.getResponseBuffer(0x0000) / 100.0f;
    float current_usage = (float)node.getResponseBuffer(0x0001) / 1000.000f;

    tempdouble =  (node.getResponseBuffer(0x0003) << 16) + node.getResponseBuffer(0x0002);
    float active_power = tempdouble / 100.0f;

    tempdouble =  (node.getResponseBuffer(0x0005) << 16) + node.getResponseBuffer(0x0004);
    float active_energy = tempdouble;

    uint16_t over_power_alarm = node.getResponseBuffer(0x0006);
    uint16_t lower_power_alarm = node.getResponseBuffer(0x0007);

    USE_SERIAL.print("VOLTAGE:           ");   USE_SERIAL.print(voltage_usage);       USE_SERIAL.println(" V");   // V
    USE_SERIAL.print("CURRENT_USAGE:     ");   USE_SERIAL.print(current_usage, 3);    USE_SERIAL.println(" A");   // A
    USE_SERIAL.print("ACTIVE_POWER:      ");   USE_SERIAL.print(active_power, 3);     USE_SERIAL.println(" W");   // W
    USE_SERIAL.print("ACTIVE_ENERGY:     ");   USE_SERIAL.print(active_energy, 3);    USE_SERIAL.println(" Wh");  //Kwh
    USE_SERIAL.print("OVER_POWER_ALARM:  ");   USE_SERIAL.println(over_power_alarm);
    USE_SERIAL.println("====================================================");

    uint64_t now = millis();
    StaticJsonDocument<1024> doc;
    doc["data"] = "ESP8266";
    doc["version"] = "v1.0";
    doc["time"] = now;

    JsonObject object = doc.createNestedObject("sensor");
    //    object["voltage_usage"] = voltage_usage;
    //    object["current_usage"] = current_usage;
    //    object["active_power"] = active_power;
    //    object["active_energy"] = active_energy;
    //    object["over_power_alarm"] = over_power_alarm;
    //    object["lower_power_alarm"] = lower_power_alarm;

    object["voltage_usage"] = random(2,5);
    object["current_usage"] = random(2,5);
    object["active_power"] = random(3,6);
    object["active_energy"] = random(2,5);
    object["over_power_alarm"] = 0;
    object["lower_power_alarm"] = 1;

    //JsonArray alarm = object.createNestedArray("alarm");
    //    alarm.add(48.756080);
    //    alarm.add(2.302038);

    String output;
    serializeJson(doc, output);

    //client.send("ESP", "message", "ddddddddddddd");
    client.sendJSON("ESP", output);


    USE_SERIAL.print(output);
  } else {
    USE_SERIAL.println("Failed to read modbus");
  }

  if (!client.connected()) {
    client.connect(IpAddress, ServerPort);

    USE_SERIAL.print("Reconnecting...");
    delay(2000);
  }


  delay(2000);
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


void setup_IpAddress() {
  IPAddress local_ip = {192, 168, 137, 144};
  IPAddress gateway = {192, 168, 137, 1};
  IPAddress subnet = {255, 255, 255, 0};
  WiFi.config(local_ip, gateway, subnet);
}
