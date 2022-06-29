#include "Arduino.h"
#include <MySignals.h>

class MSPrint {
  public:
    MSPrint(); // Constructor
    void begin(); // Initialization method
    void temperature(); // Get Temperature
    void pulsioximeter(); // Get SPO2
    void bloodPressure(); // Get Blood Pressure
    void respiration();
    void ECG();
    void EMG();
    void GSR();
    void snore();
    void bodyPosition();
    void pulsioximeter_alarm();
};
