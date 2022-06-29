/*
  Version:        2.0
  Design:         Jorge Castillo, Kevin Barba, Jerry Lucas
  Implementation: Jorge Castillo, Kevin Barba, Mona Ahwazi
*/
// Include custom class to operate MySignals
#include <MSPrint.h>

// Create Sensor object - contains all sensorial methods
MSPrint Sensor; 
// Initialize variables      
bool serial_available = true;
char data;

// Initializes program
void setup()
{
  Serial.begin(115200);
  // Initialze sensors
  Sensor.begin();
  Serial.println("Ready");
  Serial.flush();
}

// Loop to check if user input is available for sensor selection
void loop()
{
  // Checks if data is available from user (0-4)
  // 0 - SPO2
  // 1 - Temperature
  // 2 - Blood Pressure
  // 3 - Respiration
  // 4 - ECG
  if (Serial.available() && serial_available) {
    data = Serial.read();
    if (isDigit(data)) {
      serial_available = false;
      sensorData((int)data);
    }
  }
}

// this function get a reading from each sensor
void sensorData(int sensor){
  switch (sensor) {
    case '0': // SPO2
      // Get SPO2 values
      Sensor.pulsioximeter();
      // Release serial port for user
      serial_available = true;
      break;
    case '1': // Temperature
      // Get Temperature values
      Sensor.temperature();
      // Release serial port for user
      serial_available = true;
      break;
    case '2': // Blood Pressure
      // Get Blood Pressure values
      Sensor.bloodPressure();
      // Release serial port for user
      serial_available = true;
      break;
    case '3': // Respiration
      // Get Respiration values
      Sensor.respiration();
      serial_available = true;
      break;
    case '4': // ECG
      // Get ECG array
      Sensor.ECG();
      serial_available = true;
      break;
    default:
      Serial.println("No sensor");
      serial_available = true;
      break;
  }

}
