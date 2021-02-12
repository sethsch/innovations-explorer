#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan 20 10:43:27 2021

Join manually downloaded JSON files into one full file for SBIR.gov data

De-duplicate in case there were any downloading errors.

@author: sethschimmel
"""

import json
import os

path = "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/raw_awards_data"

files = os.listdir(path)

files = [x for x in files if x.endswith(".json")]
files = [os.path.join(path,file) for file in files]

data = []


for file in files:
    with open(file, encoding="utf-8") as f:
      data.append(json.load(f))

fulldata = []
with open("sbir_2008to2018.json", "w",encoding="utf-8") as outfile:
    for f in files:
        with open(f, 'rb') as infile:
            file_data = json.load(infile)
            fulldata += file_data
    json.dump(fulldata, outfile)


######### merge topics jsons


path = "/Users/sethschimmel/Documents/GitHub/Capstone/data/sbir/definitions_dictionaries"

files = os.listdir(path)

files = [x for x in files if x.endswith(".json")]
files = [os.path.join(path,file) for file in files]

data = []


for file in files:
    with open(file) as f:
      data.append(json.load(f))

fulldata = []
with open("sbirTopics_2008to2018.json", "w") as outfile:
    for f in files:
        with open(f, 'rb') as infile:
            file_data = json.load(infile)
            fulldata += file_data
    json.dump(fulldata, outfile)
                
            
