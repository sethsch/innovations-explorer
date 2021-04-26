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
    x = str(vocab[district]).replace("'","\"").replace('"{',"'{").replace('"}',"'}")
    x = ast.literal_eval(x)
    json.dump(x,open(district+".json","w"))
    
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir


## awards
awards = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_FULLINDEX_clean.json","r"))
    
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/awards_vocab_files/full_index
cd /Users/sethschimmel/awards_vocab_index/full_index

for aw in list(awards.keys()):
    x = str(awards[aw]).replace("'","\"").replace('"{',"'{").replace('"}',"'}")
    x = ast.literal_eval(x)
    json.dump(x,open(aw+".json","w"))
    
    
    
## awards with only bigram dicts
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/

awards =  json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_FULLINDEX_clean_BIGRAMSplus.json","r"))


cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/awards_vocab_files/bigrams_plus
cd /Users/sethschimmel/awards_vocab_index/bigrams_plus

for aw in list(awards.keys()):
    x = str(awards[aw]).replace("'","\"").replace('"{',"'{").replace('"}',"'}")
    x = ast.literal_eval(x)
    json.dump(x,open(aw+".json","w"))
    
    
import shutil
import os
    
source_dir = '/Users/sethschimmel/awards_vocab_index/'
target_dir = '/Users/sethschimmel/awards_vocab_index/bigrams_plus/'
    
file_names = os.listdir(source_dir)
    
for file_name in file_names:
    shutil.move(os.path.join(source_dir, file_name), target_dir)
    