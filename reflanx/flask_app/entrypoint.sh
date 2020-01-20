#!/bin/bash

python scripts/create_user.py $FGA_USERNAME $FGA_PASSWORD
gunicorn -b 0.0.0.0:5000 app:app
