#!/bin/bash

sudo bindfs -u www-data -g www-data /home/melon/Desktop/Website/banwave.live/css /usr/share/nginx/css
sudo bindfs -u www-data -g www-data /home/melon/Desktop/Website/banwave.live/js /usr/share/nginx/js
sudo bindfs -u www-data -g www-data /home/melon/Desktop/Website/banwave.live/static /usr/share/nginx/static

nodemon --config server/nodemon.json
