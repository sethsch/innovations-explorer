#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jan 31 10:28:31 2021

@author: sethschimmel
"""

import json
from collections import Counter

## open the first seven dict and the mesh dict
sevDict = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir_2008to2018_VOCABINDEX.json","r"))

meshDict = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir_2008to2018_MESHINDEX.json", "r")) 

## merge the first seven dicts and the MeSH dict
for k,v in meshDict.items():
    sevDict[str(k)].update(v)
    
sevDict['9897']

## convert the list to a dictionary of raw frequencies/counts
for k,v in sevDict.items():
    for voc in list(v.keys()):
        sevDict[k][voc] = dict(Counter(sevDict[k][voc]))

sevDict['9897']


newDict = {}
# clean up the counted collection to have term and freq, to make it easier for viz
for k,v in sevDict.items():
    newDict[k]  = {}
    for voc in list(v.keys()):
        cleanVoc = []
        for term,freq in sevDict[k][voc].items():
            #print(str(term).count("_"))
          

            t = term.replace(voc,"")  
            ## get rid of unigrams to save space...?
            #if t.count("_") == 0:
            #    pass
            #else:
            entry = {"t":t,"f":freq}
            cleanVoc.append(entry)
        vocName = voc.replace("*","").replace("_","")
        newDict[k][vocName] = cleanVoc
        
newDict['9897']



######## get the original award_id from before the word2vec pipline re-indexing
#### NOTE: this adds lots of suize to the output data json... isn't necessary really...
import pandas as pd

#origDf = pd.read_csv("/Users/sethschimmel/Documents/GitHub/w2v_pipeline_sbir/pipeline_src/datasets/sbir_2008to2018_textFields.csv")

#origDf.columns
#origDf.head()

#awardIds = list(origDf.award_id)

#for k,v in sevDict.items():
#    sevDict[k]["award_id"] = awardIds[int(k)]

#sevDict['9']


out_file = open("sbir_2008to2018_FULLINDEX_clean.json", "w") 
json.dump(newDict, out_file) 
  
out_file.close() 
