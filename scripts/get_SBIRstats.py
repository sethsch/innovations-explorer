#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan 20 12:43:32 2021

This script gets some basic stats about the SBIR data

@author: sethschimmel
"""

import json
import os

file = "/Users/sethschimmel/Documents/GitHub/Capstone/data/sbir/sbir_2008to2018.json"


fulldata= json.load(open(file))


dataStats = {}

awardCt = 0
topicCt = 0
keywordCt = 0
hubCt = 0
sedCt = 0
womenCt = 0
agencies = []
programs = ["SBIR","STTR"]
for rec in fulldata:
    awardCt += 1
    if rec["Topic_Code"] != "": topicCt+=1
    if rec["Research_Keywords"] != "": keywordCt +=1
    if rec["Woman_Owned"] != "N": womenCt +=1
    if rec["Socially_and_Economically_Disadvantaged"] != "N": sedCt +=1
    if rec["Hubzone_Owned"] != "N": hubCt +=1
    agencies.append(rec["Agency"])
 
    
    
agencies = list(set(agencies))
programs = list(set(programs))
dataStats["All_Agencies"]  = {"All_Programs":{"num_awards": awardCt,\
                            "pct_wTopic":topicCt/awardCt,\
                             "pct_wKeywords":keywordCt/awardCt,\
                             "pct_WomenOwned": womenCt/awardCt,\
                             "pct_SED": sedCt/awardCt,\
                             "pct_hubZone": hubCt/awardCt}}  


awardCt = 0
topicCt = 0
keywordCt = 0
hubCt = 0
sedCt = 0
womenCt = 0
for agency in agencies:
    dataStats[agency] = {}
    for p in programs:
        dataStats[agency][p] = {}
        awardCt = 0
        topicCt = 0
        keywordCt = 0
        hubCt = 0
        sedCt = 0
        womenCt = 0
        awardCt = 0

        for rec in fulldata:
            if ((rec["Agency"] == agency) and (rec["Program"] == p)): 
                awardCt+=1
                if rec["Topic_Code"] != "": topicCt+=1
                if rec["Research_Keywords"] != "": keywordCt +=1
                if rec["Woman_Owned"] != "N": womenCt +=1
                if rec["Socially_and_Economically_Disadvantaged"] != "N": sedCt +=1
                if rec["Hubzone_Owned"] != "N": hubCt +=1
        if awardCt == 0: 
            dataStats[agency][p] = {"num_awards":0}
            print("div by zero",agency,p)
        else:
            dataStats[agency][p] = {"num_awards":awardCt,\
                                    "pct_wTopic":topicCt/awardCt,\
                                    "pct_wKeywords":keywordCt/awardCt,\
                                    "pct_WomenOwned": womenCt/awardCt,\
                                    "pct_SED": sedCt/awardCt,\
                                    "pct_hubZone": hubCt/awardCt}
                
### write out the json file with stats, for review

with open("SBIR_stats.json", 'w') as outfile:
    json.dump(dataStats, outfile)

            


### Validate data is about right compared to previous work with NSF Data from its website...            
nsfData = []
for rec in fulldata:
    if rec["Agency"] == "National Science Foundation": nsfData.append(rec)
    
nsfTopics = []    
for rec in nsfData:
    nsfTopics.append(rec["Topic_Code"])


nsfTopics = list(set(nsfTopics))

### get unique topics for review
topics = []
for rec in fulldata:
    topics.append(rec["Topic_Code"])
    
topics = list(set(topics))


### check how topic coding links up
grants821 = [x for x in fulldata if x['Topic_Code'] == '821']

