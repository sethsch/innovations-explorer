#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb 28 16:29:43 2021

@author: sethschimmel
"""

from pyproj import Proj, transform
import pandas as pd
import time

outProj = Proj('epsg:3857')
inProj = Proj('epsg:4269')


df = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/myapp/data/cd116_sbirRecipients.csv")
df.columns

leafProj = []
for (x,y) in zip(df.Longitude,df.Latitude):
    start = time.time()
    leafProj.append(transform(inProj,outProj,x,y))
    print(time.time() - start)

df["long_proj"] = [x[0] for x in leafProj]
df["lat_proj"] = [x[1] for x in leafProj]

df.to_csv("cd116_sbirRecipients_epsg3857_pythontransform.csv")
