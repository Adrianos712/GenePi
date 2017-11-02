#!/usr/bin/perl -w

#curl -d '{"jsonrpc":"2.0","id":1,"method":"'$1'","params":'$2'}' -H 'content-type:application/json;' http://127.0.0.1:8080/ ; echo ; echo
print `curl -sd \'{"jsonrpc":"2.0","id":1,"method":"$ARGV[0]","params":$ARGV[1]}\' -H 'content-type:application/json;' http://127.0.0.1:8080/ ; echo ; echo`

