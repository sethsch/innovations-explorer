#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Dec 11 15:15:41 2020

This script is for reformatting the industry data at the county level from the US census, to create percentages employed in each industry for every county, and to create a % change between 2013 and 2018


@author: sethschimmel
"""



import pandas as pd

import numpy as np
################################################

workers18 = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/ACS_Industry_5yrEst/acs_5Y_2018_county/ACSDP5Y2018.DP03_data_with_overlays_2021-02-06T194852.csv",header=0)
workers13 = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/ACS_Industry_5yrEst/acs_5Y_2013_county/ACSDP5Y2013.DP03_data_with_overlays_2021-02-06T194940.csv")


workers18.columns

keepCols = ["GEO_ID","NAME","DP03_0032E"	,"DP03_0032M"	,"DP03_0032PE"	,"DP03_0032PM"	,"DP03_0033E"	,"DP03_0033M"	,"DP03_0033PE"	,"DP03_0033PM"	,"DP03_0034E"	,"DP03_0034M"	,"DP03_0034PE"	,"DP03_0034PM"	,"DP03_0035E"	,"DP03_0035M"	,"DP03_0035PE"	,"DP03_0035PM"	,"DP03_0036E"	,"DP03_0036M"	,"DP03_0036PE"	,"DP03_0036PM"	,"DP03_0037E"	,"DP03_0037M"	,"DP03_0037PE"	,"DP03_0037PM"	,"DP03_0038E"	,"DP03_0038M"	,"DP03_0038PE"	,"DP03_0038PM"	,"DP03_0039E"	,"DP03_0039M"	,"DP03_0039PE"	,"DP03_0039PM"	,"DP03_0040E"	,"DP03_0040M"	,"DP03_0040PE"	,"DP03_0040PM"	,"DP03_0041E"	,"DP03_0041M"	,"DP03_0041PE"	,"DP03_0041PM"	,"DP03_0042E"	,"DP03_0042M"	,"DP03_0042PE"	,"DP03_0042PM"	,"DP03_0043E"	,"DP03_0043M"	,"DP03_0043PE"	,"DP03_0043PM"	,"DP03_0044E"	,"DP03_0044M"	,"DP03_0044PE"	,"DP03_0044PM"	,"DP03_0045E"	,"DP03_0045M"	,"DP03_0045PE"	,"DP03_0045PM"]


workers18 = workers18.loc[:,keepCols]
workers13= workers13.loc[:,keepCols]


# get the descriptive column names
colNames = list(workers18.loc[0,:])
colNames

# get just the estimates
indust = []
for c in colNames:
    if "Percent Estimate!!" in c:
        indust.append(c)
        
        
# get the indexes of the estimate columns to keep        
industIndex = [colNames.index(x) for x in indust]

# add the name and identifier columns to the index list
industIndex.append(0)
industIndex.append(1)
industIndex

# select the valid data for the estimate columns
workers18 = workers18.iloc[1:,industIndex]
workers13 = workers13.iloc[1:,industIndex]

# get the names to change the column headers
newNames = [colNames[x] for x in industIndex][:14] + ["CTYFIPS","CTY_NAME"]
newNames

workers18.columns = newNames
workers13.columns = newNames



workers18.columns

fullnames = [x.replace("Percent Estimate!!INDUSTRY!!Civilian employed population 16 years and over!!","") for x in workers18.columns if "Estimate!!" in x]
fullnames

shortNames = ["total_worker_pop","pct_agro","pct_construct","pct_manufact","pct_wholesale","pct_retail","pct_transport_util","pct_information","pct_finance_realest","pct_prof_sci_mgmt_adm","pct_edu_health","pct_arts_ent_food_rec","pct_otherserv","pct_public_admin","CTYFIPS","CTY_NAME"] 



workers18.columns, workers13.columns = shortNames,shortNames

indDict = {}
for i in range(1,14):
    indDict[shortNames[i]] = fullnames[i]


for c in shortNames[1:]:
    if "pct_" in c:
        workers18[c] = [float(x)/100 if str(x) != "(X)" else 0 for x in workers18[c] ]
        workers13[c] = [float(x)/100 if str(x) != "(X)" else 0 for x in workers13[c] ]
        
pct_cols = [x for x in shortNames if 'pct_' in x]

for c in pct_cols:
    ind = c.replace("pct","pctRANK")
    workers18[ind] = workers18[c].rank(na_option="bottom",ascending=False)
    workers13[ind] = workers13[c].rank(na_option="bottom",ascending=False)




### this is a function to get the top profiles by county.. it's not necessary for this current iteration of the UI but was used for the shiny dashboard that preceded this project
"""workers18["ind_profile"] = ""
workers13["ind_profile"] = ""
def generate_profiles(workers):
    rnk_cols = [x for x in workers.columns if 'RANK' in x]
    for index,row in workers.iterrows():
        d = {}
        profile = []
        for c in rnk_cols:
            d[c] = row[c]
        for w in sorted(d, key=d.get, reverse=False)[:6]:
            profile.append( w + " ("+str(round(int(d[w]),0))+")" )
            
        profile = ", ".join(profile).replace("pctRANK_","")
        for k,v in indDict.items():
            profile = profile.replace("pct_","").replace(k,v)
            
        workers.at[index,"ind_profile"] = profile
    return(workers)



workers18,workers13 = generate_profiles(workers18), generate_profiles(workers13)"""




######### 



diffDf = pd.DataFrame()

workers18.index = workers18.CTYFIPS
workers13.index = workers13.CTYFIPS

fullDf = workers18.join(workers13, lsuffix='_2018', rsuffix='_2013')




industCols = fullDf.columns.tolist()[1:14]
industCols

for indust in industCols:
    newCol = indust.replace("pct_","delta_").replace("_2018","")
    prevCol = indust.replace("_2018","_2013")
    fullDf[newCol] = [ ((x-y) / y) if y != 0 else np.nan for (x,y) in zip(fullDf[indust],fullDf[prevCol])]

fullDf.to_clipboard()
fullDf.to_csv("ACS_industryEst_5Y_2013and2018_withDeltas.csv")


