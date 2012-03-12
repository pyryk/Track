#!/bin/sh
cd `dirname $0`
perl -e 's/\/css/\/track\/css/g' -p -i ../css/app.css
cp ../js/config.js.server ../js/config.js