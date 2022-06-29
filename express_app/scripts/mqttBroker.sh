#!/bin/bash

PYTHON=$(python -c "import platform; print(platform.python_version()[0])")

if [ "$PYTHON" != "3" ]; then
    shopt -s expand_aliases
    alias python='python3'
fi

function replaceMQTTCerts() {
    rm -r certs*/
    python create_broker_certs.py -o $SWARM
}

function createBrokers() {
    cd mqtt/
    replaceMQTTCerts
    python build_swarm.py -o $SWARM -l 1 -d $DOMAIN -n $NETWORK
    docker-compose -f docker-compose-mqtt.yaml up -d
    cd ../
}

function removeBrokers() {
    cd mqtt/
    docker-compose -f docker-compose-mqtt.yaml down
    cd ../
}

if [ "$1" = "-m" ]; then 
  shift
fi
MODE=$1
shift

DOMAIN="example.com"
SWARM='1'
NETWORK="medical"

while getopts "hd:s:" opt; do
    echo $opt
    case "$opt" in
    h | \?)
        printHelp
        exit 0
        ;;
    d)
        DOMAIN=$OPTARG
        ;;
    s)
        SWARM=$OPTARG
        ;;
    esac
done

if [ "${MODE}" == "up" ]; then
    createBrokers
elif [ "${MODE}" == "down" ]; then
    removeBrokers
else
    exit 1
fi