#!/bin/bash

PYTHON=$(python -c "import platform; print(platform.python_version()[0])")

if [ "$PYTHON" != "3" ]; then
    shopt -s expand_aliases
    alias python='python3'
fi

function createEMRs() {
    cd emr/
    python build_emr.py -e $EMRS -d $DOMAIN -n $NETWORK
    docker-compose -f docker-compose-emr.yaml up -d
    cd ../
}

function removeEMRs() {
    cd emr/
    docker-compose -f docker-compose-emr.yaml down
    cd ../
}

if [ "$1" = "-m" ]; then 
  shift
fi
MODE=$1
shift

DOMAIN="example.com"
EMRS='1'
NETWORK="medical"

while getopts "hd:e:" opt; do
    echo $opt
    case "$opt" in
    h | \?)
        printHelp
        exit 0
        ;;
    d)
        DOMAIN=$OPTARG
        ;;
    e)
        EMRS=$OPTARG
        ;;
    esac
done

if [ "${MODE}" == "up" ]; then
    createEMRs
elif [ "${MODE}" == "down" ]; then
    removeEMRs
else
    exit 1
fi