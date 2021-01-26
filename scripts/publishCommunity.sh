#!/bin/zsh
sfdx force:community:publish --name "GDS Demo"
echo "Waiting for community to publish ..."
sleep 20
sfdx force:community:publish --name "GDS Landing"
echo "Waiting for community to publish ..."
sleep 20