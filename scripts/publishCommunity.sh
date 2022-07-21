#!/bin/zsh
sfdx force:community:publish --name "GDS Demo"
echo "Waiting for community to publish ..."
sleep 20