#!/bin/bash

echo "Current folder: $(pwd)"

containers=$(docker ps -a -q --filter ancestor=crispy-pancake)
if [ -n "$containers" ]; then
  docker rm $(docker stop $containers)
fi
