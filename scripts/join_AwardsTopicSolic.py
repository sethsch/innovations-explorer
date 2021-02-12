#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Wed Jan 20 12:43:32 2021

This script merges the solicitation and topic info to awards, and removes the PI info

@author: sethschimmel
"""

import json
import os

f_awards = "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018.json"
f_topics = "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbirTopics_2008to2018.json"
f_solic = "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbirSolicitations_ALLCLOSED.json"


awards = json.load(open(f_awards))
topics = json.load(open(f_topics))
solic= json.load(open(f_solic))



### check the fields of each dataset
solic[0].keys()


awards[0]

## these fields are in Awards
 'Solicitation_Number': 'PAS17-065',
 'Solicitation_Year': '2017',
 
solic[76]
## these fields are in Solicitations, which also have a list of topics associated
'solicitation_number': '21.1',
'solicitation_number': 'DE-FOA-0001954'

topics[6]
## topics have these fields
 'SolicitationAgencyURL': 'http://sbir.nasa.gov/solicit-detail/58007',
 'TopicNumber': 'H1.02',
 'SolicitationYear': '2017',
 'SBIRTopicLink': 'https://www.sbir.gov/node/1227055'
 


#### Strategy: unpack solicitations into a dictionary with just Solicitation Number, topics with TopicNumber and SBIRTopicLink; then, we can reconcile awardsa against solicitations and, finally, the correc topic of the solicitation -- since solicitations include full topic info, we shouldn't actually need to consult the Topics Dataset
 


### modify topics and solic so they're a nested dict



from collections import defaultdict
solicDict = defaultdict(list)
topicsDict = defaultdict(list)


solKeys = []
for rec in solic:
    #key = str(rec['solicitation_number'])+'_'+str(rec['sbir_solicitation_link'])
    key = str(rec['solicitation_number']).replace("-","").replace(".","").replace("_","").replace(" ","")
    #key = (str(rec['solicitation_number'])+'|'+str(rec['solicitation_year'])).replace("-","").replace(".","").replace("_","").replace(" ","")
    solKeys.append(key)
    fields = {'sbir_solicitation_link': rec['sbir_solicitation_link'],\
                          'solicitation_number': rec['solicitation_number'],\
                          'solicitation_year': rec['solicitation_year'],\
                        'solicitation_topics': rec['solicitation_topics']}
   
    solicDict[key].append(fields)

awards[9]
topics[8]
# num of topics decreases by ~15%
tops = [rec['TopicNumber']+"|"+rec['SolicitationYear']+"|"+rec["Agency"]+"|"+rec["Program"] for rec in topics]
tops = list(set(tops))
### unpack topics for easier lookup

for rec in topics:
    key = rec['TopicNumber']+"|"+rec['SolicitationYear']+"|"+rec["Agency"]+"|"+rec["Program"]
    key = key.replace(".","").replace("-","").replace(" ","")
    fields = {'sbir_solicitation_link': rec['SBIRTopicLink'],\
                          'solicitation_year': rec['SolicitationYear'],\
                        'title': rec['TopicTitle'],\
                            'topic_number': rec['TopicNumber'],\
                            "description": rec["Description"],\
                                "agency": rec["Agency"],\
                                "program": rec["Program"]}
   
    topicsDict[key].append(fields)

a = solicDict['20131']
# these solicitations are duplicated, have multiple sets of topics/info/links                            
dups = [x for x in solicDict.keys() if len(solicDict[x]) > 1]
awards[9]
b = [x for x in solKeys if x.startswith("PAS")]
awardsSol = []
for rec in awards:
    solNum = str(rec["Solicitation_Number"]).replace("-","").replace(".","").replace("_","").replace(" ","")
    
    topCode = rec['Topic_Code']+"|"+rec['Solicitation_Year']+"|"+rec["Agency"]+"|"+rec["Program"]
    topCode = topCode.replace(".","").replace("-","").replace(" ","")
    solInfo = solicDict[solNum]
    topInfo = topicsDict[topCode]
    rec["sol_info"] = solInfo
    rec["topic_info"] = topInfo
    awardsSol.append(rec)
    """for s in solInfo:
        for t in s["solicitation_topics"]:
            awTop = str(rec["Topic_Code"]).replace("-","").replace(".","").replace("_","").replace(" ","")
            solTop = str(t["topic_number"]).replace("-","").replace(".","").replace("_","").replace(" ","")
            if awTop == solTop: 
                cleanKey = str(rec["Agency_Tracking_Number"])+"|"+str(rec["Contract"])
                awardsDict[cleanKey].append(t)"""
awardsSol[4]
solCt = 0
topCt = 0
awCt = 0
solGrab = 0
topGrab = 0
solEmpty = []
topEmpty = []
for rec in awardsSol:
    awCt += 1
    if rec["Solicitation_Number"] != "": solCt +=1
    if rec["Topic_Code"] != "": topCt +=1
    if rec["sol_info"] != []: 
        solGrab +=1 
    else: 
        solEmpty.append(rec)
    if rec["topic_info"] != []: 
        topGrab +=1 
    else: 
        topEmpty.append(rec)
    
x = awardsSol[0:6]
    
print("% Awards with Solicitation Code",solCt/awCt*100)
print("% Awards with Topic Codes",topCt/awCt*100)
print("% Awards where Solicitations Info was grabbed",solGrab/awCt*100)
print("% Awards where topic info was grabbed",topGrab/awCt*100)


    
### drop the awards columns we're not going to use
### remove the following contact info PI keys:
award_fields = list(awardsSol[0].keys())
rem_fields = ['Contact_Name', 'Contact_Title', 'Contact_Phone', 'Contact_Email', 'PI_Name', 'PI_Title', 'PI_Phone', 'PI_Email', 'RI_Name', 'RI_POC_Name', 'RI_POC_Phone']

keep_fields = [x for x in award_fields if x not in rem_fields]


awardsClean = []

for rec in awards:
    newrec = rec
    for f in rem_fields:
        newrec.pop(f,newrec)
    outDict = newrec
    awardsClean.append(outDict)
        
import random
my_randoms = random.sample(range(65479), 10)

sample = [awardsClean[i] for i in my_randoms]


with open('sample_pulledTopSol.json', 'w', encoding='utf-8') as f:
    json.dump(sample, f, ensure_ascii=False, indent=4)
    
    
import pandas as pd    
awardsDf = pd.DataFrame(awards)
awardsDf.to_csv("sbir_Awards_2008to2018.csv")
