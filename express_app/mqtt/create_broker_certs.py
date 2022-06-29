# -*- coding: utf-8 -*-
"""
Created on Mon Apr 6 2020
Last Update on Thu Mar 18 2020
@author: Jorge Castillo
@email: jacastillo8@outlook.com
"""

from OpenSSL import crypto
import os, argparse, sys

CERT_FILE = "broker.crt"
KEY_FILE = "broker.key"

def get_root_cert(cwd):
    k = crypto.PKey()
    k.generate_key(crypto.TYPE_RSA, 2048)

    cert = crypto.X509()
    cert.get_subject().C = 'US'
    cert.get_subject().ST = 'Texas'
    cert.get_subject().L = 'San Antonio'
    cert.get_subject().O = 'IoTMedical'
    cert.get_subject().CN = 'application.IoTMedical'
    cert.set_serial_number(100)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(10*365*24*60*60)
    cert.set_pubkey(k)
    cert.set_issuer(cert.get_subject())
    cert.sign(k, 'sha1')

    open('{}/../config/certs/ca_cert.pem'.format(cwd), 'wt').write(
        crypto.dump_certificate(crypto.FILETYPE_PEM, cert).decode())
    open('{}/../config/certs/ca_key'.format(cwd), 'wt').write(
        crypto.dump_privatekey(crypto.FILETYPE_PEM, k).decode())


def create_signed_cert(ca_cert, ca_key, path=''):
    # create a key pair
    k = crypto.PKey()
    k.generate_key(crypto.TYPE_RSA, 2048)

    # create a certificate
    cert = crypto.X509()
    cert.get_subject().C = 'US'
    cert.get_subject().ST = 'Texas'
    cert.get_subject().L = 'San Antonio'
    cert.get_subject().O = ca_cert.get_subject().O
    cert.get_subject().CN = 'mosquitto.' + ca_cert.get_subject().O
    cert.set_serial_number(1000)
    cert.gmtime_adj_notBefore(0)
    cert.gmtime_adj_notAfter(10*365*24*60*60)
    cert.set_issuer(ca_cert.get_subject())
    cert.set_pubkey(k)
    
    # sign cert with CA file
    cert.sign(ca_key, 'sha1')
    
    # store certs in folder
    open('{}/{}'.format(path, CERT_FILE), "wt").write(
        crypto.dump_certificate(crypto.FILETYPE_PEM, cert).decode())
    open('{}/{}'.format(path, KEY_FILE), "wt").write(
        crypto.dump_privatekey(crypto.FILETYPE_PEM, k).decode())
    open('{}/ca.crt'.format(path), 'wt').write(
        crypto.dump_certificate(crypto.FILETYPE_PEM, ca_cert).decode())

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Creates certificates for Docker containers ' +\
                                     'to generate a swarm of MQTT Brokers.')
    parser.add_argument('-o', '--organizations', dest='orgs', type=int, help='Number of Organizations.')
    
    if len(sys.argv) == 1:
        parser.print_help()
        sys.exit(1)
        
    args = parser.parse_args()

    cwd = os.getcwd().replace('\\', '/')
    files = os.listdir('{}/../config/certs'.format(cwd))
    if not ('ca_cert.pem' in files and 'ca_key' in files):
        get_root_cert(cwd)

    with open('{}/../config/certs/ca_cert.pem'.format(cwd), 'rt') as file:
        ca_cert = crypto.load_certificate(crypto.FILETYPE_PEM, file.read())
    
    with open('{}/../config/certs/ca_key'.format(cwd), 'rt') as file:
        ca_key = crypto.load_privatekey(crypto.FILETYPE_PEM, file.read())

    for i in range(args.orgs):
        os.mkdir('{}/certs{}'.format(cwd, i))
        path = '{}/certs{}'.format(cwd, i)
        create_signed_cert(ca_cert, ca_key, path)
