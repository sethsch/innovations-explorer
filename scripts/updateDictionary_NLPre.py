#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Jan 23 18:53:53 2021

@author: sethschimmel
"""

cd /Users/sethschimmel/Documents/GitHub/CUNY-Capstone/scripts

from update_term_index import update_term_index
from nlpre import titlecaps, dedash, identify_parenthetical_phrases
from nlpre import replace_acronyms, replace_from_dictionary
import re
import logging
import pandas as pd

docList = {"doc_001":("LYMPHOMA SURVIVORS IN KOREA. Describe the correlates of unmet needs "
        "among non-Hodgkin lymphoma (NHL) surv- ivors in Korea and identify "
        "NHL patients with an abnormal white blood cell count.")}

data = pd.read_csv("/Users/sethschimmel/Documents/GitHub/w2v_pipeline_sbir/pipeline_src/data_parsed/sbir_2008to2018_textFields.csv")


#data = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir/sbir_2008to2018.json","r",encoding="utf-8"))



data[0].keys()

## the default MeSH takes an extra 2s per record; excluded for first run
#"*MeSH*_": None,\
dict_loc = { 
                    "*EIGE*_": "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/eige_individuals.csv",\
                    "*AGROVOC*_": "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/agrovoc_clean.csv",\
                        "*REEGLE*_": "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/reegle_clean.csv",\
                        "*GEMET*_": "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/gemet_clean.csv",\
                        "*EUSCIVOC*_":"/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/euroscivoc_clean.csv",\
                        "*EUVOC*_": "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/eurovoc_clean.csv",\
                            "*STW*_":"/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/vocab_taxon_lod/clean_dictionaries/stw_clean.csv"}


docList = {}
for index, row in data.iterrows():
    docList[row['_ref']] = row["text"]


#for i in range(0,len(data)):
#    key = str(i)+"_"+str(data[i]["Agency_Tracking_Number"])+str(data[i]["Contract"])
#    doc = str(data[i]["Award_Title"]) +"   "+ str(data[i]["Abstract"])
#    docList[key] = doc.replace("\n","  ")
    


#docListDf = pd.DataFrame.from_dict(da)

import time

def process_list(docList):
    i = 0

    for k,v in docList.items():
        
        start = time.time()
            
        inDict = {k:{}}
        for d in list(dict_loc.keys()):
            inDict[k][d] = []
            
        
        #ABBR = identify_parenthetical_phrases()(docList[k])
    
        #parsers = [dedash(), titlecaps(), replace_acronyms(ABBR)]
        
        #for f in parsers:
        #    docList[k] = f(docList[k])
        for pre,path in dict_loc.items():
            #print(pre)
            docList[k] = replace_from_dictionary(prefix=pre,f_dict=path)(docList[k])
            updates = update_term_index(vocab_key=pre,dict_in=inDict,doc_key=k)(doc=docList[k])
            docList[k] = updates[0]
            mainIndex.update( updates[1] )
        

        #do some stuff
        stop = time.time()
        duration = stop-start
        i+=1
        print("Record",str(i)," of", len(list(docList.keys()))," - took ", round(duration,3),"seconds")
  

sampleKeys = list(docList.keys())[:10]
sampleList = {key: docList[key] for key in sampleKeys}

mainIndex = {}
for doc in docList.keys():
    
    mainIndex[doc] = {}
    for d in list(dict_loc.keys()):
        # this later will be updated to be a dict that also captures # occurences
        mainIndex[doc][d] = []
     

process_list(docList)


import json
# the json file where the output must be stored 
out_file = open("sbir_2008to2018_VOCABINDEX.json", "w") 
  
json.dump(mainIndex, out_file, indent = 6) 
  
out_file.close() 

 # Save a dictionary into a pickle file.
import pickle
pickle.dump( mainIndex, open( "sbir_2008to2018_VOCABINDEX.pickle", "wb" ) )

mainIndex[8789]





### Get the MeSH tagged documents from the w2vec pipline
mesh = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir_2008to2018_textFields_MeSH.csv")
mesh.columns
meshList = {}
for index,row in mesh.iterrows():
    meshList[row["_ref"]] = row['text']

sevDict = mainIndex          

i=0
for k,v in meshList.items():
    start = time.time()
    inDict = {k:{}}
    inDict[k]["*MeSH*_"] = []
    updates = update_term_index(vocab_key="*MeSH*_",dict_in=inDict,doc_key=k)(doc=meshList[k])
    mainIndex.update( updates[1] ) 
    stop = time.time()
    duration = stop-start
    i+=1
    print("MESH Record",str(i)," of", len(list(docList.keys()))," - took ", round(duration,3),"seconds")       


out_file = open("sbir_2008to2018_MESHINDEX.json", "w") 
json.dump(mainIndex, out_file, indent = 6) 
  
out_file.close() 



## get the seven vocabs dict and add in the MeSH dict
sevDict = json.load(open("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir_2008to2018_VOCABINDEX.json","r"))
sevDict['0']
mainIndex[0]

for k,v in mainIndex.items():
    sevDict[str(k)].update(v)

sevDict['9887']


out_file = open("sbir_2008to2018_FULLINDEX.json", "w") 
json.dump(sevDict, out_file, indent = 6) 
  
out_file.close() 



## convert index into having counts
from collections import Counter


















def update_dictionary(doc_in, doc_key, vocab_key, dict_in):
    # return an updated dictionary index for a given vocabulary,
    # prepares to advance to the next dictionary
    
    '''
     args:
         doc_in: previously tagged input document
         doc_out: cleaned up document ready for next round
         doc_key: id for the document
         vocab_key: name of the vocabulary
         dict_in: Index of document / vocabulry hits
    '''
    
    
    # the list of all hits    
    # for input document, extract all dictionary hits and add them to the dictionary
    hits = re.findall(r"\*[\_A-Za-z]+\*[\_a-zA-z]+",doc_in)
    
    # add an index entry for the given vocabulary for the document
    vocabDict = {vocab_key: hits}
    dict_in[doc_key].update(vocabDict)
    
    # detag the document
    doc_out = doc_in
    for h in hits:
        doc_out = doc_out.replace(h,h.replace(vocab_key,"").replace("_"," "))
    
    
    return [doc_out,dict_in]
    



## in between dict parsers, this should be called too
    
class update_term_index(object):


    """
    After replace_dictionary is run:
        1. update the user's index of terms found in each document
        2. remove the prefix tag from the previous dictionary so another round of tagging can occur

    Note: this class should be modified to enhance flexibility with respect to prefix/suffix tagging.
    For now, note that tags should be flanked appear flanked with asterisks and ending with underscore,
        like: *MeSH*_
    TO DO: replace the regex to one which is simply r"^"+vocab_key+([a-zA-Z0-9]+[\_]*)
    """

    def __init__(self, prefix=False, suffix=False,vocab_key="",dict_in=None,doc_key=""):
        """
        Initialize the indexer.

        Args:
            prefix: if the replacer used a prefix, set to true to look for prefix tagged terms
            suffix: if the replacer used a suffix, set to true to look for suffix tagged terms
            vocab_key: the tag prefix/suffix used for the currently tagged dictionary
            dic_in: a dictionary object to be used as a document/vocab index
            doc_key: a document id to be used in the document/vocab index
        """
        self.logger = logging.getLogger(__name__)


        self.prefix = prefix
        self.suffix = suffix
        self.vocab_key = vocab_key
        self.doc_key = doc_key
        self.dict_in = dict_in


    def __call__(self, doc):
        """
        Runs the indexer.

        Args:
            doc: the previously tagged document string
        Returns:
            doc_out: a de-tagged document string
            dict_in: the updated document/term index
        """

        
        # the list of all hits    
        # for input document, extract all dictionary hits and add them to the dictionary
        # TO DO: update to include True/False check for prefix/suffix,
        # TO DO: update to include a regex like: r"^"+vocab_key+([a-zA-Z0-9]+[\_]*) 
        #   to allow for more flexibletagging prefix/suffix
        hits = re.findall(r"\*[\_A-Za-z]+\*[\_a-zA-z]+",doc)
        
        # add an index entry for the given vocabulary for the document
        vocabDict = {self.vocab_key: hits}
        self.dict_in[self.doc_key].update(vocabDict)
        
        # detag the document
        doc_out = doc
        for h in hits:
            doc_out = doc_out.replace(h,h.replace(self.vocab_key,"").replace("_"," "))
        
        return [doc_out,self.dict_in]




print(text)

outtext = "lymphoma survivors in korea .Describe the correlates of unmet needs among non_Hodgkin_lymphoma ( non_Hodgkin_lymphoma ) survivors in Korea and identify non_Hodgkin_lymphoma patients with an abnormal *MeSH*_Leukocyte_Count ."
    

hits








