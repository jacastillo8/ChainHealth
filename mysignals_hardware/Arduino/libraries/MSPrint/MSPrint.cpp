/*
  Version:        2.0.0
  Design:         Jorge Castillo, Jerry Lucas
  Implementation: Jorge Castillo, Kevin Barba
*/
#include "MSPrint.h"

//!******************************************************************************
//!   Name: MSPrint Class                                                      *
//!   Description: Constructor of the sensor class                              *
//!******************************************************************************
MSPrint::MSPrint() {
  // Empty constructor - Called via begin method
}

//!******************************************************************************
//!   Name: begin()                           
//!   Description: Initializes MySignals Hardware
//!   Param : void             
//!   Returns: void                          
//!   Example: MSPrint.begin();                   
//!******************************************************************************
void MSPrint::begin() {
  // Start and initialize the MySignals HW 2.0
  MySignals.begin();
  MySignals.initSensorUART();
}

//!******************************************************************************
//!   Name: temperature()                           
//!   Description: Prints Temperature sensor value into the serial port after 3s
//!   Param : void             
//!   Returns: void                          
//!   Example: MSPrint.temperature();                   
//!******************************************************************************
void MSPrint::temperature(){
  // Initialize variables
  uint8_t count = 1;
  float temp = 0;

  // Set baudrate for external communications
  Serial.begin(115200);
  // Get 3 measurements (once every second)
  while (count <= 2) {
    temp += MySignals.getTemperature();
    delay(1000);
    count ++;
  }
  // Average Results in Fahrenheit
  temp = ((temp / count) * 9 / 5) + 32;
  // Print into serial port
  Serial.print("Temp/");
  Serial.println(temp);
  Serial.flush();
  // Send terminate message 
  Serial.println("DONE");
  Serial.flush();
}

//!******************************************************************************
//!   Name: pulsioximeter()                           
//!   Description: Prints SPO2 sensor value into the serial port 
//!   Param : void            
//!   Returns: void                          
//!   Example: MSPrint.pulsioximeter();                   
//!******************************************************************************
void MSPrint::pulsioximeter(){
  // Initialize variables
  bool status = false;
  String data = "";
  uint8_t counter = 0;
  uint8_t exit = 0;

  // Loop every 2s until sensor becomes available
  while (status == false && exit < 10) {
    // Check which SPO2 sensor is in use (Mini == 2 or Micro == 1)
    uint8_t sensor = MySignals.getStatusPulsioximeterGeneral();

    if(sensor == 1){
      // Loop if sensor is online, wait 5s for adjusted data
      while (counter <= 4) {
        // Data availability
        uint8_t data_avail = MySignals.getPulsioximeterMicro();

        if(data_avail == 1) {
          status = true;
          data = "SPO2/";
          data = data + String(MySignals.pulsioximeterData.BPM);
          data = data + ",";
          data = data + String(MySignals.pulsioximeterData.O2);
          counter++;
          delay(1000);
        } else if (data_avail == 2){
          //data is Ignored - "FingerOut"
          status = false;
        } 
        if (status == false) {
          break;
        }
      }
    } else if(sensor == 2) {
        // Loop if sensor is online, wait 5s for adjusted data
        while (counter <= 4) {
          // Data availability
          uint8_t data_avail = MySignals.getPulsioximeterMini();

          if(data_avail == 1){
            status = true;
            data = "SPO2/";
            data = data + String(MySignals.pulsioximeterData.BPM);
            data = data + ",";
            data = data + String(MySignals.pulsioximeterData.O2);
            counter++;
            delay(1000);
          } else if (data_avail == 2){
            //data is Ignored - "FingerOut"
            status = false;
          } 
          // Check sensor status if unsuccessful - exit intermediate loop
          if (status == false) {
            break;
          }
        }
    } else {
      //data is Ignored - "No Sensor available"
      status = false;
    }

    // Disable UART - Sensor will send continuous data if enabled
    MySignals.disableSensorUART();
    // Print empty string
    Serial.println();
    exit++; // Increase counter for exit due to unavailability
    delay(2000);
  }
  
  // Check exit condition and display new message
  if (exit == 10) {
    data = "SPO2/NA";
  }

  // Set baudrate for external communications
  Serial.begin(115200);
  Serial.println(data);
  Serial.flush();
  // Send terminate message 
  Serial.println("DONE");
  Serial.flush();
}

//!******************************************************************************
//!   Name: bloodPressure()                           
//!   Description: Prints Blood Pressure sensor value into the serial port 
//!   Param : void            
//!   Returns: void                          
//!   Example: MSPrint.bloodPressure();                   
//!******************************************************************************
void MSPrint::bloodPressure(){
  // Initialize variables
  bool status = false;
  String data = "";
  uint8_t exit = 0;

  // Loop every 2s until sensor becomes available
  while (status == false && exit < 10) {

    // Enable BP sensor
    MySignals.enableSensorUART(BLOODPRESSURE);

    // Check BP status
    if (MySignals.getStatusBP() == 1) {
      delay(1000);
      if (MySignals.getBloodPressure() == 1) {
        status = true;
        data = "BP/";
        data = data + String(MySignals.bloodPressureData.diastolic);
        data = data + ",";
        data = data + String(MySignals.bloodPressureData.systolic);
        data = data + ",";
        data = data + String(MySignals.bloodPressureData.pulse);
      } else {
        status = false;
        exit++; // Increase counter for exit due to unavailability
      }
    } else {
      status = false;
      exit++; // Increase counter for exit due to unavailability
    }

    // Disable UART - Sensor will freeze if enabled
    MySignals.disableSensorUART();
    // Print empty string and wait
    Serial.println();
    delay(2000);
  }

  // Check exit condition and display new message
  if (exit == 10) {
    data = "BP/NA";
  }

  // Set baudrate for external communications
  Serial.begin(115200);
  Serial.println();
  Serial.println(data);
  Serial.flush();
  // Send terminate message 
  Serial.println("DONE");
  Serial.flush();
}

//!******************************************************************************
//!   Name: respiration()                           
//!   Description: Prints number of respirations in 20s interval into the serial port 
//!   Param : void            
//!   Returns: void                          
//!   Example: MSPrint.respiration();                   
//!******************************************************************************
void MSPrint::respiration(){
  // Initialized variables
  int respirations = 0;

  // Start timer
  uint32_t start_time = millis();

  // Get number of respirations for 30s
  while ((millis() - start_time) <= 30000) {
    // Checking conditions
    if (MySignals.getAirflow(VOLTAGE) >= 1.5) {
      while ((millis() - start_time) <= 30000) {
        if (MySignals.getAirflow(VOLTAGE) < 0.1) {
          respirations++;
          break;
        }
        delay(100);
      }
    }
    delay(100);
  }
  
  // Get number of respirations per minute
  respirations = respirations * 2;

  // Set baudrate for external communications
  Serial.begin(115200);
  Serial.print("Resp/");
  Serial.println(respirations);
  Serial.flush();
  // Send terminate message 
  Serial.println("DONE");
  Serial.flush();
}

//!******************************************************************************
//!   Name: ECG()                           
//!   Description: Prints array of ECG values into the serial port 
//!   Param : void            
//!   Returns: void                          
//!   Example: MSPrint.ECG();                   
//!******************************************************************************
void MSPrint::ECG(){
  // Start timer
  uint32_t start_time = millis();
  float ECG;

  Serial.begin(115200);
  Serial.println();

  // Sampling signal for 8s
  while ((millis() - start_time) <= 8000) {
    Serial.print("ECG/");
    ECG = MySignals.getECG(DATA);
    Serial.println(ECG, 2);
  }
  // Send terminate message 
  Serial.println("DONE");
  Serial.flush();
}


void MSPrint::EMG(){

  float EMG = MySignals.getEMG(VOLTAGE);

  Serial.begin(115200);

  Serial.println();
  Serial.print("EMG/");
  Serial.println(EMG, 2);
  Serial.flush();
  delay(10);

}

void MSPrint::GSR(){

  float GSRv = MySignals.getGSR(VOLTAGE);

  Serial.begin(115200);

  Serial.println();
  Serial.print("GSR/");
  Serial.println(GSRv, 4);
  Serial.flush();
  delay(10);

}


/*
void MSPrint::snore(){

  MySignals.initSnore();

  float snore = MySignals.getSnore(VOLTAGE);

  Serial.begin(115200);

  Serial.println();
  Serial.print("Snore/");
  Serial.println(snore, 2);
  Serial.flush();
  delay(10);

}*/

/*
void MSPrint::bodyPosition(){

  MySignals.initBodyPosition();
  uint8_t position = MySignals.getBodyPosition();
 
  delay(100);
   
  MySignals.getAcceleration();
  
  // convert float to strintg
  char bufferAcc[50];
  char x_acc_string[10];  
  char y_acc_string[10];
  char z_acc_string[10];
  dtostrf (MySignals.x_data, 2, 2, x_acc_string); 
  dtostrf (MySignals.y_data, 2, 2, y_acc_string);
  dtostrf (MySignals.z_data, 2, 2, z_acc_string);
			
  // print the X Y Z acceleration
  sprintf (bufferAcc, ",%s,%s,%s",
           x_acc_string, y_acc_string, z_acc_string);

  Serial.println();
  Serial.print("BodyPosition/");
  Serial.print(position);
  Serial.println(bufferAcc);

}*/


/*
  FUNCTIONS DO NOT HAVE CONSTANT DATA, REVISE METHOD

void glucometer(){

}

void MSPrint::spirometer(){
  MySignals.enableSensorUART(SPIROMETER);

  if (MySignals.getStatusSpiro() != 0)
  {
    MySignals.getSpirometer();
    MySignals.disableMuxUART();

    Serial.print(F("Number of measures:"));
    Serial.println(MySignals.spir_measures);
    Serial.println();

    for (int i = 0; i < MySignals.spir_measures; i++)
    {

      Serial.print(MySignals.spirometerData[i].spir_pef);
      Serial.print(F("L/min "));

      Serial.print(MySignals.spirometerData[i].spir_fev);
      Serial.print(F("L "));

      Serial.print(MySignals.spirometerData[i].spir_hour);
      Serial.print(F(":"));
      Serial.print(MySignals.spirometerData[i].spir_minutes);

      Serial.print(F(" "));

      Serial.print(MySignals.spirometerData[i].spir_year);
      Serial.print(F("-"));
      Serial.print(MySignals.spirometerData[i].spir_month);
      Serial.print(F("-"));
      Serial.println(MySignals.spirometerData[i].spir_day);

    }
    MySignals.enableMuxUART();
    MySignals.disableSensorUART();
    Serial.begin(115200);
  }

}

*/
































