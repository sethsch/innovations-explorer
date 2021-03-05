#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Mar  4 16:42:43 2021

this script is breaking apart index json files into smaller files to call as needed
- cd116 aggregated vocab indices
- award-level vocab indexes

@author: sethschimmel
"""

cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir

import pandas as pd
import ast
import numpy as np
import json

vocab = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/cd116_aggregatedKeywordStore.json","r"))

cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/cd116_vocab_aggs

for district in list(vocab.keys()):
    x = vocab[district]
    json.dump(str(x),open(district+".json","w"))
    
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir


## awards
awards = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_FULLINDEX_clean.json","r"))
    
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/awards_vocab_files/full_index

for aw in list(awards.keys()):
    x = awards[aw]
    json.dump(str(x),open(aw+".json","w"))
    
    
    
## awards with only bigram dicts
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/

awards =  json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_FULLINDEX_clean_BIGRAMSplus.json","r"))

cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/awards_vocab_files/bigrams_plus

for aw in list(awards.keys()):
    x = awards[aw]
    json.dump(str(x),open(aw+".json","w"))
    