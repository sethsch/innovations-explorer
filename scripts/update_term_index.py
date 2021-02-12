import collections
import logging
import re


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