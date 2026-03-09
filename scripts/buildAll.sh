#!/bin/zsh

echo "Creating Scratch Org"
sf org create scratch --definition-file config/project-scratch-def.json --alias GovUKGDS1_6BETA --duration-days 30 --set-default --json

echo "Deploying Source"
sf project deploy start --source-dir "./force-app/main/default"

echo "Opening Org"
sf org open