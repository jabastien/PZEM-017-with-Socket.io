#include <Arduino.h>
#include <time.h>
#include<WiFi.h>
#include <WiFiClientSecure.h>
#include "FirebaseESP32.h"
#include <SocketIOClient.h>
#include <ArduinoJson.h>
#include <string.h>
#include <cstdlib>
#define USE_SERIAL Serial


// config parameters
#define device_id "a21r7pxz"
#define ssid "MY-WIFI"
#define password "1234567890"
#define ServerHost "192.168.1.100"
#define ServerPort 4000
#define SocketIoChannel "ESP"

// Line config
#define LINE_TOKEN "__YOUR_LINE_TOKEN___"

// Firebase config
#define FIREBASE_HOST "xxxxxxxxxxxxx.firebaseio.com"
#define FIREBASE_KEY "____FIREBASE_KEY____"

// Config time
int timezone = 7;
char ntp_server1[20] = "ntp.ku.ac.th";
char ntp_server2[20] = "fw.eng.ku.ac.th";
char ntp_server3[20] = "time.uni.net.th";
int dst = 0;


IPAddress local_ip(192, 168, 137, 56);
IPAddress gateway(192, 168, 137, 1);
IPAddress subnet(255, 255, 255, 0);

WiFiServer server(80);
SocketIOClient socket;
FirebaseData firebaseData;
extern String RID;
extern String Rname;
extern String Rcontent;

int SW1 = 21;
int SW2 = 22;
int SW3 = 23;
int SW4 = 24;
int SW5 = 25;

void setup() {
  Serial.begin(115200);

  setup_Wifi();

  //  if (!socket.connect(ServerHost, ServerPort)) {
  //    Serial.println("connection failed");
  //  }
  //  if (socket.connected()) {
  //    socket.send("connection", "message", "Connected !!!!");
  //  }

  setupTimeZone();

  Firebase.begin(FIREBASE_HOST, FIREBASE_KEY);
  Firebase.reconnectWiFi(true);

  Firebase.setMaxRetry(firebaseData, 3);
  Firebase.setMaxErrorQueue(firebaseData, 30);
  Firebase.enableClassicRequest(firebaseData, true);
}

String output;
void loop() {

  //  if (!socket.connected()) {
  //    socket.connect(ServerHost, ServerPort);
  //    USE_SERIAL.println("Socket.io reconnecting...");
  //    delay(2000);
  //  }

  float voltage_usage  = random(2, 5);
  float current_usage = random(2, 5);
  float active_power = random(3, 6);
  float active_energy = random(2, 5);
  uint16_t over_power_alarm = 0;
  uint16_t lower_power_alarm = 1;

  String output;
  StaticJsonBuffer<512> jsonBuffer;
  JsonObject& root = jsonBuffer.createObject();
  root["deviceName"] = "ESP8266";
  root["deviceId"] = device_id;
  root["time"] = NowString();

  JsonArray& sensor = root.createNestedArray("sensor");
  JsonObject& data = jsonBuffer.createObject();
  data["voltage_usage"] = voltage_usage;
  data["current_usage"] = current_usage;
  data["active_power"] = active_power;
  data["active_energy"] = active_energy;
  data["over_power_alarm"] = over_power_alarm;
  data["lower_power_alarm"] = lower_power_alarm;
  sensor.add(data);
  root.prettyPrintTo(output);

  FirebaseJson ob;
  ob.setJsonData(output);

  if (Firebase.pushJSON(firebaseData, "/data",  ob)) {
    USE_SERIAL.println("Firebase push success");
  } else {
    USE_SERIAL.println(firebaseData.errorReason());
  }

  USE_SERIAL.println(output);


  //Shutdown Inverter on 15:00
  time_t now = time(nullptr);
  struct tm* p_tm = localtime(&now);
  if (p_tm->tm_hour == 7 && p_tm->tm_min == 0 && p_tm->tm_sec == 0) {

  }

  if (socket.monitor() && RID == SocketIoChannel && socket.connected()) {
    actionCommand(Rname, Rcontent, "", false);
  }

  delay(2000);
}

String header;
void httpServer() {
  WiFiClient client = server.available();
  if (client) {
    Serial.println("New Client.");
    String currentLine = "";
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        Serial.write(c);
        header += c;
        if (c == '\n') {
          // if the current line is blank, you got two newline characters in a row.
          // that's the end of the client HTTP request, so send a response:
          if (currentLine.length() == 0) {
            // HTTP headers always start with a response code (e.g. HTTP/1.1 200 OK)
            // and a content-type so the client knows what's coming, then a blank line:
            client.println("HTTP/1.1 200 OK");
            client.println("Content-type:text/html");
            client.println("Connection: close");
            client.println();

            // turns the GPIOs on and off
            if (header.indexOf("GET /26/on") >= 0) {
              Serial.println("GPIO 26 on");
              //output26State = "on";
              // digitalWrite(output26, HIGH);
            } else if (header.indexOf("GET /26/off") >= 0) {
              Serial.println("GPIO 26 off");
              // output26State = "off";
              // digitalWrite(output26, LOW);
            } else if (header.indexOf("GET /27/on") >= 0) {
              //Serial.println("GPIO 27 on");
              // output27State = "on";
              //digitalWrite(output27, HIGH);
            } else if (header.indexOf("GET /27/off") >= 0) {
              Serial.println("GPIO 27 off");
              // output27State = "off";
              // digitalWrite(output27, LOW);
            }

            // Display the HTML web page
            client.println("<!DOCTYPE html><html>");
            client.println("<head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
            client.println("<link rel=\"icon\" href=\"data:,\">");
            // CSS to style the on/off buttons
            // Feel free to change the background-color and font-size attributes to fit your preferences
            client.println("<style>html { font-family: Helvetica; display: inline-block; margin: 0px auto; text-align: center;}");
            client.println(".button { background-color: #4CAF50; border: none; color: white; padding: 16px 40px;");
            client.println("text-decoration: none; font-size: 30px; margin: 2px; cursor: pointer;}");
            client.println(".button2 {background-color: #555555;}</style></head>");

            // Web Page Heading
            client.println("<body><h1>ESP32 Web Server</h1>");

            // Display current state, and ON/OFF buttons for GPIO 26
            //client.println("<p>GPIO 26 - State " + output26State + "</p>");
            client.println("<p>GPIO 26 - State xxxxxxxxx</p>");
            // If the output26State is off, it displays the ON button
            // if (output26State == "off") {
            //   client.println("<p><a href=\"/26/on\"><button class=\"button\">ON</button></a></p>");
            //  } else {
            //   client.println("<p><a href=\"/26/off\"><button class=\"button button2\">OFF</button></a></p>");
            // }

            // Display current state, and ON/OFF buttons for GPIO 27
            //client.println("<p>GPIO 27 - State " + output27State + "</p>");
            // If the output27State is off, it displays the ON button
            // if (output27State == "off") {
            //   client.println("<p><a href=\"/27/on\"><button class=\"button\">ON</button></a></p>");
            // } else {
            //   client.println("<p><a href=\"/27/off\"><button class=\"button button2\">OFF</button></a></p>");
            // }
            client.println("</body></html>");

            // The HTTP response ends with another blank line
            client.println();
            break;
          } else {
            currentLine = "";
          }
        } else if (c != '\r') {
          currentLine += c;
        }
      }
    }
    // Clear the header variable
    header = "";
    // Close the connection
    client.stop();
    Serial.println("Client disconnected.");
    Serial.println("");
  }

}

void actionCommand(String action, String payload, String messageInfo, bool isAuto) {
  Serial.println("State => " + payload);
  if (action == "") return;

  String actionName = "";
  if (action == "SW1") {
    actionName = "TBE Inverter 4000w";
    digitalWrite(SW1, (payload == "state:on") ? LOW : HIGH);
  }

  if (action == "SW2") {
    actionName = "Lamp";
    digitalWrite(SW2, (payload == "state:on") ? LOW : HIGH);
  }

  if (action == "SW3") {
    actionName = "Waterfall Pump";
    digitalWrite(SW3, (payload == "state:on") ? LOW : HIGH);
  }

  if (action == "SW4") {
    actionName = "Water Sprinkler";
    digitalWrite(SW4, (payload == "state:on") ? LOW : HIGH);
  }

  if (actionName != "") {
    String relayStatus = (payload == "state:on") ? "เปิด" : "ปิด";
    String msq = (messageInfo != "") ? messageInfo : "";
    msq += "\r\n===============\r\n- Relay Switch Status -\r\n" + actionName + ": " + relayStatus;
    msq += (isAuto) ? " (Auto)" : " (Manual)";
    Line_Notify(msq);
    Serial.println("[" + actionName + "]: " + relayStatus);

    checkCurrentStatus(true);
  }
}

void checkCurrentStatus(bool sendLineNotify) {
  String output;

  //  StaticJsonDocument<1024> doc;
  //  doc["data"] = "ESP8266";
  //  doc["time"] = NowString();
  //
  //  //For Display on UI with socket.io
  //  JsonObject object = doc.createNestedObject("deviceState");
  //  object["SW1"] = String((digitalRead(SW1) == LOW) ? "ON" : "OFF");
  //  object["SW2"] = String((digitalRead(SW2) == LOW) ? "ON" : "OFF");
  //  object["SW3"] = String((digitalRead(SW3) == LOW) ? "ON" : "OFF");
  //  object["SW4"] = String((digitalRead(SW4) == LOW) ? "ON" : "OFF");
  //  serializeJson(doc, output);


  socket.sendJSON(SocketIoChannel, output);

  if (sendLineNotify) {
    //Send to Line Notify
    String status = "\r\nRelay Switch Status";
    status += "\r\nTBE Inverter 4000w: " + String((digitalRead(SW1) == LOW) ? "เปิด" : "ปิด");
    status += "\r\nLamp: " + String((digitalRead(SW2) == LOW) ? "เปิด" : "ปิด");
    status += "\r\nWaterfall Pump: " + String((digitalRead(SW3) == LOW) ? "เปิด" : "ปิด");
    status += "\r\nWater Sprinkler: " + String((digitalRead(SW4) == LOW) ? "เปิด" : "ปิด");
    Line_Notify(status);
  }
}

void setup_Wifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  if (WiFi.getMode() & WIFI_AP) {
    WiFi.softAPdisconnect(true);
  }

  USE_SERIAL.println();
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  USE_SERIAL.println();
  USE_SERIAL.print("WIFI Connected ");
  String ip = WiFi.localIP().toString();    USE_SERIAL.println(ip.c_str());
  USE_SERIAL.println("Socket.io Server: "); USE_SERIAL.print(ServerHost);
  USE_SERIAL.println();
}

void Line_Notify(String message) {
  WiFiClientSecure client;
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

void setupTimeZone() {

  configTime(timezone * 3600, dst, ntp_server1, ntp_server2, ntp_server3);

  USE_SERIAL.println("Waiting for time");
  while (!time(nullptr)) {
    USE_SERIAL.print(".");
    delay(500);
  }
  USE_SERIAL.println();
  USE_SERIAL.println("Now: " + NowString());
}
