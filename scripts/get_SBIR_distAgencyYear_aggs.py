#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Mar 13 13:41:17 2021

this script makes district level aggregates of agency funding by year, for use in 
a parcoords plot, or an alternate district/agency level graph

@author: sethschimmel
"""

import pandas as pd
import numpy as np
import json

df = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/myapp/data/sbir_2008to2018_geoRefed.csv")

df["Award_Amount"] = [float(x) for x in df.Award_Amount]


agencies = [x for x in list(set(df.Agency)) if not(x is np.nan)]
years = [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018]
data = []

df.Award_Amount.sum()

for dist in list(set(df.AFFGEOID_CD116)):
    d = df[df.AFFGEOID_CD116 == dist]
    for y in years:
        dy = d[d.Award_Year == y]
        rec = {"district":dist,"year":y}
        if len(dy.index) == 0:
            for a in agencies:
                rec[a] = 0
            data.append(rec)
        else:
            for a in agencies:
                dya = dy[dy.Agency == a]
                if len(dya.index) == 0:
                    rec[a] = 0
                else:
                    rec[a] = dya.Award_Amount.sum()
            data.append(rec)
        
        
list(set(df.AFFGEOID_CD116))

with open('/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/myapp/data/cd116_agency_year_fund_aggs.json', 'w') as fout:
    json.dump(data , fout)
        
        
## save to csv to compare file size (273kb vs 2.1mb)   
outDf = pd.DataFrame(data)
outDf.to_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/myapp/data/cd116_agency_year_fund_aggs.csv")        
        
    