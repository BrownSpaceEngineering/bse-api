#!/usr/bin/env bash
API_ENDPOINT="http://localhost:3000/equisat"
CURL_ARGS="--write-out '%{http_code}' --silent --output /dev/null"
curl $CURL_ARGS "$API_ENDPOINT/current-infos/latest"
curl $CURL_ARGS "$API_ENDPOINT/current-infos"
curl $CURL_ARGS "$API_ENDPOINT/error-codes/latest"
curl $CURL_ARGS "$API_ENDPOINT/data/latest"
curl $CURL_ARGS "$API_ENDPOINT/data"
curl $CURL_ARGS "$API_ENDPOINT/transmissions"
curl $CURL_ARGS "$API_ENDPOINT/transmissions/latest"
curl $CURL_ARGS "$API_ENDPOINT/signals?fields=L1_SNS,L1_REF"
curl $CURL_ARGS "$API_ENDPOINT/signals/latest?fields=ANTENNA_DEPLOYED"
