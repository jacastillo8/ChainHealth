#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Feb 10 11:39:40 2020
Last Update on Mon Feb 10 2020
@author: Jorge Castillo
@email: jacastillo8@outlook.com
"""
import threading

# Globals
params = {'broker': None,
          'topic': None,
          'qos': None}

# Setters
def set_broker(broker):
    params['broker'] = broker

def set_topic(topic):
    params['topic'] = topic

def set_qos(qos):
    params['qos'] = qos

# Callbacks    
def on_connect(client, userdata, flags, rc):   
    if rc == 0:
        print("[+] Connection to {} successful".format(params['broker'] or 'broker'))
        # User can subscribe to topic once connected - if initially defined
        if params['topic']:
            client.subscribe(params['topic'], qos=params['qos'])
    else:
        print("[!] Connection failed: {}".format(rc))

def on_disconnect(client, userdata, rc):
    if rc != 0:
        print("[!] Unexpected loss of connection for {}".format(params['broker'] or 'broker'))
    else:
        print("[-] Client disconnected successfully")
        
def on_message(client, userdata, message):
    topic = message.topic.split('/')
    payload = message.payload.decode('utf-8')
    # Make sure the topic is right
    if 'mysignals/sensors' in '/'.join(topic):
        # Create arduino client
        from clients import ArduinoClient
        arduino = ArduinoClient(port='/dev/ttyACM0', 
                                baudrate=115200,
                                mqtt_client=client,
                                requestor=topic[2],
                                receiver=topic[3])
        # Run serial client on separate thread 
        threading.Thread(target=arduino.write, args=(payload)).start()    
    
def on_subscribe(client, userdata, mid, granted_qos):
    print("[+] Client subscribed to '{}' topic with '{}' QoS".format(params['topic'], params['qos']))
