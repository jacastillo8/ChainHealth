# -*- coding: utf-8 -*-
"""
Created on Wed Jan 29 14:47:27 2020
Last Update on Wed Mar  17 2021
@author: Jorge Castillo
@email: jacastillo8@outlook.com
"""

import argparse, sys
from emr_docker import ComposeEMR
       
if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates necessary configuration files for Docker containers ' +\
                                     'to generate Electronic Medical Record instances (OpenEMR) with its DB manager.')
    parser.add_argument('-e', '--emrs', dest='emrs', type=int, help='Number of EMRs.')
    parser.add_argument('-d', dest='domain', default='example.com', type=str, help='Domain name for the application (example.com).')
    parser.add_argument('-n', dest='net', default='blockchain', type=str, help='Network name for Docker network.')
    
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()
    
    # Generate Files
    ComposeEMR(number_emrs=args.emrs,
                domain_name=args.domain,
                net_name=args.net).create_emr()