#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jan 25 00:29:07 2021

transform awards Json to CSV for geocoding

@author: sethschimmel
"""

import json

with open('/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018.json',"rb") as file:
    awards = json.load(file)
    
    
cols = list(awards[0].keys())

awardsDf = pd.DataFrame()

for c in cols:
    awardsDf[c] = [rec[c] for rec in awards]
    
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/
awardsDf.to_csv("sbir_2008to2018.csv")
