#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Oct 20 20:40:09 2020





@author: sethschimmel
"""
import pandas as pd
import re
def pre_process(text):
    if str(text) == "nan":
        text=""
    # lowercase
    text=text.lower()
    
    #remove tags
    text=re.sub("","",text)
    
    # remove special characters and digits
    text=re.sub("(\\d|\\W)+"," ",text)
    
    return text




df = pd.read_csv("/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/sbir_2008to2018_textFields_finalParse.csv")

df.columns

df['text'] = df['text'].apply(lambda x:pre_process(x))

df['parsed'] = df['text']


######### Count Vectorizer
from sklearn.feature_extraction.text import CountVectorizer


#load a set of stop words
from stop_words import get_stop_words

stopwords = get_stop_words('en')

#get the text column 
docs=df['parsed'].tolist()



#create a vocabulary of words, 
#ignore words that appear in 40% of documents, 
#eliminate stop words
cv=CountVectorizer(max_df=0.40,stop_words=stopwords, ngram_range=(1,3))
word_count_vector=cv.fit_transform(docs)




from sklearn.feature_extraction.text import TfidfTransformer

tfidf_transformer=TfidfTransformer(smooth_idf=True,use_idf=True)
tfidf_transformer.fit(word_count_vector)

def sort_coo(coo_matrix):
    tuples = zip(coo_matrix.col, coo_matrix.data)
    return sorted(tuples, key=lambda x: (x[1], x[0]), reverse=True)

def extract_topn_from_vector(feature_names, sorted_items, topn=10):
    """get the feature names and tf-idf score of top n items"""
    
    #use only topn items from vector
    sorted_items = sorted_items[:topn]

    score_vals = []
    feature_vals = []
    
    # word index and corresponding tf-idf score
    for idx, score in sorted_items:
        
        #keep track of feature name and its corresponding score
        score_vals.append(round(score, 3))
        feature_vals.append(feature_names[idx])

    #create a tuples of feature,score
    #results = zip(feature_vals,score_vals)
    results= {}
    for idx in range(len(feature_vals)):
        results[feature_vals[idx]]=score_vals[idx]
    
    return results






# you only needs to do this once, this is a mapping of index to 
feature_names=cv.get_feature_names()

df["tfidf_keywords"] = ""
df.iterrows()
tfidfs = []

for i in range(0,len( docs)):
    print(i)
    # get the document that we want to extract keywords from
    doc = docs[i]

    #generate tf-idf for the given document
    tf_idf_vector=tfidf_transformer.transform(cv.transform([doc]))
    
    #sort the tf-idf vectors by descending order of scores
    sorted_items=sort_coo(tf_idf_vector.tocoo())
    
    #extract only the top n; n here is 10
    keywords=extract_topn_from_vector(feature_names,sorted_items,10)
    tfidfs.append(keywords)
    
    # now print the results
    #print("\n=====Doc=====")
    #print(doc)
    #print("\n===Keywords===")
    #for k in keywords:
    #    print(k,keywords[k])


df['tfidf_keywords'] = tfidfs
df.to_csv("mathyTFIDF_sbir2008to2018.csv")

##################### rake and textrank

from gensim.summarization import keywords

class TextRankImpl:

    def __init__(self, text):
        self.text = text

    def getKeywords(self):
        return (keywords(self.text).split('\n'))
    
    
    
from rake_nltk import Rake

class RakeImpl:

    def __init__(self, text):
        self.text = text
        self.rake = Rake()

    def getKeywords(self):
        self.rake.extract_keywords_from_text(self.text)
        return self.rake.get_ranked_phrases()
    


TextRankImpl(str(docs[9])).getKeywords()[:10]


df['textrank'] = ""

textrank = []
for index,row in df.iterrows():
    print(index)
    textrank.append(keywords(row['parsed']).split('\n'))

df['textrank']  = textrank
df.to_csv("textrank_sbir2008to2018.csv")



### RAKE gives too long of phrases... 
df['rake'] = [RakeImpl(str(x)).getKeywords()[:10] for x in df.parsed]




df.to_csv("SBIR_keywordsExtract_2010to2018.csv")


#### another round of cleanup
cd /Users/sethschimmel/Documents/Scripts, Graphs, Datasets/NSF and NEH/Data
import pandas as pd
df = pd.read_csv("SBIR_keywordsExtract_2010to2018.csv")


df.columns
import ast
df['tfidf_keywords'] = [ ast.literal_eval(x) for x in df.tfidf_keywords]
df['textrank'] = [ ast.literal_eval(x) for x in df.textrank]
df['rake'] = [ ast.literal_eval(x) for x in df.rake]


#  for now, this excludes the textrank phrases, which are usually too long
df["all_keys"] = [[list(x.keys()),z] for (x,y,z) in zip(df.tfidf_keywords,df.textrank,df.rake)]



from itertools import chain


df["all_keys"] = [list(chain.from_iterable(x)) for x in df.all_keys]
# clean up the keywords from funky punct residuals
for index,row in df.iterrows():
    all_keys = []
    for k in row["all_keys"]:
        if "small business" in k:
            pass
        else:
            all_keys.append(k.replace("< br />","").replace("<","").replace(">","").replace("/","").replace(".",""))
    df.at[index,"all_keys"] = all_keys


# split the keywords and phrases into indiv tokens
df["keytokens"] = [[] for x in df.index]
for index,row in df.iterrows():
    keytokens = []
    for k in row["all_keys"]:
        splitted = k.split(" ")
        for s in splitted:
            keytokens.append(s)
    df.at[index,"keytokens"] = keytokens
    
        
import collections

collections.Counter(df["keytokens"][0]).most_common(6)
# find the longest phrases with 
df["final_keyphrases"] = [[] for x in df.index]

## get the longest phrases containing the most common words
## get the top TFIDF terms and textrank's bigrams

from operator import itemgetter 

for index,row in df.iterrows():
    final = []
    
    # longest phrases containing 7 most common words
    common = collections.Counter(row["keytokens"]).most_common(7)
    common = [x for (x,y) in common]
    for cw in common:
        phrases = [x for x in row["all_keys"] if cw in x]
        longest = max(phrases, key = len) 
        final.append(longest)
        
        
    # top tfidf terms, longest phrase if multiple contain same words
    tfTerms = dict(sorted(row["tfidf_keywords"].items(), key = itemgetter(1), reverse = True)[:4]) 
    tfTerms = list(set(tfTerms))
    for term in tfTerms:
        others = [t for t in tfTerms if term in t]
        longest = max(others, key=len)
        final.append(longest)
        
    # bigrams from textrank
    bigrams = [x for x in row["textrank"] if x.count(" ") == 1]
    for b in bigrams:
        final.append(b)
        
    final = list(set(final))
    
    for i in range(0,len(final)):
        final[i] = final[i].replace("_"," ").replace("mesh","(MeSH)")
        
    final = sorted(list(set(final)),key=len)
    final = re.sub('[\]\[\']','',str(final))
    df.at[index,"final_keyphrases"] = final
    

# finally, clean up the program codes
    
df.columns
import re 

df["finalcodes"] = [[] for x in df.index]

for index,row in df.iterrows():
    finalcodes = []
    if type(row["prog_ref_codes"]) is float:
        pRef = ""
    else:
        pRef = row["prog_ref_codes"]
    if type(row["prog_element_codes_clean"]) is float:
        pElem = ""
    else:
        pElem = row["prog_element_codes_clean"]
    allcodes = pRef.split(";") + pElem.split(";")
    for code in allcodes:
        c =  re.sub('[^A-Za-z\s]+', '', code)
        c = c.title().replace("Ii","II").strip()
        if "sbir" in c.lower():
            pass
        else:
            finalcodes.append(c)
    
    finalcodes = list(set(finalcodes))
    # move the SBIR Phase Info to the be the first item
    phase = [x for x in finalcodes if "Phase" in x]
    if len(phase) != 0:
        finalcodes.insert(0, finalcodes.pop(finalcodes.index(phase[0])))
        
    # list as a string, remove the list formatting characters
    df.at[index,"finalcodes"] = re.sub('[\]\[\']','',str(finalcodes))
    

df.finalcodes[2]

df.to_csv("SBIR_keywordsExtract_2010to2018.csv")
