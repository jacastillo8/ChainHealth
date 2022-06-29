#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan 22 17:32:27 2020
Last Update on Wed Jan  29 2020
@author: Jorge Castillo
@email: jacastillo8@outlook.com
"""

import argparse, sys
from mosquitto_docker import ComposeMqtt
       
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates necessary configuration files for Docker containers ' +\
                                     'to generate a swarm of MQTT Brokers.')
    parser.add_argument('-o', '--organizations', dest='orgs', type=int, help='Number of Organizations.')
    parser.add_argument('-l', '--swarm_length', dest='swarm', default=1, nargs='+', type=int, help='Number of Brokers per Organization. ' + 
                        'It can be an integer (symmetric) or tuple (Ex: -l 2 5).')
    parser.add_argument('-d', dest='domain', default='example.com', type=str, help='Domain name for the application (example.com).')
    parser.add_argument('-n', dest='nets', default='blockchain', type=str, nargs='+', help='Network name(s) for Docker network.')
    
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    
    # Error Handling
    if len(args.swarm) > args.orgs:
        parser.error("Number of brokers cannot exceed the number of available organizations ({}).".format(args.orgs))
    # Argument Manipulation
    if len(args.swarm) == 1:
        swarm = args.swarm[0]
    else:
        swarm = tuple(args.swarm)
        
    # Generate Files
    ComposeMqtt(number_organizations=args.orgs,
                swarm_length=swarm,
                domain_name=args.domain,
                net_names=args.nets).create_mqtt()