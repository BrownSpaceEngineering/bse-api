#!/usr/bin/env bash
API_ENDPOINT="http://localhost:3000/equisat"

curl "$API_ENDPOINT/current-infos/latest"
curl "$API_ENDPOINT/current-infos"
curl "$API_ENDPOINT/error-codes/latest"
curl "$API_ENDPOINT/data/latest"
curl "$API_ENDPOINT/data"
curl "$API_ENDPOINT/transmission"
curl "$API_ENDPOINT/transmission/latest"
curl "$API_ENDPOINT/signals?fields=L1_SNS,L1_REF"
curl "$API_ENDPOINT/signals/latest?fields=ANTENNA_DEPLOYED"
