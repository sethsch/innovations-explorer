#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan 20 12:43:32 2021

This script gets some basic stats about the SBIR data

@author: sethschimmel
"""

import json
import os

file = "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018.json"


fulldata= json.load(open(file))
fulldata[0]

dataStats = {}
totAmt = 0.0
awardCt = 0
topicCt = 0
keywordCt = 0
hubCt = 0
sedCt = 0
womenCt = 0
agencies = []
programs = ["SBIR","STTR"]
for rec in fulldata:
    try:
        totAmt += float(rec['Award_Amount'].strip())
    except:
        totAmt += 0
        print(1)
        #print(rec['Award_Amount'])

    awardCt += 1
    if rec["Topic_Code"] != "": topicCt+=1
    if rec["Research_Keywords"] != "": keywordCt +=1
    if rec["Woman_Owned"] != "N": womenCt +=1
    if rec["Socially_and_Economically_Disadvantaged"] != "N": sedCt +=1
    if rec["Hubzone_Owned"] != "N": hubCt +=1
    agencies.append(rec["Agency"])
 
    
dataStats = {}
sttr_totAmt, sbir_totAmt = 0.0, 0.0
sttr_awardCt, sbir_awardCt = 0, 0
sttr_topicCt, sbir_topicCt = 0,0 
sttr_keywordCt, sbir_keywordCt = 0,0
sttr_hubCt, sbir_hubCt = 0,0
sttr_sedCt, sbir_sedCt = 0,0
sttr_womenCt, sbir_womenCt = 0,0

for rec in fulldata:
    if rec["Program"] == "STTR":
        try:
            sttr_totAmt += float(rec['Award_Amount'].strip())
        except:
            sttr_totAmt += 0
            print(1)
            #print(rec['Award_Amount'])
    
        sttr_awardCt += 1
        if rec["Topic_Code"] != "": sttr_topicCt+=1
        if rec["Research_Keywords"] != "": sttr_keywordCt +=1
        if rec["Woman_Owned"] != "N": sttr_womenCt +=1
        if rec["Socially_and_Economically_Disadvantaged"] != "N": sttr_sedCt +=1
        if rec["Hubzone_Owned"] != "N": sttr_hubCt +=1
    elif rec["Program"] == "SBIR":
        try:
            sbir_totAmt += float(rec['Award_Amount'].strip())
        except:
            sbir_totAmt += 0
            print(1)
            #print(rec['Award_Amount'])
    
        sbir_awardCt += 1
        if rec["Topic_Code"] != "": sbir_topicCt+=1
        if rec["Research_Keywords"] != "": sbir_keywordCt +=1
        if rec["Woman_Owned"] != "N": sbir_womenCt +=1
        if rec["Socially_and_Economically_Disadvantaged"] != "N": sbir_sedCt +=1
        if rec["Hubzone_Owned"] != "N": sbir_hubCt +=1
        

    
    
    
    
agencies = list(set(agencies))
programs = list(set(programs))
dataStats["All_Agencies"]  ={ "All_Programs": {\
                                "num_awards": awardCt,\
                                "total_Amount": totAmt,\
                                "pct_wTopic":topicCt/awardCt,\
                                 "pct_wKeywords":keywordCt/awardCt,\
                                 "pct_WomenOwned": womenCt/awardCt,\
                                 "pct_SED": sedCt/awardCt,\
                                 "pct_hubZone": hubCt/awardCt
                                 },\
                             "SBIR" : {"num_awards": sbir_awardCt,\
                                "total_Amount": sbir_totAmt,\
                                "pct_wTopic":sbir_topicCt/sbir_awardCt,\
                                 "pct_wKeywords":sbir_keywordCt/sbir_awardCt,\
                                 "pct_WomenOwned": sbir_womenCt/sbir_awardCt,\
                                 "pct_SED": sbir_sedCt/sbir_awardCt,\
                                 "pct_hubZone": sbir_hubCt/sbir_awardCt
                                 },
                            "STTR":{"num_awards": sttr_awardCt,\
                            "total_Amount": sttr_totAmt,\
                                "pct_wTopic":sttr_topicCt/sttr_awardCt,\
                                 "pct_wKeywords":sttr_keywordCt/sttr_awardCt,\
                                 "pct_WomenOwned": sttr_womenCt/sttr_awardCt,\
                                 "pct_SED": sttr_sedCt/sttr_awardCt,\
                                 "pct_hubZone": sttr_hubCt/sttr_awardCt
                                 }
                                
                            }


awardCt = 0
topicCt = 0
keywordCt = 0
hubCt = 0
sedCt = 0
womenCt = 0
totAmt = 0
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
        totAmt = 0
        for rec in fulldata:
            if ((rec["Agency"] == agency) and (rec["Program"] == p)): 
                awardCt+=1
                try:
                    totAmt += float(rec['Award_Amount'].strip())
                except:
                    totAmt += 0
                    print(fulldata.index(rec))
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
                                    "tot_Amount": totAmt,\
                                    "pct_wTopic":topicCt/awardCt,\
                                    "pct_wKeywords":keywordCt/awardCt,\
                                    "pct_WomenOwned": womenCt/awardCt,\
                                    "pct_SED": sedCt/awardCt,\
                                    "pct_hubZone": hubCt/awardCt}
                
### write out the json file with stats, for review
cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/
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

