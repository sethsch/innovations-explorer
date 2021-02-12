#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Feb 11 14:08:27 2021

this script aggregates the award level stats for districts, agency and year


@author: sethschimmel
"""

import pandas as pd
import ast
import numpy as np
import json

df = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir2008to2018_geoRefed_FINAL_07_wKeywordsDict.csv")

df.columns
df.num_words.sum()
g = df.head()


for f in ['EIGE', 'AGROVOC','REEGLE', 'GEMET', 'EUSCIVOC', 'EUVOC', 'STW', 'MeSH','textrank', 'tfidf_keywords']:
    df[f] = df[f].replace(np.nan,"[]")
    
for f in ['Agency_Tracking_Number','Contract']:
    df[f] = df[f].replace(np.nan,"")

agencies = [x for x in list(set(df.Agency)) if x is not np.nan]
g = df.head()


## test json loads
a =json.loads(str(group).replace("'","\""))


def agg_by_congdist(dist_id,ngrams):
    distrAgg = {}
    ## create an aggregate keyword dict by district, agency, year
    for c in list(set(df[dist_id])):
        d = df[df[dist_id] == c]
        distrAgg[c] = {}
        agencies = [x for x in list(set(d.Agency)) if x is not np.nan]
        years = [x for x in list(set(d.Award_Year)) if x is not np.nan]
        for a in agencies:
            distrAgg[c][a] = {}
            for y in years:
                year= str(y)
                distrAgg[c][a][year] = {}
                agYear = d[d.Agency == a]
                agYear = agYear[agYear.Award_Year == y]
                distrAgg[c][a][year] = {"agency": a, "year":year,\
                                    "wd_ct": int(agYear.num_words.sum()),\
                                     "aw_ct": int(len(list(agYear.index))),\
                                    "ids":[str(x)+"_"+str(y) for (x,y) in zip(agYear.Agency_Tracking_Number,agYear.Contract)] }
                for f in ['EIGE', 'AGROVOC','REEGLE', 'GEMET', 'EUSCIVOC', 'EUVOC', 'STW', 'MeSH','textrank', 'tfidf_keywords']:
                    dicts = [str(x) for x in agYear[f]]
                    dicts = [json.loads(str(x).replace("'","\"")) for x in dicts if x != "nan"]    
                    result = {}
                    for group in dicts:
                        for entry in group:
                            if ngrams == "all":
                                new = {entry['t']:int(entry['f'])}
                                result.update(new)
                            elif ngrams == "2+":
                                # to limit to bigrams+ use this line
                                if " " in entry['t'] or "_" in entry['t']:
                                    new = {entry['t']:int(entry['f'])}
                                    result.update(new)
                            else:
                                raise ValueError("Oops!  That was not valid. Enter all or 2+.")
                            
                    distrAgg[c][a][year][f] = dict(sorted(result.items(), key=lambda x: x[1], reverse=True))

    ## get rid of empty entries to save space
    for c in list(distrAgg.keys()):
        for a in list(distrAgg[c].keys()):
            for y in list(distrAgg[c][a].keys()):
                for f in ['EIGE', 'AGROVOC','REEGLE', 'GEMET', 'EUSCIVOC', 'EUVOC', 'STW', 'MeSH','textrank', 'tfidf_keywords']:
                    if distrAgg[c][a][y][f] == {}:
                        del distrAgg[c][a][y][f]
                
                if distrAgg[c][a][y]['aw_ct'] == 0:
                    del distrAgg[c][a][y]  
                    
                    
                    
    return(distrAgg)

cd116Agg_all = agg_by_congdist("AFFGEOID_CD116","all")
cd116Agg_bigram = agg_by_congdist("AFFGEOID_CD116","2+")

list(cd116Agg_bigram.keys())[0]
r = cd116Agg_all['5001600US1703']
# the json file where the output must be stored 
out_file = open("cd116_aggregatedKeywordStoreBigramPlus.json", "w") 
  
json.dump(cd116Agg_bigram, out_file, indent = 6) 
  
out_file.close() 
