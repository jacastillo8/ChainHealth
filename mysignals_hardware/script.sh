#!/bin/bash

function printHelp() {
    echo "RUN SCRIPT WITH SUDO PRIVILEGES"
    echo "Usage: "
    echo "  script.sh <mode> [-b <broker address> -p <port number>]"
    echo "    <mode> - one of 'run'"
    echo "      - 'run' - generates files and set-ups"
    echo "    -b <broker address> - IP Address for MQTT Broker (defaults to \"localhost\")"
    echo "    -p <port number> - MQTT port (defaults to standard port \"1883\")"
    echo "  script.sh -h (print this message)"
    echo
}

function run() {
    # Enables network scripts to allow programs to run after network is online (IP Address)
    systemctl enable systemd-networkd.service systemd-networkd-wait-online.service

    # Check if mysignals.service file exists, if not then it creates it
    if [ ! -f ./Pi/service/mysignals.service ]; then
        python3 ./Pi/generate_service.py -b $BROKER -p $PORT
    fi

    # Copy service file into proper directory
    cp ./Pi/service/mysignals.service /etc/systemd/system/

    # Enable script for systemd
    systemctl enable mysignals.service
}

if [ "$1" = "-m" ]; then 
  shift
fi
MODE=$1
shift

BROKER='localhost'
PORT="1883"
while getopts "hb:p:" opt; do
    case "$opt" in
    h | \?)
        printHelp
        exit 0
        ;;
    b)
        BROKER=$OPTARG
        ;;
    p)
        PORT=$OPTARG
        ;;
    esac
done

if [ "${MODE}" == "run" ]; then
    run
else 
    printHelp
    exit 1
fi

