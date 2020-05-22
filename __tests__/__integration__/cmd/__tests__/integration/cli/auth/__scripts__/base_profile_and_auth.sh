#!/bin/bash

baseAmount=$1
basePrice=$2

# First create a base profile
cmd-cli profiles create base-profile "test_base" --amount $baseAmount --price $basePrice
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Creating a test_base profile of type base failed!" 1>&2
    exit $CMDRC
fi

# Next login to fruit auth
cmd-cli auth login fruit
CMDRC=$?
if [ $CMDRC -gt 0 ]
then
    echo "Logging into auth of type fruit failed!" 1>&2
    exit $CMDRC
fi
