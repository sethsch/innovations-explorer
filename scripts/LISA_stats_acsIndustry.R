library(sf)
library(tmap)
library(dplyr)
library(sp)
library(spdep)
library(rgdal)


setwd("~/Documents/Scripts, Graphs, Datasets/NSF and NEH/Geospatial analysis")


mobility <- st_read( "/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/shp/joined_2013_acsIndust_cd113.shp")
#st_crs(mob)                    

#plot(st_geometry(mobility))

names(mobility)

cleanCols <- names(mobility)[c(11:27)]

for (i in cleanCols)
{
  mobility[[i]] <- as.numeric(as.character(mobility[[i]]))
}

names(mobility) <- c("STATEFP"  ,  "CD116FP"  ,  "AFFGEOID"  , "GEOID"    ,  "LSAD"   ,    "CDSESSN" ,  
                     "ALAND"   ,   "AWATER"  ,  "amount_cou", "amount_sum", "pctAgriculture" ,"pctConstruction",
                     "pctManuf", "pctWholesale","pctRetail", "pctTransport", "pctInfo", "pctFinReal",
                     "pctProfSci", "pctEduHealth","pctArtsEntFood", "pctOtherServ", "pctPubAdmin" ,"industry_profile",
                     "pctStable", "pctAllEmigrated","pctOutState", "mig_profile")


industryNames <- c("Agriculture, forestry, fishing and hunting, and mining",
                   "Construction",
                   "Manufacturing",
                   "Wholesale trade",
                   "Retail trade",
                   "Transportation and warehousing, and utilities",
                   "Information",
                   "Finance and insurance, and real estate and rental and leasing",
                   "Professional, scientific, and management, and administrative and waste management services",
                   "Educational services, and health care and social assistance",
                   "Arts, entertainment, and recreation, and accommodation and food services",
                   "Other services, except public administration",
                   "Public administration")

industryVars <- c("pctAgriculture" ,"pctConstruction",
                  "pctManuf", "pctWholesale","pctRetail", "pctTransport", "pctInfo", "pctFinReal",
                  "pctProfSci", "pctEduHealth","pctArtsEntFood", "pctOtherServ", "pctPubAdmin" )

names(industryVars) <-industryNames


###Confirm your working directory and read in the "zonal_stats_TRI.shp" file 
###to create the TRI_poly object.

mobility <- readOGR(dsn="/Users/sethschimmel/Documents/GitHub/CUNY-Capstone/data/shp/","joined_2013_acsIndust_cd113", verbose = FALSE) # verbose = FALSE omits the message on loading

names(mobility)

cleanCols <- names(mobility)[c(15:54)]


for (i in cleanCols)
  {
    mobility[[i]] <- as.numeric(as.character(mobility[[i]]))
    mobility[[i]][is.na(mobility[[i]])] <- 0
  }



#
#names(mobility) <- c("STATEFP"  ,  "CD116FP"  ,  "AFFGEOID"  , "GEOID"    ,  "LSAD"   ,    "CDSESSN" ,  
#                     "ALAND"   ,   "AWATER"  ,  "amount_cou", "amount_sum", "pctAgriculture" ,"pctConstruction",
#                     "pctManuf", "pctWholesale","pctRetail", "pctTransport", "pctInfo", "pctFinReal",
#                     "pctProfSci", "pctEduHealth","pctArtsEntFood", "pctOtherServ", "pctPubAdmin" ,"industry_profile",
#                     "pctStable", "pctAllEmigrated","pctOutState", "mig_profile")
#
## for the 2018 file....
names(mobility) <- c("STATEFP"   , "CD116FP"   , "GEOID"     ,"NAMELSAD"  , "LSAD"      ,"CDSESSN"   
, "MTFCC"     , "FUNCSTAT"  , "ALAND"     ,"AWATER"    , "INTPTLAT"  ,"INTPTLON"  
, "j_AFFGEOID", "j_distr_na", "j_total_wo","j_info"    , "j_finance_","j_prof_sci"
, "j_edu_heal", "j_arts_ent", "j_otherser","j_public_a", "j_agro"    ,"j_construc"
, "j_manufact", "j_wholesal", "j_retail"  ,"j_transpor", "pctInfo","pctFinReal"
, "pctProfSci", "pctEduHealth", "pctArtsEntFood","pctOtherServ", "pctPubAdmin","pctAgriculture"
, "pctConstruction", "pctManuf", "pctWholesale","pctRetail", "pctTransport","j_pctRANK_"
, "j_pctRAN_1", "j_pctRAN_2", "j_pctRAN_3","j_pctRAN_4", "j_pctRAN_5","j_pctRAN_6"
, "j_pctRAN_7", "j_pctRAN_8", "j_pctRAN_9","j_pctRAN10", "j_pctRAN11","j_pctRAN12"
, "j_ind_prof")

## for the 2013 file... 
names(mobility)[29:41] <- c("pctAgriculture","pctConstruction","pctManuf","pctWholesale",
                            "pctRetail","pctTransport","pctInfo","pctFinReal","pctProfSci",
                            "pctEduHealth","pctArtsEntFood","pctOtherServ","pctPubAdmin")

names(mobility)
industryNames <- c("Agriculture, forestry, fishing and hunting, and mining",
                   "Construction",
                   "Manufacturing",
                   "Wholesale trade",
                   "Retail trade",
                   "Transportation and warehousing, and utilities",
                   "Information",
                   "Finance and insurance, and real estate and rental and leasing",
                   "Professional, scientific, and management, and administrative and waste management services",
                   "Educational services, and health care and social assistance",
                   "Arts, entertainment, and recreation, and accommodation and food services",
                   "Other services, except public administration",
                   "Public administration",
                   "Emigration from Out of State",
                   "All Emigration")

industryVars <- c("pctAgriculture" ,"pctConstruction",
                  "pctManuf", "pctWholesale","pctRetail", "pctTransport", "pctInfo", "pctFinReal",
                  "pctProfSci", "pctEduHealth","pctArtsEntFood", "pctOtherServ", "pctPubAdmin",
                  "pctOutState","pctAllEmigrated")

names(industryVars) <-industryNames


###Create a queen's neighborhood weight matrix using the poly2nb command.
mobility_nbq <- poly2nb(mobility)


###extract coordinates to plot the connectivity matrix for visualization.
coords <- coordinates(mobility)
#plot(mobility)
#plot(mobility_nbq, coords, add=T)


###convert the neighborhood matrix into a list so that the connections between counties can be used in
###Moran's I test.
summary(mobility_nbq)
mobility_nbq_w <- nb2listw(mobility_nbq,zero.policy=TRUE)

mobility[["pctInfo"]]


names(mobility)

addLSAvars <- function(c) {
  #c <- "pctConstruction"
  s <- paste0("sc_",c)
  lag <- paste0("lag_s",c)
  ###Convert Exposure variable to z-form and then create the lag of that variable.
  mobility[[s]] <- scale(mobility[[c]])
  
  mobility[[lag]] <- lag.listw(mobility_nbq_w,mobility[[s]],zero.policy=TRUE,NAOK=TRUE)
  #summary(mobility[[s]])
  #summary(mobility[[lag]])
  

  
  ###Run the morans I test and plot the results.
  moransResult <- moran.test(mobility[[s]], listw=mobility_nbq_w,zero.policy=TRUE)
  stat <-   moransResult$estimate[1]
  pval <- moransResult$p.value
  pval <- formatC(pval, format = "e", digits = 2)
  moransplot <- moran.plot(as.vector(mobility[[s]]), listw=mobility_nbq_w,
             zero.policy = TRUE,
           xlim=c(-3,3),ylim=c(-2,2),
           main=paste("Moran's Univariate Local I =",round(stat,3),"p-value=",pval), 
           xlab=c,ylab=paste("Spatial Lag of ",c),pch=19)

  
  
  ###Set the county ID to the county FIPS ("COUNTY") and extract the LISA p-values.
  head(mobility)
  geoid <- mobility$GEOID
  head(geoid)
  MSlocI <- localmoran(mobility[[c]], mobility_nbq_w,zero.policy=TRUE,na.action = na.omit)
  MSlocI[is.na(MSlocI)] <- 0.000
  MSlocI
  geoid <- as.data.frame(geoid)
  MSlocI_combine <- cbind(geoid,MSlocI)
  #View(MSlocI_combine)
  #mobility[[lag]]
  ###Identify signficant clusters based on the data values in z-form and LISA p-values.
  var <- paste("LSAcl_",c)
  mobility[[var]] <- 99
  mobility[[var]] <- 5
  

  #mobility@data[ !is.na(mobility[[lag]])  &      (mobility[[s]]<=0 & mobility[[lag]] <=0) & MSlocI_combine[,6]<=0.05, var]
  mobility@data[ !is.na(mobility[[lag]])  &     (mobility[[s]]>=0 & mobility[[lag]] >=0) & MSlocI_combine[,6]<=0.05, var] <- 1
  mobility@data[ !is.na(mobility[[lag]])  &      (mobility[[s]]<=0 & mobility[[lag]] <=0) & MSlocI_combine[,6]<=0.05, var] <- 2
  mobility@data[!is.na(mobility[[lag]])  & MSlocI_combine[,6]>=0.05, var] <- 5

  ###Write the LISA cluster information to a new .csv file for use in QGIS.
  names(mobility)
  mobData <-as.data.frame(mobility)
  #table(mobData[[var]])
  #names(mobData)
  
  #output<-list(mobData,moransplot)
  return(mobData)
}

additions <- c()
plots <- c()


names(mobility)
industryVars <- names(mobility)[29:41]
industryVars
for (c in industryVars){
  LISArun <- addLSAvars(c)
  additions <- c(additions,LISArun)
  #plots <- c(plots,LISArun[2])
  
}




additions <- additions[grepl("LSAcl_|sc_|lag_|AFFGEOID",names(additions))]

output <- as.data.frame(additions)
output <- output[, !duplicated(colnames(output),fromLast = FALSE)]

extrGEOID <- grepl("ID.",names(output))
output <- output[,!extrGEOID]

output

write.csv(output,"acsIndust_CD2013_LISA.csv")








