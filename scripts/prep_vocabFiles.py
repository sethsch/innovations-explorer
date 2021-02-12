#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Jan 24 22:28:30 2021

@author: sethschimmel
"""


cd Documents/Github/CUNY-Capstone/data


### reegle clean energy thesaurus
import pandas as pd

df = pd.read_clipboard()

prefDict = []

prefLabels = [(z,y) for (x,y,z) in zip(df.p,df.s,df.o) if x.endswith("prefLabel")]

for item in prefLabels:
    data = df[df.s == item[1]]
    prefTerm = item[0]
    for term in data.o:
        entry = {"term" : term,\
                 "replacement": prefTerm.replace(" ","_").replace("-","_")}
        prefDict.append(entry)
        
outDf = pd.DataFrame(prefDict)
for c in outDf.columns.tolist():
    outDf[c] = [str(x).lower() for x in outDf[c]]


cd Documents/Github/CUNY-Capstone/data
outDf.to_csv("reegle_clean.csv")




################ euVOC

euVoc = pd.read_clipboard()

euVoc.columns
multiLabels = [(x,y) for (x,y) in zip(euVoc.concept,euVoc.altLabels) if ]



###### agroVoc

agro = pd.read_clipboard()

agro.columns

agroDict = []

altLabels = [(x,z) for (x,y,z) in zip(agro.concept,agro.prefLabel,agro.altLabels) if str(z) != "nan"]
prefLabels = [(x,y) for (x,y,z) in zip(agro.concept,agro.prefLabel,agro.altLabels) if str(z) == "nan"]

for item in altLabels:
    data = agro[agro.concept == item[0]]
    altString = item[1]
    prefTerm = list(data.prefLabel)[0]
    for term in altString.split(","):
        entry = {"term" : term,\
                 "replacement": prefTerm.replace(" ","_").replace("-","_")}
        agroDict.append(entry)
        

for item in prefLabels:
    data = agro[agro.concept == item[0]]
    prefString = item[1]
    swap = prefString.replace(" ","_").replace("-","_")
    entry = {"term": prefString,\
             "replacement": swap}
    agroDict.append(entry)
        
    
outDf = pd.DataFrame(agroDict)
for c in outDf.columns.tolist():
    outDf[c] = [str(x).lower() for x in outDf[c]]


outDf.to_csv("agrovoc_clean.csv")

############## STW Thesaurus

stw = pd.read_clipboard()        
stw.columns


stwDict = []

altLabels = [(x,z) for (x,y,z) in zip(stw.concept,stw.prefLabel,stw.altLabels) if str(z) != '  ']
prefLabels = [(x,y) for (x,y,z) in zip(stw.concept,stw.prefLabel,stw.altLabels) if str(z) == '  ']



for item in altLabels:
    data = stw[stw.concept == item[0]]
    altString = item[1]
    prefTerm = list(data.prefLabel)[0]
    for term in altString.split("|"):
        entry = {"term" : term,\
                 "replacement": prefTerm.replace(" ","_").replace("-","_")}
        stwDict.append(entry)
        

for item in prefLabels:
    data = stw[stw.concept == item[0]]
    prefString = item[1]
    swap = prefString.replace(" ","_").replace("-","_")
    entry = {"term": prefString,\
             "replacement": swap}
    stwDict.append(entry)
    
    
outDf = pd.DataFrame(stwDict)
for c in outDf.columns.tolist():
    outDf[c] = [x.lower() for x in outDf[c]]

outDf.to_csv("stw_clean.csv")
