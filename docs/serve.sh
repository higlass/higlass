#!/bin/bash

sphinx-autobuild -b html . _build/html -p 8062 --ignore "*.swp" -B
