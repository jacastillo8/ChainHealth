#!/bin/bash

# Destroy Blockchain and containers
function clean() {
    echo "----- Removing all files, containers, volumes and networks -----"
    clearContainers
    docker network rm $(docker network ls -qf name=medical)
}

function clearContainers() {
    docker container rm -f $(docker container ls -aq) && docker volume rm $(docker volume ls -q)
    docker volume rm $(docker volume ls -qf dangling=true)
}

clean