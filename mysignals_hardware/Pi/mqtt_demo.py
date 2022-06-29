#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Feb  3 16:09:39 2020
Last Update on Mon Feb 10 2020
@author: Jorge Castillo
@email: jacastillo8@outlook.com
"""
from clients import MQTTClient
import time, argparse, sys

# Custom callback - infinite
def on_operation():
    while True:
        time.sleep(1)
        
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generates MQTT and Arduino Endpoints for inter-communication')
    parser.add_argument('-b', '--broker', dest='broker', type=str, help='Broker IP Address.')
    parser.add_argument('-p', '--port', dest='port', type=int, help='Port Number.')

    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    
    # Error Handling
    if len(args.broker.split('.')) != 4:
        parser.error("Invalid IPv4 Address")
    elif args.port < 1 or args.port > 65535:
        parser.error("Invalid Port")

    # Create client and subscribe to defined topic
    client = MQTTClient(args.broker, args.port, topic='mysignals/sensors', 
                        qos=2, verbose=True)
    # Assign callback to object
    client.on_operation = on_operation
    # Client connection
    client.connect()