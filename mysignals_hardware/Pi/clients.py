#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Feb 10 14:59:40 2020
Last Update on Mon Feb 10 2020
@author: Jorge Castillo
@email: jacastillo8@outlook.com
"""
from paho.mqtt.client import Client
import time, serial
import callbacks
  
class MQTTClient(object):
    """ Wrapper for Paho MQTT Client object """
    def __init__(self, broker, port, username='', topic='', qos=0, tls=False, verbose=True):
        # User can access broker, port and verbosity
        self.broker = broker
        self.port = port
        self.verbose = verbose
        # User unable to access __* properties easily
        self.__client = Client(username)
        self.__set_attributes(topic, qos)
        self.__set_callbacks()
        self.__tls = tls
        if self.__tls:
            self.__client.tls_set('certs/device.pem')
            self.__client.tls_insecure_set(True)
        
    def get_client(self):
        return self.__client
    
    def __get_callbacks(self):
        # cbs variable not a property of class - one time use
        try:
            cbs = [func for func in dir(callbacks) if 'on_' in func]
        except:
            cbs = []
        return cbs
    
    def __set_callbacks(self):
        # Set available callbacks from callbacks import
        cbs = self.__get_callbacks()
        print("[+] Setting available callbacks")
        for cb in cbs:
            setattr(self.__client, cb, getattr(callbacks, cb))
    
    def __set_attributes(self, topic, qos):
        # Set global parameters on callbacks import - subscription
        if self.verbose:
            callbacks.set_broker(self.broker)
        callbacks.set_topic(topic)
        callbacks.set_qos(qos)
    
    def __print_example(self):
        # Display example for callback
        msg = "="*48 + "\n" + \
            "[*] Example:\n\t" + \
            "def some_func():\n\t\t" + \
            "while True:\n\t\t\tprint('This is a test')\n\n\t" + \
            "client = MQTTClient(broker, port)\n\t" + \
            "client.loop_operation = some_func\n" + \
            "="*48
        print(msg)
        
    # Callback function for dynamic operations
    def on_operation(self):
        print("[!] No callback function set...Exiting")
        self.__print_example()
        self.__client.loop_stop()
        self.__client.disconnect()
        
    def connect(self):
        self.__client.connect(host=self.broker, port=self.port)
        self.__client.loop_start()
        try:
            # Wait for proper initialization
            time.sleep(0.3)
            # Run callback
            self.on_operation()
            # Smooth exit if not infinite loop
            print("[+] Operation completed...Exiting")
            self.__client.loop_stop()
            self.__client.disconnect()
        except KeyboardInterrupt:
            print("[-] User defined exit", end='\n\t')
            self.__client.loop_stop()
            self.__client.disconnect()
        except Exception as err:
            print("[!] Exception raised during loop_operation", end='\n\t')
            print("Error: {}".format(err))
            #self.__print_example()
            self.__client.loop_stop()
            self.__client.disconnect()
        
class ArduinoClient(object):
    """ Wrapper for Arduino Serial object """
    def __init__(self, port, baudrate, mqtt_client, requestor, receiver):
        # Available Sensors in arduino
        self.sensors = ['Temp', 'SPO2', 'BP', 'Resp', 'ECG']
        # Initialize serial port
        self.serial = serial.Serial(port=port, baudrate=baudrate)
        # Store MQTT client's info
        self.mqtt_client = mqtt_client
        # Store who is requesting data (user)
        self.user = requestor
        # Store who is receiving data
        self.rcvr = receiver
        # Wait for arduino to be ready
        ready = self.serial.readline().decode().rstrip('\r\n')
        if ready == 'Ready':
            print("[+] Arduino ready for communication")
            
    def write(self, payload):
        # Send payload in bytes format
        self.serial.write(bytes(payload.encode()))
        # Wait for response
        self.read()
        
    def read(self):
        # Wait for arduino to respond - check every second
        while True:
            try:
                msg = self.serial.readline().decode().rstrip('\r\n').split('/')
                if msg[0] in self.sensors:
                    # Publish exactly once - QoS = 2
                    self.mqtt_client.publish('mysignals/{}/{}/{}'.format(self.user, self.rcvr, msg[0]), msg[1], qos=2)
                elif msg[0] == 'DONE':
                    break
            except UnicodeDecodeError:
                time.sleep(1)
                continue
        self.serial.close()