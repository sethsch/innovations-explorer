#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb  7 12:54:10 2021

this script is to join the grant level vocabulary indices and mathy keyword extraction indices


@author: sethschimmel
"""

import json

import pandas as pd
import numpy as np
import ast

cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir

# this index has all vocabularies for all terms, unigrams on
vocabIndex = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_FULLINDEX_clean.json","r"))

# this index has all vocabularies but only for bigrams+ tokens, to save space and get rid of potentially junky single word keywords
vocabIndex = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_FULLINDEX_clean_BIGRAMSplus.json","r"))


mathyIndex = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/mathyTFIDF_TEXTRANK_sbir2008to2018.csv")

grants = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir2008to2018_geoRefed_FINAL_03.csv")

grants = grants.sort_values(by=['index'])
g = grants.head()
## the word2vec preprocessing pipeline generates its own id column; using this to validate to ensure the join is correct
w2vKey = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/w2v_pipelineKey.csv")

## here I grab the processed abstract outputs so that we can join a wordcount column to each grant and do keyword stats if necessary later on
w2vParsed = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/w2v_sbir_2008to2018_textFields.csv")
w2vParsed.columns
w2vDict = {}
for index,row in w2vParsed.iterrows():
    w2vDict[str(row['_ref'])] = row['text']

# get the vocabs and create a new col for each
vocabs = list(vocabIndex['0'].keys())
vocabs
for v in vocabs:
    grants[v] = ""

# ensure the ref id is the old index, use _ref to lookup vocab values
grants["_ref"] = grants['index']
g = grants.head()
for index,row in grants.iterrows():
    for v in vocabs:
        grants.at[index,v] = vocabIndex[str(row['_ref'])].get(v,[])
    
g = grants.head()  
b = mathyIndex.head()

# reformat to dict
mathyDict = {}
for index,row in mathyIndex.iterrows():
    mathyDict[str(row['_ref'])] = {"textrank":row["textrank"],\
                              "tfidf_keywords":row["tfidf_keywords"]}

# get the mathy keywords
grants["textrank"] = ""
grants["tfidf_keywords"]=""

for index,row in grants.iterrows():
    grants.at[index,"textrank"] = mathyDict[str(row['_ref'])].get('textrank',[])
    grants.at[index,"tfidf_keywords"] = mathyDict[str(row['_ref'])].get('tfidf_keywords',[])
    
    
g = grants.head()



# add the total word count for each grant from w2vParsed, also supply raw counts to textrank and tfidf keyword columns



grants["num_words"] = 0
for index,row in grants.iterrows():
    grants.loc[index,"num_words"] = len(w2vDict[str(row['_ref'])].split(" "))
    

grants['textrank'] = [ast.literal_eval(x) for x in grants.textrank]
grants['tfidf_keywords'] = [ast.literal_eval(x) for x in grants.tfidf_keywords]


#cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir
#grants.to_csv("sbir2008to2018_geoRefed_FINAL_04_wKeywords.csv")
#grants.to_csv("sbir2008to2018_geoRefed_FINAL_04_wKeywordsBigrams.csv")

## to do so, we need to confirm the maximum ngram size in the vocabular
all_words = []
for index,row in grants.iterrows():
    for v in vocabs:
        #print(type(row[v]))
        for entry in row[v]:
            if type(entry) is dict:
                #print(type(entry))
                all_words.append(entry['t'])
            
           
    tfKeys = row['tfidf_keywords']
    #print(type(tfKeys))
    if type(tfKeys) is dict:
        for k,v in tfKeys.items():
            all_words.append(k)
        
    for t in row['textrank']:
        all_words.append(t)
        
gramSize = []
for word in all_words:
    w = word.replace("_abbr","")
    if "_" in w:
        gramSize.append(w.count("_")+ w.count(" ")+1)
    if " " in w and "_" not in w:
        gramSize.append(w.count(" ")+1)

# find the longest term...         
max(gramSize)
gramLens = list(set(gramSize))
gramLens
# the average term...
import statistics
statistics.mean(gramSize)
statistics.median(gramSize)

uniqueGrams = list(set(all_words))
#gramSize.index(21)
  

vocabGrams = pd.DataFrame()
vocabGrams['term'] = uniqueGrams

 
## from this unpacked list we can get counts and use that for general knowledge
## 

## using a count vectorizer to recount the unique terms and get basic stats on them

from sklearn.feature_extraction.text import CountVectorizer

corpus = list(w2vDict.values())
vectorizer = CountVectorizer(vocabulary=uniqueGrams,ngram_range=(1,11))
X = vectorizer.fit_transform(corpus)

feats = vectorizer.get_feature_names()

vals = X.toarray().astype(np.int16)

tdm = pd.DataFrame(vals)
tdm.columns = feats    
tdm.index = list(w2vDict.keys())

  









"""
# the vocab stats functions are hitting memory limits, 
# so I try to remove variables before running it
import gc
del(all_words)
del(mathyIndex)
del(mathyDict)
del(w2vParsed)
del(vocabIndex)
del(gramSize)
gc.collect()


mentions = vals.sum(axis=0)
awards = np.where(vals > 0, 1, 0)).sum(axis=0)


# get the total mentions/awards for each term
vocabGrams["num_awards"] = 0
vocabGrams["num_ment"] = 0 
import time
vocabDict = {}

vocabGrams.index = vocabGrams.term
for t in list(vocabGrams.term):
    vocabDict[t] = {}
    start = time.time()
    vocabDict[t]["num_awards"] = tdm[t].astype(bool).sum(axis=0)
    vocabDict[t]["num_ment"] = tdm[t].sum(axis=0)
    print(time.time()-start)
    

# write the stats file to output for later analysis
vocabGrams.to_csv("allKeywordsBigramPlus_Vocab_stats.csv")

del(vocabGrams)
gc.collect()

## TO DO: pivot hte awards and mentions by program (and year?) -- add the Agency to the tdm via the _ref, and the Award Year -- group by and agg, drop 0 lines
agency_tdm = []
for a in list(set(grants["Agency"])):
    ids = grants['_ref'][grants.Agency == a]
    agencyTDM = tdm.loc[ids,:]
    start = time.time()
    for t in vocabGrams.terms:
        num_awards = agencyTDM[t].astype(bool).sum(axis=0)
        num_ment = agencyTDM[t].sum(axis=0)
        agency_tdm.append([a,t,num_awards,num_ment])
    print(agency, "- ",(time.time()-start)/60," minutes")
    
agencyTermDf = pd.DataFrame()
agencyTermDf['agency'] = [entry[0] for entry in agency_tdm]
agencyTermDf['term'] = [entry[1] for entry in agency_tdm]
agencyTermDf['awards'] = [entry[2] for entry in agency_tdm]
agencyTermDf['mentions'] = [entry[3] for entry in agency_tdm]
agencyTermDf = agencyTermDf[agencyTermDf.awards != 0]
agencyTermDf.to_csv("agency_termStats.csv")
"""


vocabStats = {}
# replace the tfidf and textrank selections with raw counts to make it comparable to vocab counts
grants['textrankNEW'] = ""
grants['tfkeysNEW'] = ""


errorTerms = []
for index,row in grants.iterrows():

    textrank = []
    tfkeywords = []
    
    for term in row['textrank']:
        try:
            f=tdm.at[str(row["_ref"]),term]
        except:
            f=0
            errorTerms.append(term)
        stat = {'t':term,\
                'f':f}
        textrank.append(stat)
        
    if type(row['tfidf_keywords']) is dict:
        for term,freq in row['tfidf_keywords'].items():
            try:
                f=tdm.at[str(row["_ref"]),term]
            except:
                f=0
                errorTerms.append(term)
            stat = {'t':term,
                    'f':f}
            tfkeywords.append(stat)
        
    grants.at[index,'textrankNEW'] = textrank
    grants.at[index,'tfkeysNEW'] = tfkeywords
    
g = grants.head()
errorTerms = list(set(errorTerms))


import pickle
pickle.dump(grants,open("sbir2008to2018_geoRefed_FINAL_05_wKeywordsDict.obj","wb"))

## save reformatted grants df
# cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir
#grants.to_csv("sbir2008to2018_geoRefed_FINAL_05_wKeywordsDict.csv")
#grants.to_csv("sbir2008to2018_geoRefed_FINAL_05_wKeywordsBigramsDict.csv")

overlapDict = {}

for index, row in grants.iterrows():
    textrankTerms = []
    tfTerms = []
    for entry in row['textrankNEW']:
        textrankTerms.append(entry['t'])
    for entry in row['tfkeysNEW']:
        tfTerms.append(entry['t'])
        
    allMathy = tfTerms + textrankTerms
    allMathy = list(set(allMathy))
    
    if str(row["Research_Keywords"]) == 'NaN' or str(row["Research_Keywords"]) == "nan":
        resKeywords = []
    else:
        resKeywords = row['Research_Keywords'].split(',')
        resKeywords = [x.lower().replace(" ","_").replace("-","_") for x in resKeywords]
    
    vocabTerms = {}
    for v in vocabs:
        vt = []
        for entry in row[v]:
            vt.append(entry['t'].lower().replace(" ","_").replace("-","_"))
        vocabTerms[v] = {'voc_terms':vt,\
                         'num_vocab': len(vt),\
                             'num_res': len(resKeywords),\
                        'num_mathy': len(allMathy),\
                         'mathyOverlap':len([i for i in vt if i in allMathy ]),\
                        'resKeyOverlap': len([i for i in vt if i in resKeywords])}
        
    overlapDict[str(row['_ref'])] = {'voc_stats': vocabTerms,\
                                     'agency': row['Agency'],\
                                    'award_year': row['Award_Year']}
    

    
for k,v in overlapDict.items():
    for voc in vocabs:
        vocStats =  overlapDict[k]['voc_stats'][voc]
        if vocStats['num_vocab'] == 0:
            pct_mathy = 0
            pct_given = 0
        else:
            pct_mathy = vocStats['mathyOverlap'] / vocStats['num_mathy']
            pct_given = vocStats['resKeyOverlap'] / vocStats['num_res']
        overlapDict[k]['voc_stats'][voc]['pct_mathy'] = pct_mathy
        overlapDict[k]['voc_stats'][voc]['pct_given'] = pct_given
        
        
    
# the json file where the output must be stored 
out_file = open("vocab_mathy_analysis.json", "w") 
  
json.dump(overlapDict, out_file, indent = 6) 
  
out_file.close() 


overlapStats = pd.DataFrame()
overlapStats["_ref"] = grants["_ref"]
overlapStats["agency"] = grants["Agency"]
overlapStats["award_year"] = grants["Award_Year"]

stats = ["num_vocab","num_res","num_mathy","mathyOverlap","resKeyOverlap",'pct_mathy','pct_given']
for v in vocabs:
    for s in stats:
        overlapStats[v+s] = 0

for index,row in overlapStats.iterrows():
    for v in vocabs:
        for s in stats:
            overlapStats.at[index,(v+s)] = overlapDict[str(row["_ref"])]['voc_stats'][v][s]

overlapStats.to_csv("vocab_mathy_analysis_v2.csv")

grants['Research_Keywords']
