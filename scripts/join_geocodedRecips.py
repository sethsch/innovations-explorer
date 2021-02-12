#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Feb  6 17:09:47 2021

this script takes the geocoded recipients data and joins it back into the awards data

then, we grab the geocoded recipients data with joined in information for the 113th and 116th Congress 
and add it into the awards file too

the result is an awards file that has GEOID/FPS identifiers for its recipients district (113th, 116th and 117th congress) and county

@author: sethschimmel
"""

import pandas as pd

## load recipients file
recips = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_recipients_geocodio.csv")

## load awards file
awards = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018_noAbstract.csv")


## make recipients into a dict
## add recipients geocoding info from dict into awwards file

recips.columns.tolist()

recipsDict = {}

for index,row in recips.iterrows():
    ## there are repeat companies with different addresses and DUNS#, 
    ## so the key is made to be maximally unique -- it would be interesting to investigate movement of grantees...
    key = str(row["DUNS"])+str(row["Company"])+str(row["Address1"])+\
        str(row["Address2"])+str(row["City"])+str(row['State'])+str(row["Zip"])
    # there were a significant number of mismatches, this normalization reduced ~1600 to ~90
    key = key.lower().replace(" ","")
    recipsDict[key] = {"latitude": row["Latitude"],\
                       "longitude": row["Longitude"],\
                        "cd117" : row["Congressional District"],\
                        "STATEFPS": row["State FIPS"],\
                        "CTYFPS": row["County FIPS"]}


## join the info into the awards dataset
awards["latitude"] = ""
awards["longitude"] = ""
awards["cd117"] = ""
awards["STATEFPS"] = ""
awards["CTYFPS"] = ""

errorIndices = []
for index,row in awards.iterrows():
    try:
        key = str(row["DUNS"])+str(row["Company"])+str(row["Address1"])+\
            str(row["Address2"])+str(row["City"])+str(row['State'])+str(row["Zip"])
        # there were a significant number of mismatches, this normalization reduced ~1600 to ~90
        key = key.lower().replace(" ","")
        awards.loc[index,"latitude"] = recipsDict[key]['latitude']
        awards.loc[index,"longitude"] = recipsDict[key]['longitude']
        awards.loc[index,"cd117"] = recipsDict[key]['cd117']
        awards.loc[index,"STATEFPS"] = recipsDict[key]['STATEFPS']
        awards.loc[index,"CTYFPS"] = recipsDict[key]['CTYFPS']
    except:
        errorIndices.append(tuple((index,key)))



## last, get the cd113 and cd116 data out of the qGIS join files... so we have all CDs and CTYFPS in the data so that we can use it in various ways.


cd113 = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/shp/cd113_sbirRecipients.csv")
cd116 = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/shp/cd116_sbirRecipients.csv")

cd113.columns.tolist()

cd116.columns.tolist()
cd116.columns = [x.replace("cd116_","") for x in cd116.columns.tolist()]
cd116.columns


awards["CD113FP"] = ""
awards["GEOID_CD113"] = ""
awards["CD116FP"] = ""
awards["GEOID_CD116"] = ""
awards["AFFGEOID_CD116"] = ""
awards["DISTRNAME_CD116"] = ""


cd113Dict = {}
for index,row in cd113.iterrows():
    key = str(row["DUNS"])+str(row["Company"])+str(row["Address1"])+\
            str(row["Address2"])+str(row["City"])+str(row['State'])+str(row["Zip"])
        # there were a significant number of mismatches, this normalization reduced ~1600 to ~90
    key = key.lower().replace(" ","")
    cd113Dict[key] = {"CD113FP":row["CD113FP"],\
                      "GEOID_CD113":row["GEOID"]}
        
        
cd116Dict = {}
for index,row in cd116.iterrows():
    key = str(row["DUNS"])+str(row["Company"])+str(row["Address1"])+\
            str(row["Address2"])+str(row["City"])+str(row['State'])+str(row["Zip"])
        # there were a significant number of mismatches, this normalization reduced ~1600 to ~90
    key = key.lower().replace(" ","")
    cd116Dict[key] = {"CD116FP":row["CD116FP"],\
                      "GEOID_CD116":row["GEOID"],\
                      "AFFGEOID_CD116":row["j_AFFGEOID"],\
                      "DISTRNAME_CD116":row["j_distr_name"]}
        

awards.columns.tolist()
cdErrors = []

import time
## wget the cd113 and cd116 info from the dicts and join it into the awards dataframe
for index,row in awards.iterrows():
    start = time.time()
    try:
        key = str(row["DUNS"])+str(row["Company"])+str(row["Address1"])+\
            str(row["Address2"])+str(row["City"])+str(row['State'])+str(row["Zip"])
        # there were a significant number of mismatches, this normalization reduced ~1600 to ~90
        key = key.lower().replace(" ","")
        awards.loc[index,"CD113FP"] = cd113Dict[key]["CD113FP"]
        awards.loc[index,"GEOID_CD113"] = cd113Dict[key]["GEOID_CD113"]
        awards.loc[index,"CD116FP"] = cd116Dict[key]["CD116FP"]
        awards.loc[index,"GEOID_CD116"] = cd116Dict[key]["GEOID_CD116"]
        awards.loc[index,"AFFGEOID_CD116"] = cd116Dict[key]["AFFGEOID_CD116"]
        awards.loc[index,"DISTRNAME_CD116"] = cd116Dict[key]["DISTRNAME_CD116"]
        duration = time.time() - start
        print(index," -",duration," sec")
    except:
        cdErrors.append(index)
        
        
awards.to_csv("sbir2008to2018_geoRefed_FINAL_01.csv")
   
err1 = pd.DataFrame()
err1["index"] = [x for (x,y) in errorIndices]
err1["key"] = [y for (x,y) in errorIndices]    


err2 = pd.DataFrame()
err2["index"] = [x for x in cdErrors]


err1.to_csv("recipsErrors_1.csv")
err2.to_csv("recipsErrors_2_CD.csv")
