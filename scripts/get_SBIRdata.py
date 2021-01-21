#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Jan 19 18:38:40 2021

This script is to fetch data from SBIR.gov through their Awards API

Info can be found at: https://www.sbir.gov/api/awards

UPDATE: the row limit and paging on the API is unclear... not using this anymore... manually downloaded
@author: sethschimmel
"""

import requests

url = "https://www.sbir.gov/api/awards.json"
topics = ""

data = {}

status = {}

pages = list(range(0,8000,1000))


reqs = []
for p in pages:
    x = url+'?start='+str(p)
    reqs.append(x)
        
years = [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018]

urls = []   
for y in years:
    for r in reqs:
        urls.append(r+"&rows=1000&year="+str(y))
    
for u in urls:
    response = requests.get(u)
    status[u] = response.status_code
    j = response.json()
    data[u] = j
   
    
urls

a = requests.get(urls[0]).json()
b = requests.get(urls[1]).json()
wStart = requests.get("https://www.sbir.gov/api/awards.json?start=0&year=2008").json()   
wStart = requests.get("https://www.sbir.gov/api/awards.json?start=8000&year=2008").json()   

woStart = requests.get("https://www.sbir.gov/api/awards.json?year=2008").json()

################# SOLICITATIONS

solicitations = "https://www.sbir.gov/api/solicitations.json?rows=1000&closed=1"

solData = requests.get(solicitations).json()

with open("sbirSolicitations_ALLCLOSED.json", 'w') as outfile:
    json.dump(solData, outfile)

      

