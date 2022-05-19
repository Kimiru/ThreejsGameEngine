#!/bin/bash

cat js/ThreeJSGameEngine.js | sed -e "s/three/..\/three.js/" > tmp
mv tmp js/ThreeJSGameEngine.js