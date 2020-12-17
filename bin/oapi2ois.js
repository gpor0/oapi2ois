#!/usr/bin/env node

require = require('esm')(module /*, options*/);
require('../src/convert').convert(process.argv);