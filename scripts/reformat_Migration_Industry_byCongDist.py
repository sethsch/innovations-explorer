#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Fri Dec 11 15:15:41 2020

@author: sethschimmel
"""



import pandas as pd


"""migration = pd.read_csv("/Users/sethschimmel/Documents/Scripts, Graphs, Datasets/NSF and NEH/Data/ACS_1year_geomobility_congdist_2018/ACSSE2018.K200701_data_with_overlays_2020-12-03T202937.csv",header=1)
migration.columns

moes = [x for x in migration.columns if "Error" in x]

migration = migration.drop(columns=moes)
migration.columns

mig_cats = [x.replace("Estimate!!Total!!","") for x in migration.columns if "Total!!" in x]

migration.columns = ["GEOID","distr_name","population","stable","mv_smCty","mv_diffCty","mv_diffSt","mv_abroad"]

migDict = {}
migDict["mv_abroad"] = "Emigration from abroad"
migDict["mv_diffCty"] = "Moved from different county"
migDict["mv_diffSt"] = "Moved from different state"
migDict["mv_smCty"] = "Moved within same county"
migDict["stable"] = "Stayed put"

for c in migration.columns.tolist()[3:]:
    migration["pct_"+c] = migration[c] / migration["population"]
    
    
migration["geoid_clean"] = [x[-4:] for x in migration.GEOID]

pct_cols = [x for x in migration.columns if 'pct' in x]

for c in pct_cols:
    cat = c.replace("pct","pctRANK")
    migration[cat] = migration[c].rank(na_option="bottom",ascending=False)
    
migration["mig_profile"] = ""
rnk_cols = [x for x in migration.columns if 'RANK' in x]
# for now I'm only interested in stability and movement beyond the area
rnk_cols.remove("pctRANK_mv_smCty")
for index,row in migration.iterrows():
    d = {}
    profile = []
    for c in rnk_cols:
        d[c] = row[c]
    for w in sorted(d, key=d.get, reverse=False)[:6]:
        profile.append( w + " ("+str(round(int(d[w]),0))+")" )
        
    profile = ", ".join(profile).replace("pctRANK_","")
    for k,v in migDict.items():
        profile = profile.replace(k,v)
        
    migration.at[index,"mig_profile"] = profile

migration.mig_profile[15]

migration.to_csv("ACS2018Migration_1year_116CongDist.csv")"""

################################################

workers = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/ACS_Industry_5yrEst/ACS_5Y_2018_indust.csv",header=0)

workers.columns

#moes = [x for x in workers.columns if "Error" in x]

#workers = workers.drop(columns=moes)

workers.columns

#fullnames = [x.replace("Estimate!!Total!!","") for x in workers.columns if "Total!!" in x]
#fullnames

#workers.columns = ["GEOID","distr_name","total_worker_pop","agro","construct","manufact","wholesale","retail","transport_util","information","finance_realest","prof_sci_mgmt_adm","edu_health","arts_ent_food_rec","otherserv","public_admin"]

#indDict = {}
#for i in range(0,len(workers.columns.tolist()[3:])):
#    indDict[workers.columns[i+3]] = fullnames[i]


for c in workers.columns.tolist()[3:]:
        workers["pct_"+c] = workers[c] / workers["total_worker_pop"]

pct_cols = [x for x in workers.columns if 'pct' in x]

for c in pct_cols:
    ind = c.replace("pct","pctRANK")
    workers[ind] = workers[c].rank(na_option="bottom",ascending=False)

workers["ind_profile"] = ""
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
        profile = profile.replace(k,v)
        
    workers.at[index,"ind_profile"] = profile

workers["geoid_clean"] = [x[-4:] for x in workers.GEOID]




workers.ind_profile[0]
workers.to_csv("ACS2018WorkerIndustries_5yearEst_116CongDist.csv")



fullDf = pd.DataFrame()
fullDf["GEOID"] = workers.GEOID
fullDf.index=fullDf.GEOID
migration.index = migration.GEOID
fullDf["geoid_clean"] = workers.geoid_clean
fullDf["ind_profile"] = workers.ind_profile
fullDf = fullDf.merge(migration.mig_profile,left_index=True,right_index=True)
fullDf.to_csv("ACS2018_industry_mobility_profiles_116CongDist.csv")
