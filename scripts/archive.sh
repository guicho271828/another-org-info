#!/bin/bash


log=$(mktemp)
python3 -u -m http.server > $log &
pid=$!

trap "kill $pid ; rm -v $log" EXIT

timeout 10 awk '/Serving HTTP/{print; exit}' <(tail -f $log)

wget -r http://0.0.0.0:8000/index.html

dir=$(basename $PWD)
mv 0.0.0.0:8000 $dir
zip -r $dir.zip $dir
rm -r $dir
