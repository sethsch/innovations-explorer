#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sun Feb  7 18:10:57 2021

this script makes some summary stats of the coverage of vocabulary terms versus mathy keywords versus the given research keywords, and disaggregates by year and agency


@author: sethschimmel
"""

import pandas as pd
import numpy as np


df = pd.read_excel("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/vocab_mathy_analysis_v2.xlsx",sheet_name="vocab_mathy_analysis_v2",header=1)

cols = df.columns.tolist()
cols

deptYear = df.groupby(['agency','award_year']).agg(
        numAwards = ('_ref','count'),\
    EIGE_sum = ('EIGEnum_vocab',sum),\
    AGROVOC_sum = ('AGROVOCnum_vocab',sum),\
    REEGLE_sum = ('REEGLEnum_vocab',sum),\
    GEMET_sum = ('GEMETnum_vocab', sum),\
    EUSCIVOC_sum = ('EUSCIVOCnum_vocab',sum),\
    EUVOC_sum = ('EUVOCnum_vocab',sum),\
    STW_sum = ('STWnum_vocab',sum),\
    MESH_sum = ('MeSHnum_vocab',sum)  ,\
    EIGEpct_mathy = ('EIGEpct_mathy',lambda a: a[a!=0].mean()),\
    EIGEpct_given = ('EIGEpct_given',lambda a: a[a!=0].mean()),\
    AGROVOCpct_mathy = ('AGROVOCpct_mathy',lambda a: a[a!=0].mean()),\
    AGROVOCpct_given = ('AGROVOCpct_given',lambda a: a[a!=0].mean()),\
    REEGLEpct_mathy = ('REEGLEpct_mathy',lambda a: a[a!=0].mean()),\
    REEGLEpct_given = ('REEGLEpct_given',lambda a: a[a!=0].mean()),\
    GEMETpct_mathy = ('GEMETpct_mathy',lambda a: a[a!=0].mean()),\
    GEMETpct_given = ('GEMETpct_given',lambda a: a[a!=0].mean()),\
    EUSCIVOCpct_mathy = ('EUSCIVOCpct_mathy',lambda a: a[a!=0].mean()),\
    EUSCIVOCpct_given = ('EUSCIVOCpct_given',lambda a: a[a!=0].mean()),\
    EUVOCpct_mathy = ('EUVOCpct_mathy',lambda a: a[a!=0].mean()),\
    EUVOCpct_given = ('EUVOCpct_given',lambda a: a[a!=0].mean()),\
    STWpct_mathy = ('STWpct_mathy',lambda a: a[a!=0].mean()),\
    STWpct_given = ('STWpct_given',lambda a: a[a!=0].mean()),\
    MeSHpct_mathy = ('MeSHpct_mathy',lambda a: a[a!=0].mean()),\
    MeSHpct_given = ('MeSHpct_given',lambda a: a[a!=0].mean())

    )




deptYear.to_clipboard()



deptSummary = df.groupby(['agency']).agg(
    numAwards = ('_ref','count'),\
    EIGE_sum = ('EIGEnum_vocab',sum),\
    AGROVOC_sum = ('AGROVOCnum_vocab',sum),\
    REEGLE_sum = ('REEGLEnum_vocab',sum),\
    GEMET_sum = ('GEMETnum_vocab', sum),\
    EUSCIVOC_sum = ('EUSCIVOCnum_vocab',sum),\
    EUVOC_sum = ('EUVOCnum_vocab',sum),\
    STW_sum = ('STWnum_vocab',sum),\
    MESH_sum = ('MeSHnum_vocab',sum)  ,\
    EIGEpct_mathy = ('EIGEpct_mathy',lambda a: a[a!=0].mean()),\
    EIGEpct_given = ('EIGEpct_given',lambda a: a[a!=0].mean()),\
    AGROVOCpct_mathy = ('AGROVOCpct_mathy',lambda a: a[a!=0].mean()),\
    AGROVOCpct_given = ('AGROVOCpct_given',lambda a: a[a!=0].mean()),\
    REEGLEpct_mathy = ('REEGLEpct_mathy',lambda a: a[a!=0].mean()),\
    REEGLEpct_given = ('REEGLEpct_given',lambda a: a[a!=0].mean()),\
    GEMETpct_mathy = ('GEMETpct_mathy',lambda a: a[a!=0].mean()),\
    GEMETpct_given = ('GEMETpct_given',lambda a: a[a!=0].mean()),\
    EUSCIVOCpct_mathy = ('EUSCIVOCpct_mathy',lambda a: a[a!=0].mean()),\
    EUSCIVOCpct_given = ('EUSCIVOCpct_given',lambda a: a[a!=0].mean()),\
    EUVOCpct_mathy = ('EUVOCpct_mathy',lambda a: a[a!=0].mean()),\
    EUVOCpct_given = ('EUVOCpct_given',lambda a: a[a!=0].mean()),\
    STWpct_mathy = ('STWpct_mathy',lambda a: a[a!=0].mean()),\
    STWpct_given = ('STWpct_given',lambda a: a[a!=0].mean()),\
    MeSHpct_mathy = ('MeSHpct_mathy',lambda a: a[a!=0].mean()),\
    MeSHpct_given = ('MeSHpct_given',lambda a: a[a!=0].mean())

    )
    
deptSummary.to_clipboard()
