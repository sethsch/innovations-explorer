//var svg = d3.select("#example").style("width","800px").style("height","320px");

//const { filter } = require("topojson-simplify");

//const { stat } = require("fs");

//const { zoom } = require("d3");

//const { standardDeviation } = require("simple-statistics");

//const { mean } = require("simple-statistics");

//const { initial } = require("underscore");

/*var parentElement = document.getElementById('map-par-panel');
var panelWidth = parseInt($('#map-par-panel').css("width"));
var panelHeight = parseInt($('#map-par-panel').css("height"));
var panelPaddingTop = parseInt($('#map-par-panel').css("padding-top"));
var panelPaddingBottom = parseInt($('#map-par-panel').css("padding-bottom"));
var panelPaddingLeft = parseInt($('#map-par-panel').css("padding-left"));
var panelPaddingRight = parseInt($('#map-par-panel').css("padding-right"));
var pcHeight = panelHeight*0.16 - panelPaddingTop - panelPaddingBottom
var pcWidth = panelWidth - panelPaddingLeft - panelPaddingRight*/



/**
 * APPLICATION STATE
 * */
let state = {
  procData: [],
  gridData: [],
  cdAggData: "99",
  filtCdAggData: [],
  awardsData: [],
  filtAwards: [],
  filteredCdAwards: [],
  recipsData: [],
  filtRecipsData: [],
  industData: [],
  industStats: [],
  currentChloroLayer: null,
  lastClusterGroup: null,
  currentClusterGroup: null,
  parcoordsState: "econ",
  selectedYears: ["2008","2018"],
  yearRange: [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018],
  selectedAgencies: ["National Science Foundation","Environmental Protection Agency","Department of Commerce","Department of Transportation","Department of Energy"],
  defaultHiddenAxes: {econ:["id","GEOID","name","profile"],
                      funding: ["id","GEOID","year","name"]},
  hiddenAxes: {econ:["id","GEOID","name","profile"],funding: ["id","GEOID","year","name"]},
  currentAxes: {econ: [], funding: []},
  defaultColor: {econ:"AGRIC", funding:"TOTAL"},
  color: null,
  paletteInfoString: {econ: "", funding: ""},
  selectedRows: [],
  unselRows: [],
  currentCd: "99",
  lastCd: "00",
  currentCdVocab: [],
  filteredCdVocab: [],
  selectedVocab: "All",
  lastVocab: null,
  selectedGraph: "agency-graph",
  lastGraph: null,
  cdReclick: 0,
  scope: "all_distr",
  fundedGEOIDS: []
};
/**
 * 
 * 
 * 
 * GLOBALS
 * 
 * 
 * 
 */

// graph objects and components
let parcoords;
let grid;
let dataView;
let pager;
let infobar;
let mymap;


// these weren't loading through the state... so use the manual computations here
let industStats_global = {
  'pct_agro': {'mean': 0.01910747, 'stdev': 0.0249269},
  'pct_arts_ent_food_rec': {'mean': 0.0970931, 'stdev': 0.0247866},
  'pct_construct': {'mean': 0.0649388, 'stdev': 0.01674160},
  'pct_edu_health': {'mean': 0.2320128, 'stdev': 0.03328312},
  'pct_finance_realest': {'mean': 0.06422619, 'stdev': 0.0207670},
  'pct_information': {'mean': 0.0201546, 'stdev': 0.01030682},
  'pct_manufact': {'mean': 0.10252189, 'stdev': 0.0472774},
  'pct_otherserv': {'mean': 0.04890645, 'stdev': 0.00640384},
  'pct_prof_sci_mgmt_adm': {'mean': 0.1116744, 'stdev': 0.0364627},
  'pct_public_admin': {'mean': 0.0468815, 'stdev': 0.02111663},
  'pct_retail': {'mean': 0.113593, 'stdev': 0.013279286},
  'pct_transport_util': {'mean': 0.05265870, 'stdev': 0.01497621},
  'pct_wholesale': {'mean': 0.02623058, 'stdev': 0.00633994}
}


// default settings for grid
var sortcol = "name";
var sortdir = 1;
var percentCompleteThreshold = 0;
var searchString = "";


// color settings
var colorRange = d3.schemeSpectral[4]
  // color scale for zscores
var zcolorscale = d3.scaleLinear()
  .domain([-2,-0.5,0.5,2])
  .range(colorRange.reverse())
  .interpolate(d3.interpolateLab);


//console.log(d3.schemeSpectral[5])

//["#d7191c", "#fdae61", "#ffffbf", "#abdda4", "#2b83ba"]

var chloroScale = d3.scaleQuantize()
  .domain([-2,2]) // pass only the extreme values to a scaleQuantize’s domain
  .range(d3.schemeSpectral[6].reverse());


function fundedChloro(feature,normVar){



  if (state.parcoordsState === "econ"){
    // if the all_distr filter is off... get chloroscale for funded dist and gray for non-funded
    if (state.scope !== "all_distr"){
      if (state.fundedGEOIDS.includes(feature.properties.AFFGEOID)){
        return chloroScale(feature.properties[normVar]);
      }
      else {return "rgba(161, 161, 161,0.4)";}
    }
    // if the all_distr filter is on... just use chloroscale to show econ variables
    else {return chloroScale(feature.properties[normVar])}
    
  }
  // if we're on funding parcoords
  else if (state.parcoordsState === "funding") {

    if (state.scope !== "all_distr"){
      if (state.fundedGEOIDS.includes(feature.properties.AFFGEOID)){
        let cdFundFilt = state.procData.filter(d=>d.GEOID === feature.properties.AFFGEOID)
   
        // get that feature from the funding data and return the chloroscale for that value...
        if (cdFundFilt.length == 0) {return chloroLinear(0);}
        else {return chloroLinear(cdFundFilt[0][state.color])}
 
      }
      else {return "rgba(161, 161, 161,0.4)";}
    }
    else {
      // get that feature from the funding data and return the chloroscale for that value...
      let cdFundFilt = state.procData.filter(d=>d.GEOID === feature.properties.AFFGEOID)

       // get that feature from the funding data and return the chloroscale for that value...
      if (cdFundFilt.length == 0) {return chloroLinear(0);}
      else {return chloroLinear(cdFundFilt[0][state.color])}
      

    }
    //console.log("CDFUNDFIL",cdFundFilt);
    
    
  }
  
  
}


// For the text search, set a buffer before the filtering starts to operate -- num of chars
let buffer = 2;

// for the map, we specify a max zoom level
const maxZoomLevel = 12;

// colors for the bar graph
//const sbir_color = "#181818";
const sttr_color = "rgba(33,38,41,0.9)";
const sbir_color = "rgba(15,110,253,0.9)"
//const sttr_color = "#808080";

let vocabs = ["EIGE","AGROVOC","STW","EU-SCIVOC","EUVOC","GEMET","MeSH"];
// quick function for merging vocabs when necessary
const mergeVocabs = data => {
  const result = {}; //(1)

  data.forEach(basket => { //(2)
    for (let [key, value] of Object.entries(basket)) { //(3)
      if (result[key]) { //(4)
        result[key] += value; //(5)
      } else { //(6)
        result[key] = value;
      }
    }
  });
  return result; //(7)
};

// MARCH 12 -- attribute names should go in state for multiple datasets
// For parcoords, we need lists of variable names; as in the data abbrevs and spelled out for the UI
var attributes = ["GEOID","distr_name","ind_profile","pct_agro",	"pct_construct",	"pct_manufact",
      "pct_wholesale",	"pct_retail",	"pct_transport_util",
      "pct_information",	"pct_finance_realest",	"pct_prof_sci_mgmt_adm",
      "pct_edu_health",	"pct_arts_ent_food_rec",	"pct_otherserv",
      "pct_public_admin"]

var shortAttributeNames = new Map(
      Object.entries({
        GEOID: "GEOID",
        distr_name: "name",
        ind_profile: "profile",
        pct_agro:                   "AGRIC"	,
        pct_construct:               "CNSTR",	
        pct_manufact:                 "MFCTR",
        pct_wholesale:                "WHOLE",	
        pct_retail:                 "RETAIL",	
        pct_transport_util:           "TRNSP-UTIL",
        pct_information:             "INFO",	
        pct_finance_realest:          "FNC-REAL",	
        pct_prof_sci_mgmt_adm:        "SCI-MGMT",
        pct_edu_health:             "ED-HLTH",	
        pct_arts_ent_food_rec:              "ARTS-ENT",	
        pct_otherserv:                "OTHER",
        pct_public_admin:             "PUBADMIN",
        id: "id"
      })
    );


let industryNames = {
  "AGRIC": "Agriculture, mining, forestry, fishing, hunting",
  "CNSTR": "Construction",
  "MFCTR": "Manufacturing",
  "WHOLE": "Wholesale trade",
  "RETAIL": "Retail trade",
  "TRNSP-UTIL": "Transportation, warehousing, and utilities",
  "INFO": "Information",
  "FNC-REAL": "Finance, insurance, real estate, rental and leasing",
  "SCI-MGMT": "Professional, scientific, management, waste mgmt. services",
  "ED-HLTH": "Educational services, health care, social assistance",
  "ARTS-ENT": "Arts, entertainment, recreation, accommodation and food services",
  "OTHER": "Other services, except public administration",
  "PUBADMIN": "Public administration"}


let agencyNames = {
  "National Science Foundation":"NSF",
  "Department of Health and Human Services": "HHS",
  "Department of Defense": "DOD",
  "Department of Education": "ED",
  "Department of Commerce": "DOC",
  "Department of Agriculture": "USDA",	
  "National Aeronautics and Space Administration": "NASA",
  "Department of Transportation": "DOT",
  "Department of Homeland Security": "DHS", 
  "Department of Energy": "DOE",
  "Environmental Protection Agency": "EPA"
}



let pc_dims = {
  //"year": {title:"Year", type: 'string',orient: 'left'},
  "TOTAL":  { type: 'number',orient: 'right', ticks: 3},
  "DOD":  { type: 'number',orient: 'right', ticks: 3},
  "HHS":       { type: 'number',orient: 'right', ticks: 3},
  "DOE": { type: 'number',orient: 'right', ticks: 3},
  "NASA": { type: 'number',orient: 'right', ticks: 3},
  "DHS": { type: 'number',orient: 'right', ticks: 3},
  "NSF":  {type: 'number',orient: 'right', ticks: 3},
  "DOT": { type: 'number',orient: 'right', ticks: 3},
  "USDA": { type: 'number',orient: 'right', ticks: 3},
  "ED": { type: 'number',orient: 'right', ticks: 3},
  "DOC": { type: 'number',orient: 'right', ticks: 3},
  "EPA": { type: 'number',orient: 'right', ticks: 3},
  
}
//let agency_dims = Object.values(agencyNames)
//agency_dims.unshift("total");
let agency_dims = Object.keys(pc_dims)


// INIT - DATA LOAD
// TODO: load version with amount sums, or wire up lookups to grants data with GEOID
d3.csv('data/acs2018_industry_congdist.csv').then(function(data) {

  // INIT - Process the data, select only the variables from it we need 
  // Note: slickgrid needs each data element to have an 'id'
  data.forEach(function(d,i) { d.id = d.id || i; });
  //console.log("DATA AT FIRST LOAD",data)
  var procData = [];
      procData.columns = [Array.from(shortAttributeNames.values())].flat()
      data.forEach(function(district) {
            let distData = {};
            attributes.forEach(function(industry) {
                  
                  distData[shortAttributeNames.get(industry)] = +district[industry]
                  
                  //console.log(typeof district[industry])
                  
                  //distData[shortAttributeNames.get("us_state")] = district["us_state"]

            });
            distData[shortAttributeNames.get('distr_name')] = district["distr_name"]
            distData[shortAttributeNames.get('ind_profile')] = district["ind_profile"]
            distData["id"] = +district["id"]
            distData['GEOID'] = district["GEOID"]
           // console.log(distData);
           procData.push( distData );
      })
      //console.log("FILT",procData);
      state.acsData = procData;
      state.procData = procData;
      //console.log("state proc",state)

  init();



});


function init() {

  

  /// INIT - set up the color legend
  /// 
  /*var legArea = d3.select("#legend")
    .append("svg")
    //.style("font-size","9px");
    
  // add the correct legend
  var legend = d3.legendColor()
    //.labelFormat(d3.format(".1f"))
    .labels(["-2 st.dev.","-1","Nat'l Avg.","+1","+2 st.dev."])
    .shapeWidth(40)
    .orient('horizontal')
    //.title("Deviations from Mean (s.d.)")
    .useClass(false)
    //.titleWidth(140)
    .scale(zcolorscale);
  legArea.append("g")
    .call(legend);
  //console.log("ZCOLORSCALE",legend)*/


  //  /// INIT FOR MAP
  mymap = L.map('map').setView([39.425,-94.796], 3.5);

  var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 3,
    maxZoom: 13,
    ext: 'png'
  });

  
  Stamen_TonerLite.addTo(mymap);
  initAwardsData();
  initIndustData();
  
  // setup the default infobar
  // alt text "Current sector(s):"
  state.paletteInfoString['econ'] = `<strong>% District Employed In:</strong> ${industryNames[state.defaultColor[state.parcoordsState]]}</br>${get_infobar_stats(state.defaultColor[state.parcoordsState])}`

  // set the initial info-bar text
  infobar = d3.select("#info-bar")
                      .html(state.paletteInfoString[state.parcoordsState]);


  /// INIT FOR PARCOORDS
  initParcoords();

  // Parcoords Reload Button
  $("#reload-parcoords-icon").on("click",function(){
    $("#parcoords").remove();
    console.log("state",state)
    initParcoords();
    draw();
  });

  

  // INIT Dropdown functionality for vocab selector
  d3.selectAll('.vocabsel')
  .on("click",d=>changeVocab(d))

  // INIT Dropdown functionality on graph selector
  d3.selectAll('.graphsel')
  .on("click",function(e){
    state.lastGraph = state.selectedGraph;
    if (state.lastGraph != null) {
      $("#"+state.lastGraph).attr("class","nav-link graphsel");
    }
    state.selectedGraph = e.target.id;
    $("#"+state.selectedGraph).attr("class","nav-link active graphsel");
    //console.log("LAST GRAPHSEL",state.lastGraph,"CURRENT GRAPHSEL",state.selectedGraph)
    getCdStats(state.currentCd);
  })

  // INIT Dropdown of checkboxes for agencies input
  d3.selectAll(".form-check-input")
  .on("change",function(){
    if (d3.select(this).property('checked') == true) {
      state.selectedAgencies.push($(this).attr("id").replaceAll("-"," "));
      //let axis = $(this).attr("id").replaceAll("-"," ")
      //state.currentAxes["funding"].push(agencyNames[axis])
      //console.log("checked so selected agencies is",state.selectedAgencies,"selected is");
    }
    else {
      state.selectedAgencies = state.selectedAgencies.filter(d=>d !== $(this).attr("id").replaceAll("-"," "));
      let axis = $(this).attr("id").replaceAll("-"," ")
      state.hiddenAxes["funding"].push(agencyNames[axis])
      //console.log("unchecked so selected agencies is",state.selectedAgencies,"clicked on",$(this).attr("id"));
    }
  });

  // INIT Dropdown of input for years
  let years = [2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018];
  // set up the selectors
  var y1_select = d3.select("#year-select-1")
                    .selectAll('option')
                    .data(years).enter()
                    .append('option')
                    .text(function (d) { return d; })

  d3.select('#year-select-1').node().value = "2008";

  var y2_select =    d3.select("#year-select-2")
                        .selectAll('option')
                        .data(years).enter()
                        .append('option')
                        .text(function (d) {return d;});

  d3.select('#year-select-2').node().value = "2018";

  d3.select("#year-select-1").on("change",function(){
      state.selectedYears[0] = d3.select('#year-select-1').node().value;
      changeYears();
    }  
  )
  d3.select("#year-select-2").on("change",function(){
    state.selectedYears[1] = d3.select('#year-select-2').node().value;
    changeYears();
    }  
  )
  // years update button
  $("#year-update-btn").on("click",function(){
      filterAwardsRecips();
      switchParcoordsData();
      })
  // agency update button
  $("#agency-update-btn").on("click",function(){
    filterAwardsRecips();
    switchParcoordsData();
    })


  // setup the radio buttons
  d3.selectAll("input[name='fund-radio']").on("change", function(){
    //console.log(this.value);
    state.scope = this.value;
      // remove any old map layer 
      if (state.currentChloroLayer !== null) {
        mymap.removeLayer(state.currentChloroLayer);
        //console.log("I REMOVED THE MAP LAYER",state.currentChloroLayer)
      };
    draw();
  });


  // select the profiler parcoords options
  d3.selectAll(".parcoords-state").on("click",function(){
    console.log("changed parcoords state val",$(this).attr("id"))
    state.parcoordsState = $(this).attr("id");
    switchParcoordsData();
  })



  // if the user clicks the title in the navbar, reset the welcome text
  d3.select(".pub-inno-title").on("click",function(){
    d3.selectAll(".district-autotexts").remove();
    d3.select("#district-summary-title").text("Welcome to the Public Innovations Explorer")
    d3.select("#district-summary-text").html(
      '<p class="default-welcome-summary">Explore funding by Federal agencies to small businesses for innovative research activities and technology transfer through the Small Business Innovation Research (SBIR) and Small Business Technology Transfer (STTR) grant making programs. </p>'+'<p class="default-welcome-summary"><strong>Select</strong> the Federal agencies and years of interest from the menus in the navigation bar above. You can <strong>explore</strong> the map to find companies, and details about grants they were awarded.  Use the parallel coordinates plot to <strong>filter</strong> the congressional districts on the map, and identify hot spots and cold spots for different kinds of underlying economic activities. <strong>Click</strong> on a congressional district to see a summary of its funded research activities, labor profile and topics extracted from the funded research taking place there.</p>'
    )
  })



  // Now call the draw function(s) to get going...
  draw();



};




function draw() {


  

  // MARCH 12 -- this should get the proc data for the selected dataset
  // Initial draw of parcoords

  if (state.parcoordsState === "econ") {
    // if and when all districts, get the fresh, full ACS data...
    if (state.scope === "all_distr") {
      state.procData = state.acsData
      //console.log("all geos",state)
    }
    else if (state.scope === "funded_distr") {
      //var fundedGEOIDS = state.filtAwards
      // MARCH 13 -- I dont htink this is necessary anymore given the updates to the chloroStyle..confirm
      var acsFilt = state.acsData.filter(d=>state.fundedGEOIDS.includes(d.AFFGEOID));
      
      //console.log("funded geos only", acsFilt)
    }
    parcoords
      .data(state.procData)
      //.dimensions({state.currentAxes[state.parcoordsState]}) // using state variable to hide axes dynamically when needed
      .hideAxis(state.defaultHiddenAxes["econ"])
      .render()
      // TO DO: let this parameter be user/customizable -- 
      .commonScale() // sometimes it's useful to put it in common, but othertimes its nicer to have more space on the axis
      .interactive()
      .reorderable() // if this is on, need to figure out how to make the state keep track of order, so that removal popover works right
      //.brushable()
      .bundleDimension(state.color) // bundle the parcoords on the color dimension
      .bundlingStrength(0.6)
      .brushMode("1D-axes")
      .shadows()
   

  }
  else if (state.parcoordsState === "funding"){

    let curr_dims = {};
    curr_dims["TOTAL"] = pc_dims["TOTAL"]
    state.selectedAgencies.forEach(function(a){curr_dims[agencyNames[a]] = pc_dims[agencyNames[a]]  })
    state.currentAxes["funding"] = Object.keys(curr_dims)
	//console.log("CURR DIMS",state.currentAxes[state.parcoordsState],curr_dims)
    
    // doing these draws without reference to the state because we want NOT to add commonScale to this instance...
    parcoords
      .data(state.procData)
      .hideAxis(state.defaultHiddenAxes["funding"]) 
      .dimensions(curr_dims)
      .render()
      .interactive()
      .reorderable() // if this is on, need to figure out how to make the state keep track of order, so that removal popover works right
      //.brushable()
      .bundleDimension(state.color) // bundle the parcoords on the color dimension
      .bundlingStrength(0.6)
      .brushMode("1D-axes")
      .shadows()

  }
  
 

 
    //.on("resize","resize");


  //console.log("PARCOORDS DATA",parcoords.data())  
  


  // DRAW - Add label interactivity: click label to activate coloring
  parcoords.svg.selectAll(".dimension")
    .on("click", change_color)
    .selectAll(".label")
    .attr("class","label")
    .attr("transform","translate(0,-10) rotate(0)")

  // change the tick format
  parcoords.svg.selectAll(".axis .tick text").each(function(d, i) {
    // MARCH 13 -- change format tick depend on parcoordsState
    if (state.parcoordsState === "econ"){
      d3.select(this).text(d3.format(".0%")(d));

    }
    else if (state.parcoordsState == "funding"){
      d3.select(this).text("$"+d3.format(".1s")(d).replace("G","B")    );

    } 
  });

 

  // DRAW - establish popovers
  var popover = new bootstrap.Popover(document.querySelector('.label'), {
      container: 'body',

      
      //trigger: 'manual'
    })

    
  // DRAW - set up popovers on labels
  parcoords.svg.selectAll(".label")
    .attr("axis-id",(d,i)=>state.currentAxes[state.parcoordsState][i])
    .attr("data-bs-container",'body') // add the popover menu from bootstrap, to allow hiding
    .attr("data-bs-toggle","popover")
    .attr("data-bs-placement","top")
    .attr("data-bs-html","true")
    // add this function to all popover axis-remove text
    .attr("data-bs-content",  (d,i)=> `<div class="axis-remove" data-bs-dismiss="alert" id="${state.currentAxes[state.parcoordsState][i]}">&times;</div>`
    ) // this adds the content, on click of content, remove axis
    .attr("data-bs-trigger",'manual')
    .on("mouseenter", function() {
      var _this = this;
      setTimeout(function() {
        $(_this).popover('show');
      }, 300);
      //$(this).popover("show");
      $(".popover").on("mouseleave", function() {
        $(_this).popover('hide');
      });
    }).on("mouseleave", function() {
      var _this = this;
      setTimeout(function() {
        if (!$(".popover:hover").length) {
          $(_this).popover("hide");
        }
      }, 300);
    });

  // FUNCTION - 
  // add a function for updating the hide list


// DRAW -  enable popover X mark
// enable the X mark in the popover box to call the updateHides function
  $(document).ready(function(){
    $(document).on("click", ".popover .axis-remove" , function(){
        $(this).parents(".popover").popover('hide');
	//console.log("ooh you clicked the popup for",this,$(this).attr("id"));
        updateHides($(this).attr("id"));

    });
  });



  // add hover over activity to labels, to show full label
  // ideally, labels will have abbreviations, and when hovered over the full
  // sector title will display in a tooltip.. maybe the answer is to make
  // the tooltip centered and statically positioned rather than floating,
  // this way the wrapping isn't an issue

    // set up listener for the axis hides
  // parcoords.hideAxis(state.hiddenAxes).updateAxes();
  // Initial coloration of parcoords
   // set the initial info-bar text
   

  // DRAW - on label hover, change the info bar to display full axis info, revert to current palette on mouseleave
  parcoords.svg.selectAll(".dimension .label")
    .on("mouseout", function () {
        infobar
        .style("opacity",0)
        // MARCH 13 -- palette Info changes dep on parcoordsState
        .html(state.paletteInfoString[state.parcoordsState])
        .style('pointer-events', 'none')
        .transition()
        .style("opacity",1)
        .delay(300)
        .duration(450); 
    })
    .on("mouseover", function(d) {
	//console.log("mouseover d",d)
      infobar
        .style("opacity",0)
          // MARCH 13 -- palette Info changes dep on parcoordsState
        .html(function(){
          if (state.parcoordsState === "econ"){
            return `<strong>${industryNames[d]}</strong></br>${get_infobar_stats(d)}`; // this should be a call to a dictionary, the abbrev returns the full
          }
          else if (state.parcoordsState === "funding"){
            let sel_agency;
            if (d == "TOTAL"){
              sel_agency = "All <u>selected</u> funding agencies"
            }
            else {
              let agency_abbrev = d;
              sel_agency = Object.keys(agencyNames)[Object.values(agencyNames).indexOf(d)]  
            }
            let years = []
            if (state.selectedYears[0] === state.selectedYears[1]){
              years.push(state.selectedYears[0])
            }
            else {years = state.selectedYears}
            let yearString = ""
            if (years.length === 1) {
              yearString = String(years[0])
            }
            else {yearString = "SBIR/STTR Funding ("+String(years[0])+"-"+ String(years[1])+"): " }

            return `<p class="funding-current-paletteInfoString"><strong>${sel_agency}</strong></br><strong>${yearString}</strong>${get_infobar_stats(d)}</p>`
          }
        })
        .transition()
        .style("opacity",1)
        .delay(300)
        .duration(300)
        //.style("transform",`translate(${parentPos.x + 15}px,${parentPos.y - 20}px)`)
        ;
    });
    
  

  let sel_agency = "All <u>selected</u> funding agencies"

  let years = []
  if (state.selectedYears[0] === state.selectedYears[1]){
    years.push(state.selectedYears[0])
  }
  else {years = state.selectedYears}
  let yearString = ""
  if (years.length === 1) {
    yearString = String(years[0])
  }
  else {yearString = "SBIR/STTR Funding ("+String(years[0])+"-"+ String(years[1])+"): "}

  state.paletteInfoString["funding"]= `<p class="funding-current-paletteInfoString"><strong>${sel_agency}</strong></br><strong>${yearString}</strong>${get_infobar_stats(state.color)}</p>`;





  change_color(state.defaultColor[state.parcoordsState]);    
  //console.log("DATA",state.procData.columns);
  infobar = d3.select("#info-bar")
     .html(state.paletteInfoString[state.parcoordsState]);


  // DRAW - add sort beheaviors to grid
  grid.onSort.subscribe(function (e, args) {
    sortdir = args.sortAsc ? 1 : -1;
    sortcol = args.sortCol.field;

  
      // using temporary Object.prototype.toString override
      // more limited and does lexicographic sort only by default, but can be much faster

      var percentCompleteValueFn = function () {
        var val = this["percentComplete"];
        if (val < 10) {
          return "00" + val;
        } else if (val < 100) {
          return "0" + val;
        } else {
          return val;
        }
      };

      // use numeric sort of % and lexicographic for everything else
      //dataView.fastSort((sortcol == "percentComplete") ? percentCompleteValueFn : sortcol, args.sortAsc);
   
      // using native sort with comparer
      // preferred method but can be very slow in IE with huge datasets
      dataView.sort(comparer, args.sortAsc);
    
  });

  // DRAW -- add highlight behaviors to grid
  // highlight row in chart
  grid.onMouseEnter.subscribe(function(e,args) {
    // Get row number from grid
    var grid_row = grid.getCellFromEvent(e).row;

    // Get the id of the item referenced in grid_row
    var item_id = grid.getDataItem(grid_row).id;
   
    var d = parcoords.brushed() || state.procData;
    //var unsel_ids = dataView.getItems().filter(d=>d.id !== item_id);
    //console.log("unsel ids",unsel_ids)

    // Get the element position of the id in the data object
    var elementPos = d.map(function(x) {return x.id; }).indexOf(item_id);

    var unselItems = parcoords.data().filter(d=>d.id !== item_id)
    //console.log("el pos",elementPos,"unsel",unselItems)
    // Highlight that element in the parallel coordinates graph
    parcoords.unmark(unselItems);
    parcoords.unhighlight(unselItems);
   
    parcoords.highlight([d[elementPos]]);
    //showQueryPaths();
  
   


  });
  grid.onMouseLeave.subscribe(function(e,args) {
    //parcoords.clear("highlight")
    var marked_dist = d3.filter(parcoords.data(),d=>d.GEOID === state.currentCd);
    parcoords.unhighlight(state.selectedRows);
    parcoords.mark(marked_dist)
    //showQueryPaths();

  });

  grid.onCellChange.subscribe(function (e, args) {
    dataView.updateItem(args.item.id, args.item);
    
  });

  // TO DO : add behavior for for on Mouse click that selects in parcoords, map, summary etc.
  grid.onAddNewRow.subscribe(function (e, args) {
    //var item = {"num": data.length, "id": "new_" + (Math.round(Math.random() * 10000)), "title": "New task", "duration": "1 day", "percentComplete": 0, "start": "01/01/2009", "finish": "01/01/2009", "effortDriven": false};
    $.extend(item, args.item);
    dataView.addItem(item);
    
  });

  // On typing... 
  grid.onKeyDown.subscribe(function (e) {
    // select all rows on ctrl-a
    if (e.which != 65 || !e.ctrlKey) {
      return false;
    }

    var rows = [];
    for (var i = 0; i < dataView.getLength(); i++) {
      rows.push(i);
    }
    
    grid.setSelectedRows(rows);
    
    e.preventDefault();
   

    
  });
  


  // wire up model events to drive the grid
  dataView.onRowCountChanged.subscribe(function (e, args) {
    grid.updateRowCount();
    grid.invalidate();

    grid.render();

  });

  dataView.onRowsChanged.subscribe(function (e, args) {
    grid.invalidateRows(args.rows);
    grid.invalidate();
    //console.log("ARGSROWS",args.rows);
    grid.render();
    
    
  });

 

 
  
 // DRAW GRID
  //console.log("the data for grid") 
  gridUpdate(state.procData);

  // DRAW - update grid on brush
  // TO DO -- add function for updating map too
  parcoords.on("brush", function(d) {
    
    gridUpdate(d);

    brushMap();
    
  });
    // if you don't want the items that are not visible (due to being filtered out
  // or being on a different page) to stay selected, pass 'false' to the second arg
  dataView.syncGridSelection(grid, false);


};
//// END MAIN DRAW FUNCTION

// change the selected date range
function changeYears(){
  const range = (start, stop, step = 1) =>
  Array(Math.ceil((stop - start) / step)).fill(start).map((x, y) => x + y * step)

  const toNumbers = arr => arr.map(Number);
  var year_vals = toNumbers(state.selectedYears)
  year_vals.sort(function(a, b){return a-b});

  if (year_vals[0]===year_vals[1]){
    state.yearRange = [year_vals[0]]
  }
  else {
    var yearsRange = range(year_vals[0],year_vals[1]+1,1);
    state.yearRange = yearsRange;
  }  
  //console.log("YEARS RANGE",yearsRange,"state",state.selectedYears,state.yearRange)
  //return yearsRange;
};


// change the vocab shown
function changeVocab(e){
  // set the state vocab
  state.lastVocab = state.selectedVocab;
  state.selectedVocab = e.target.id;


  
  // if user has clicked All again, don't change anything...
  if (state.selectedVocab === "All" && state.lastVocab === "All"){

  }
  else if (e.target.id === "vocabsInfo"){
    $("#All").attr("class","nav-link vocabsel")
    $('#vocabs-dropdown')
    .attr("class","nav-link dropdown-toggle")
    .text("From vocabulary")

    if (state.lastVocab !== "All"){
      $('#'+state.lastVocab).attr("class","dropdown-item") 
    }
    $("#vocabsInfo").attr("class","nav-link active vocabsel")

  }
  else if (e.target.id !== "All" && e.target.id !== "vocabsInfo") {
        // unselect the All tab
   
    $('#All').attr("class","nav-link vocabsel");
    // add active for the dropdown and change the text
    $('#vocabs-dropdown')
      .attr("class","nav-link active dropdown-toggle")
      .text(e.target.id.replace("textrank-tfidf_keywords","Extracted")+" Vocabulary")

    // show it as the selected item in the dropdown
    if (state.lastVocab !== "All" && state.lastVocab !== "vocabsInfo"){
      $('#'+state.lastVocab).attr("class","dropdown-item") // reset all selections
    };
    $('#'+e.target.id).attr("class","dropdown-item active") // update active sel
    $("#vocabsInfo").attr("class","nav-link vocabsel")
  }
  // if the user selects the All tab
  else {
    // activate the all tab
    //$('#allvocabs-tab').attr("class","nav-item active");
    $('#All').attr("class","nav-link active vocabsel");
    // reset the dropdown
    $('#vocabs-dropdown')
    .attr("class","nav-link dropdown-toggle")
    .text("From vocabulary")

    // reset dropdown selection
    $('#'+state.lastVocab).attr("class","dropdown-item") 
    $("#vocabsInfo").attr("class","nav-link vocabsel")

    
  }
  showCdVocab(state.currentCdVocab);
  $('#vocabs-dropdown').dropdown('hide')
  //console.log("VOCAB SEL EVENT",e);

}

// change the graph shown

// this function gets the stats for the filtered Cd Awards, and then calls to the function to generate the textual summary for the same district
function getCdStats(district){

  if (district === "99"){
    showCdGraph("99","99")

  }
  else {
        // MARCH 11: update this to take awards from filtered Awards for agency/year
      state.filteredCdAwards = state.filtAwards.filter(d=>d.AFFGEOID_CD116 === district)

      getCdTextSummary(district,state.filteredCdAwards)
      var data = state.filteredCdAwards;
      //console.log("GOT THE STATS for",district,data)

      var fundSummary = [];
      var countSummary = [];

      if (state.selectedGraph === "agency-graph"){
        
        data.reduce(function(res, value) {
          if (!res[agencyNames[value.Agency]]) {
            res[agencyNames[value.Agency]] = { Agency: agencyNames[value.Agency],  'sbir': 0, 'sttr': 0, 'total': 0};
            fundSummary.push(res[agencyNames[value.Agency]])

          }
          if (value.Program === "SBIR") {
            res[agencyNames[value.Agency]]['sbir'] += value.Award_Amount;
            res[agencyNames[value.Agency]]['total'] += value.Award_Amount;
          }
          else if (value.Program === "STTR") {
            res[agencyNames[value.Agency]]['sttr'] += value.Award_Amount;
            res[agencyNames[value.Agency]]['total'] += value.Award_Amount;
          }
          return res;
        }, {});

        fundSummary.sort((a, b) => a.total - b.total)
        fundSummary.forEach(function(v){ delete v.total });

        
        data.reduce(function(res, value) {
            if (!res[agencyNames[value.Agency]]) {
              res[agencyNames[value.Agency]] = { Agency: agencyNames[value.Agency], 'sbir': 0, 'sttr': 0, 'total': 0};
              countSummary.push(res[agencyNames[value.Agency]])

            }
            if (value.Program === "SBIR") {
              res[agencyNames[value.Agency]]['sbir'] += 1;
              res[agencyNames[value.Agency]]['total'] += 1;

            }
            else if (value.Program === "STTR") {
              res[agencyNames[value.Agency]]['sttr'] += 1;
              res[agencyNames[value.Agency]]['total'] += 1;
            }
            return res;
          }, {});
          countSummary.sort((a, b) => a.total - b.total)
          countSummary.forEach(function(v){ delete v.total });

          showCdGraph(fundSummary,countSummary)

      }
      else if (state.selectedGraph === "recips-graph"){
        
        data.reduce(function(res, value) {
          if (!res[value.Company]) {
            res[value.Company] = { Company: value.Company,
                row_id: String(value.Company)+"_"+String(value.DUNS)+"_"+String(value.Address1),
                lat: value.latitude, lng: value.longitude,
              'sbir': 0, 'sttr': 0, 'total': 0, 'count':0, 'sbir_count': 0,'sttr_count': 0
          };
            fundSummary.push(res[value.Company])

          }
          if (value.Program === "SBIR") {
            res[value.Company]['sbir'] += value.Award_Amount;
            res[value.Company]['total'] += value.Award_Amount;
            res[value.Company]['sbir_count'] += 1;
            res[value.Company]['count'] += 1;
          }
          else if (value.Program === "STTR") {
            res[value.Company]['sttr'] += value.Award_Amount;
            res[value.Company]['total'] += value.Award_Amount;
            res[value.Company]['sttr_count'] += 1;
            res[value.Company]['count'] += 1;
          }
          return res;
        }, {});

        fundSummary.sort((a, b) => b.total - a.total)
        showCdGraph(fundSummary,countSummary);


      }
      else if (state.selectedGraph === "grants-graph"){
            /*Hubzone_Owned: "N"
            Number_Employees: "17"
            Phase: "Phase II"
            Program: "SBIR"
            Socially_and_Economically_Disadvantaged: "N"
            Woman_Owned: "Y"*/
            data.reduce(function(res, value) {
              if (!res[district]) {
                res[district] = { district: district,
                  'women_owned':0, 'women_owned_count':0, 
                  'socioecon':0 , 'socioecon_count': 0,
                  'hubzone':0 , 'hubzone_count':0,
                  'phase_1': 0, 'phase_1_count':0,
                  'phase_2': 0, 'phase_2_count':0,
                  'employees': [],
                  'award_amts': [],
                  'companies': [],
                  'sbir': 0, 'sttr': 0, 'total': 0, 'count':0, 'sbir_count': 0,'sttr_count': 0
              };
                fundSummary.push(res[district])
    
              }
              if (value.Program === "SBIR") {
                res[district]['sbir'] += value.Award_Amount;
                res[district]['total'] += value.Award_Amount;
                res[district]['sbir_count'] += 1;
                res[district]['count'] += 1;
              }
              else if (value.Program === "STTR") {
                res[district]['sttr'] += value.Award_Amount;
                res[district]['total'] += value.Award_Amount;
                res[district]['sttr_count'] += 1;
                res[district]['count'] += 1;
              }
              if (value.Phase === "Phase II") {
                res[district]['phase_2'] += value.Award_Amount;
                res[district]['phase_2_count'] += 1;
              }
              else {
                res[district]['phase_1'] += value.Award_Amount;
                res[district]['phase_1_count'] += 1;
              }
              if (value.Socially_and_Economically_Disadvantaged === "Y") {
                res[district]['socioecon'] += value.Award_Amount;
                res[district]['socioecon_count'] += 1;
              }
              if (value.Woman_Owned === "Y"){
                res[district]['women_owned'] += value.Award_Amount;
                res[district]['women_owned_count'] += 1;
              }
              if (value.Hubzone_Owned === "Y"){
                res[district]['hubzone'] += value.Award_Amount;
                res[district]['hubzone_count'] += 1;
              }
              res[district]['employees'].push(parseInt(value.Number_Employees))
              res[district]['award_amts'].push(parseInt(value.Award_Amount))
              res[district]['companies'].push(value.Company)


              return res;
            }, {});
    
            
            showCdGraph(fundSummary,countSummary);
    
      }
  
  };


};

  //var agencies = data.map(d=>d.Agency)
  //console.log('agencies in data',agencies)


function updateHides(d){
  console.log("update hides getting",d)
  if (state.parcoordsState === "funding"){
    if (d !== "TOTAL"){
      //let agency = Object.keys(agencyNames)[Object.values(agencyNames).indexOf(d)]
      //agency = agency.replaceAll(" ","-")
      //console.log("this would be the checkbox id",agency)
      //d3.select("#"+agency).property("checked",false)
   
    }
  }


  //console.log("bac to state",state)
  state.hiddenAxes[state.parcoordsState].push(d)

  
  state.hiddenAxes[state.parcoordsState] = [... new Set(state.hiddenAxes[state.parcoordsState])]

  console.log("state update after adding d",state)
  var justHidden = state.currentAxes[state.parcoordsState].indexOf(d);
  //console.log("just hidden index for",d," is ",justHidden," while the current axis list was",state.currentAxes[state.parcoordsState]);


  // MARCH 12 - if updating parcoords plot, current Axes come from diff source than industryNames

  if (state.parcoordsState === "econ") {
    state.currentAxes["econ"] = Object.keys(industryNames).filter( ( el ) => !state.hiddenAxes["econ"].includes( el ) );

  }
  else if (state.parcoordsState === "funding"){
    let curr_dims = {};
    curr_dims["TOTAL"] = pc_dims["TOTAL"]
    state.selectedAgencies.forEach(function(a){curr_dims[agencyNames[a]] = pc_dims[agencyNames[a]]  })
    state.currentAxes["funding"] = Object.keys(curr_dims)

    //state.currentAxes[state.parcoordsState] = Object.keys(curr_dims).filter( ( el ) => !state.hiddenAxes["funding"].includes( el ))
  }
  //console.log("HIDDEN ARE",state.hiddenAxes, "CURRENT ARE",state.currentAxes[state.parcoordsState]);

  // then update the ids for the new label order, so popovers work
  parcoords.svg.selectAll(".label")
  .attr("axis-id",(d,i)=>state.currentAxes[state.parcoordsState][i])
  .attr("data-bs-content",  (d,i)=> `<div class="axis-remove" data-bs-dismiss="alert" id="${state.currentAxes[state.parcoordsState][i]}">&times;</div>`
  );

  parcoords.svg.selectAll(".dimension")
  .attr("axis-id",(d,i)=>state.currentAxes[state.parcoordsState][i]);


  // if that item was the color palette, pass the selection onto the first axis still available
  // and update the palette string
  if (state.color === d) {
    change_color(state.currentAxes[state.parcoordsState][0]);
    state.color = state.currentAxes[state.parcoordsState][0];
    parcoords.bundleDimension(state.color);
    //console.log("so we switched the bolding and color choice to",state.currentAxes[state.parcoordsState][0]," from the list where axes are",state.currentAxes[state.parcoordsState]);


  };
  //console.log("BEFORE RESETTING DIM",parcoords.state);
  if (state.parcoordsState === "funding"){
    let curr_dims = {};
    curr_dims["TOTAL"] = pc_dims["TOTAL"]
    state.selectedAgencies.forEach(function(a){curr_dims[agencyNames[a]] = pc_dims[agencyNames[a]]  })


    delete curr_dims[d]
    state.currentAxes["funding"] = Object.keys(curr_dims)

    parcoords.dimensions(curr_dims).hideAxis(state.hiddenAxes[state.parcoordsState])
  }
  else {
    parcoords.hideAxis(state.hiddenAxes["econ"])

  }

  // change the tick format
  parcoords.svg.selectAll(".axis .tick text").each(function(d, i) {
    if (state.parcoordsState === "econ"){
      d3.select(this).text(d3.format(".0%")(d));
    }
    else if (state.parcoordsState == "funding"){
      d3.select(this).text("$"+d3.format(".1s")(d).replace("G","B")    );

    } 
    
  })
  //console.log("AFTER TRYING DIMENSIONS UPDATE",parcoords.state);
  infobar.html(state.paletteInfoString[state.parcoordsState]);
  //console.log("brush state",parcoords.state)
};


// function to remove map layers
function clear_maplayer(layer) {
  mymap.removeLayer( layer );
};

// function to change map chloropleth color variable
function change_map_color(){
  // remove any old map layer 
  if (state.currentChloroLayer !== null) {
    mymap.removeLayer(state.currentChloroLayer);
    //console.log("I REMOVED THE MAP LAYER",state.currentChloroLayer)
  };
  // change map color
  var chloroLayer = L.geoJson(distr_data,{
    style: style,
    onEachFeature: onEachFeature
  });
  state.currentChloroLayer = chloroLayer;
  chloroLayer.addTo(mymap);
  brushMap();
};


// update color for parcoords, calls map color change too
function change_color(dimension) {
  


  state.color = dimension;

  // MARCH 12 - palette info String would change for switched parcoords data,
  // Likely we'd also want an alternate, unidimensional color scale for funding data
  if (state.parcoordsState === "econ") {
    state.paletteInfoString['econ'] = `<strong>% District Employed In:</strong> ${industryNames[state.color]}</br>${get_infobar_stats(state.color)}`

  }
  else if (state.parcoordsState === "funding"){
	//console.log("changing color and on funding setting...")
    let sel_agency;
    if (dimension === "TOTAL"){
      sel_agency = "All <u>selected</u> funding agencies"
    }
    else {
      let agency_abbrev = dimension;
      sel_agency = Object.keys(agencyNames)[Object.values(agencyNames).indexOf(dimension)]  
    }
  
    let years = []
    if (state.selectedYears[0] === state.selectedYears[1]){
      years.push(state.selectedYears[0])
    }
    else {years = state.selectedYears}
    let yearString = ""
    if (years.length === 1) {
      yearString = String(years[0])
    }
    else {yearString = "SBIR/STTR Funding ("+String(years[0])+"-"+ String(years[1])+"): "}
    // alt label = Current agency:
    state.paletteInfoString['funding'] = `<p class="funding-current-paletteInfoString"><strong>Funding from: </strong>${sel_agency}</br><strong>${yearString}</strong>${get_infobar_stats(state.color)}</p>`
  }



  //console.log("color Dim",state.color)
  parcoords.svg.selectAll(".dimension")
    .style("font-weight", "normal")
    .filter(function(d,i) { return state.currentAxes[state.parcoordsState][i] == dimension; })
    .style("font-weight", "bold")

  //MARCH 12 - want to change this with alternate color scale if it's not industries data
  if (state.parcoordsState === "econ"){
    parcoords.color(zcolor(parcoords.data(),dimension)).render();
    // tailor the legend labels depending on the % interpretation of the zscore
    var industries =  [ ...shortAttributeNames.values() ];
    var selectedVar = industries.indexOf(state.color);
    selectedVar = [...shortAttributeNames.keys()][selectedVar]
    let stat = industStats_global[selectedVar]
    console.log("STAT",stat,selectedVar)

    let vals = [(-2*stat.stdev+stat.mean), -0.5*stat.stdev+stat.mean, stat.mean, 0.5*stat.stdev+stat.mean, 2*stat.stdev+stat.mean]

    let labels = [];
    for (i = 0; i<vals.length; i++){
      if (i==0 && vals[i] < 0.001) {
        labels.push("<0.1%")
      }
      else if (i==0){
        labels.push("<"+d3.format(".1%")(vals[i])  )
      }
      else if (i===vals.length-1) {
        labels.push(d3.format(".1%")(vals[i])+"+")
      }
      else  {labels.push(d3.format(".1%")(vals[i]))}

    }
    d3.selectAll(".leg-swatch").data(labels).text(d=>d)
  }
  else if (state.parcoordsState === "funding"){
    parcoords.color(linearColor(parcoords.data(),dimension)).render();

    // these are the default colors we have for the legend
    let defaultColors = ["rgb(43, 131, 186)","rgb(138, 190, 173)", "rgb(218, 199, 130)", "rgb(243, 134, 72)" ,"rgb(215, 25, 28)"]
    // grab the color scale from the functions
    var colorscale = d3.scaleQuantize()
    .domain(d3.extent(d3.map(parcoords.data(),d=>d[dimension])))
    .range(["rgba(43, 131, 186,0.4)", "rgb(138, 190, 173)", "rgb(218, 199, 130)","rgb(243, 134, 72)","rgb(215, 25, 28)"])
    console.log('first color',colorscale.invertExtent(defaultColors[0]),colorscale.invertExtent(defaultColors[1]))
    let labels = [];
    for (i=0; i<defaultColors.length; i++){
      if (i===0) {
        let label = colorscale.invertExtent(defaultColors[i+1])[0]
        labels.push("<$"+d3.format(".2s")(label).replace("G","B"))
      }
      else if (i===defaultColors.length-1) {
        let label = colorscale.invertExtent(defaultColors[i])[1]
        labels.push("$"+d3.format(".2s")(label).replace("G","B")+"+")
      }
      else  {
        let label = colorscale.invertExtent(defaultColors[i])[1]
        labels.push("$"+d3.format(".2s")(label).replace("G","B"))}
    }
    d3.selectAll(".leg-swatch").data(labels).text(d=>d)

    //quantize.invertExtent(value)

  }
  
  //parcoords.color(zcolor(parcoords.data(),dimension)).render()
  infobar.html(state.paletteInfoString[state.parcoordsState])

  change_map_color();

  
 




  //console.log("NOW I RESET THE CHLOROLAYLER",state.currentChloroLayer)

};

function chloroLinear(d){
  var extent = d3.extent(d3.map(parcoords.data(),d=>d[state.color]))
  // show must have received some funding to get colored
  extent[0] = 1
  var colorscale = d3.scaleQuantize()
      .domain(extent)
      .range(["rgba(43, 131, 186,0.7)", "rgb(138, 190, 173)", "rgb(218, 199, 130)","rgb(243, 134, 72)","rgb(215, 25, 28)"])
      //.range(d3.schemeSpectral[6])
      

  if (d>0){return colorscale(d)}
  else {return "rgb(161, 161, 161,0.4)";}
};


// a linear color scale for when we're doing funding parcoords
function linearColor(data, dimension){

  var colorscale = d3.scaleQuantize()
      .domain(d3.extent(d3.map(parcoords.data(),d=>d[state.color])))
      .range(["rgba(43, 131, 186,0.4)", "rgb(138, 190, 173)", "rgb(218, 199, 130)","rgb(243, 134, 72)","rgb(215, 25, 28)"])
      //.range(d3.schemeSpectral[6])
    

  return function(d) { if (d[dimension] === 0) {return "rgba(161, 161, 161,0.8)";}
                      else {return colorscale(d[dimension])}
  }
                      
  
  

};


// return color function based on plot and dimension
function zcolor(col, dimension) {
  var z = zscore(_(col).pluck(dimension).map(parseFloat))
  return function(d) { return zcolorscale(z(d[dimension])) }
};

// color by zscore
function zscore(col) {
  var n = col.length,
      mean = _(col).mean(),
      sigma = _(col).stdDeviation();
  return function(d) {
    return (d-mean)/sigma;
  };
};
// get statistics for industry dimensions for the infobar and zscore computation
function dimensionStats(col){
  var n = col.length;
  var mean = d3.mean(col);
  var sigma = d3.deviation(col);
  return [mean,sigma];
  
};

// FUNCTION - String filter for grid/parcoords search
function stringFilter(item, args) {
  /*if (item["percentComplete"] < args.percentCompleteThreshold) {
    return false;
  }*/
  if (args.searchString != "" && 
      args.searchString.length > buffer &&
      item[args.sortcol].toLowerCase().indexOf(args.searchString.toLowerCase()) == -1) {
    
    return false;
  }
  
  return true;
};

// FUNCTION - not sure what this is, its' not called anywhere
function percentCompleteSort(a, b) {
  return a["percentComplete"] - b["percentComplete"];
};
  
// FUNCTION - column sorting
function comparer(a, b) {
  var x = a[sortcol], y = b[sortcol];
  return (x == y ? 0 : (x > y ? 1 : -1));
};

// FUNCTION - Grid update
function gridUpdate(data) {
  // initialize the model after all the events have been hooked up
  dataView.beginUpdate();
  dataView.setItems(data);
  dataView.setFilterArgs({
    percentCompleteThreshold: percentCompleteThreshold,
    searchString: searchString,
    sortcol: sortcol
  });
  dataView.setFilter(stringFilter);
  dataView.endUpdate();
  
}; 

// FUNCTION - filtering update
function updateFilter() {
  dataView.setFilterArgs({
    percentCompleteThreshold: percentCompleteThreshold,
    searchString: searchString,
    sortcol: sortcol
  });
  dataView.refresh();

  showQueryPaths();


};
// FUNCTION - clear the highlighting when the string has been removed from search to be below buffer
function preClear(searchString) {
  if (searchString.length < buffer) {
    //parcoords.unhighlight(parcoords.data());
    parcoords.unmark()
    parcoords.unhighlight(parcoords.data())
    // MARCH 12 -- add a reset of the map zoom
    mymap.setView([39.425,-94.796], 3.5);
    
  }
};

// FUNCTION -- highlight behavior for the parcoords when the text string is typed
// TO DO - this can be updated to include map highlighting as well
function showQueryPaths () {
  // hmmmmm... is this where highlighting can get its values?
  state.selectedRows = dataView.getItems().filter(d=> searchString.length > buffer && d[sortcol].toLowerCase().includes(searchString));
  state.unselRows = dataView.getItems().filter(d=>!d[sortcol].toLowerCase().includes(searchString));

  parcoords.unhighlight(state.unselRows);
  parcoords.highlight(state.selectedRows);

  // alaska is an exception to the zoomfunction, handle this as an exception
  if (searchString.toLowerCase().includes("alas")){
    mymap.setView([ 65.017086,-151.083984],3.5);
  }
  else{
    // MARCH 12 -- zoom to the highlighted features bounds
    //var layers_ix = Object.keys(state.currentChloroLayer._layers)
    var layers = getDistricts(mymap)
    var selGEOID = state.selectedRows.map(d=>d.GEOID)

    var filtLayers = layers.filter(d=>Object.keys(d).includes("feature"))
    filtLayers = filtLayers.filter(d=>selGEOID.includes(d.feature.properties.AFFGEOID))
    //var filt_ix = d3.map(filtLayers,d=>layers_ix.indexOf(d))
    filtLayers = new L.featureGroup(filtLayers);
    //console.log("layers on query mpaths",layers,selGEOID,filtLayers)
    mymap.fitBounds(filtLayers.getBounds().pad(0.5));
    //console.log( "Sel Size",state.selectedRows);


  }
  

 
};
// text casing function 
function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
};


// text wrapping function
function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
};

function type(d) {
  d.value = +d.value;
  return d;
};
// setup the parcoords plot
function initParcoords(){

  // PC INIT - set the state equal to the industryName keys minus the default hidden

  if (state.parcoordsState === "econ"){
    $("#parcoords").remove();
    var pc_container = d3.select("#parcoords-container").append("div").attr("class","parcoords").attr("id","parcoords");


    state.procData = state.acsData;
    // MARCH 12 - this could stay the same and get switched out later in the draw funct, if we switch pc data
    state.currentAxes[state.parcoordsState] = Object.keys(industryNames).filter( ( el ) => !state.defaultHiddenAxes["econ"].includes( el ) );
    // INIT - set up the base of parcoords and its settings
    parcoords = ParCoords()("#parcoords")
      .rate(20)
      .composite("darker-over")
      //.brushedColor("#000")
      .mode("queue") // progressive rendering
      //.width(d3.max([800, 220]))
      /*.margin({
        top: 10,
        left: 10,
        right: 50,
        bottom: 20,
      })*/
      .smoothness(0.13)
      .alphaOnBrushed(0.15)
      .alpha(0.8) 

      // MARCH 12 -- these would change depending on data source for pc data
      state.hiddenAxes[state.parcoordsState] = d3.map(state.defaultHiddenAxes["econ"], d=>d)
      state.color = state.defaultColor["econ"];

      // INIT - Corresponding Slick Grid columns
      var column_keys = [ "name","AGRIC","CNSTR","MFCTR","WHOLE","RETAIL","TRNSP-UTIL",
      "INFO","FNC-REAL","SCI-MGMT","ED-HLTH","ARTS-ENT","OTHER","PUBADMIN","profile","GEOID"    ]
      var columns = column_keys.map(function(key,i) {
        return {
          id: key,
          name: key,
          field: key,
          sortable: true,
        }
      });
  }
  else if (state.parcoordsState === "funding"){
    $("#parcoords").remove();
    var pc_container = d3.select("#parcoords-container").append("div").attr("class","parcoords").attr("id","parcoords");

  
    state.procData = state.filtCdAggData;
    //console.log("STATE is now, on swithcing to funding",state)
      // MARCH 12 - this could stay the same and get switched out later in the draw funct, if we switch pc data
    state.hiddenAxes["funding"] = d3.map(state.defaultHiddenAxes["funding"],d=>d)

    for (i = 0; i<Object.values(agencyNames).length; i++){
      if (!state.selectedAgencies.includes(Object.keys(agencyNames)[i])){
        state.hiddenAxes["funding"].push(Object.values(agencyNames)[i])
      }
    }
    let curr_dims = {};
    curr_dims["TOTAL"] = pc_dims["TOTAL"]
    state.selectedAgencies.forEach(function(a){curr_dims[agencyNames[a]] = pc_dims[agencyNames[a]]  })

    state.currentAxes[state.parcoordsState] = Object.keys(curr_dims).filter( ( el ) => !state.hiddenAxes["funding"].includes( el ) );
    // INIT - set up the base of parcoords and its settings


  
    parcoords = ParCoords()("#parcoords")
      .rate(20)
      .composite("darker-over")
      //.brushedColor("#000")
      .mode("queue") // progressive rendering
      //.width(d3.max([800, 220]))
      .margin({
        top: 30,
        left: 15,
        right: 30,
        bottom: 10,
      })
      .smoothness(0.13)
      .alphaOnBrushed(0.15)
      .alpha(0.8)



      state.color = state.defaultColor[state.parcoordsState];
      infobar.html(state.paletteInfoString[state.parcoordsState])


      // INIT - Corresponding Slick Grid columns
      // *MAR
	//console.log("STATE BFOE GRID",state)
      var column_keys = Object.keys(state.procData[0])
      var columns = column_keys.map(function(key,i) {
        return {
          id: key,
          name: key,
          field: key,
          sortable: true,
        }
      });
  }
  
  
  // INIT - slick grid opts
  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    //multiColumnSort: true,
    asyncEditorLoading: true,

  };
  // INIT - slick grid and pager
  dataView = new Slick.Data.DataView({inlineFilters: true });
  grid = new Slick.Grid("#districts-table", dataView, columns, options);
  grid.setSelectionModel(new Slick.RowSelectionModel());
  //var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

  pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));



      // INIT - wire up the search textbox to apply the filter to the model
  $("#parcoords-search").keyup(function (e) {
    Slick.GlobalEditorLock.cancelCurrentEdit();
    // clear on Esc
    if (e.which == 27) {
      this.value = "";
    }

  
    searchString = this.value.toLowerCase();
    // get ahead of ourselves to avoid the full-highligted graph
    preClear(searchString);
    updateFilter();
  });

  
  var gridcols = grid.getColumns();
    gridcols[0].width = 180;
    grid.setColumns(gridcols);

  
};

// read the recipients and awards data and add recipients to map
function initAwardsData(){

  d3.csv('data/sbir_2008to2018_geoRefed.csv').then(function(data){
    // Remember when we started
    console.time("awardsload");
    // Remember when we finished
    data.forEach(function(award){
      award["Award_Amount"] = parseInt(award["Award_Amount"])
    });
    state.awardsData = data;
    var t1 = performance.now();
    //console.log("state after awards",state.awardsData,"time",(t1 - t0) + " milliseconds.");
    d3.csv('data/cd116_sbirRecipients_epsg4326.csv').then(function(data) {

      // INIT - Process the data, select only the variables from it we need 
      // Note: slickgrid needs each data element to have an 'id'
      //data.forEach(function(d,i) { d.id = d.id || i; });
      //console.log("RECIPS DATA AT FIRST LOAD",data)
      var procData = [];
      data.forEach(function(recipient) {
        let rData = {};
        rData["STATEFP"] = recipient["STATEFP"]
        rData["AFFGEOID"] = recipient["AFFGEOID"]
        rData["Company"] = recipient["Company"]
        rData["DUNS"] = recipient["DUNS"]
        rData["Address1"] = recipient["Address1"]
        rData["lat"] = parseFloat(recipient['Latitude'])
        rData["long"] = parseFloat(recipient["Longitude"])
        rData["distr_name"] = recipient["distr_name"]
        rData["City"] = recipient["City"]
        rData["County"] = recipient["County"]
        rData["State"] = recipient["State"]
        procData.push( rData );
        });
  
      //console.log("Processed recips",procData);
      state.recipsData = procData;
      // MARCH 11: update this call to go to the filters, from teh filter functs, proceed with call to add recips
      filterAwardsRecips();
    });
  });
  
};


function filterAwardsRecips(){
 
  //console.log("update button works");
  // filter awards by years and agencies
	//console.log("stateyear range",state.yearRange,"sel years",state.selectedYears)
  state.yearRange = [...new Set(state.yearRange)]
  state.filtAwards = state.awardsData.filter( d=> state.yearRange.includes(parseInt(d.Award_Year))) ;
  state.filtAwards = state.filtAwards.filter( d=> state.selectedAgencies.includes(d.Agency));


  state.fundedGEOIDS = [...new Set(d3.map(state.filtAwards,d=>d.AFFGEOID_CD116))];


  // getting aggregates by the year and agency for each to display in teh parcoords is intensive..
  // this needs to happen in python to prep a json file, if necessary
  /*
  var fundingStats = [];
  let geo_list = d3.map(state.procData,d=>d.GEOID)
  // make agency level summary stats by geography
  for (i = 0; i < 437; i++) {
    let geo = geo_list[i];
    //console.log('GEO?',geo)
    var res = {"AFFGEOID":geo};
    for (a = 0; a< Object.keys(agencyNames).length; a++){
      // we'll show for all agencies in the parcoords
      let awards = state.awardsData.filter(d=> state.yearRange.includes(parseInt(d.Award_Year)));
      awards = awards.filter(d=>d.AFFGEOID_CD116 === geo);
      awards = awards.filter(d=>d.Agency == Object.keys(agencyNames)[a]);
      if (awards.length === 0 ){
        res[Object.values(agencyNames)[a]] = 0
      }
      else {
          function amount(item){
            return parseInt(item.Award_Amount);
          }
          function sum(prev, next){
            return prev + next;
          }
          res[Object.values(agencyNames)[a]] = awards.map(amount).reduce(sum);
      }
    }
    fundingStats.push(res)
  }
	//console.log("FUNDING STATS SUM",fundingStats)*/


  // filter recipients based on the awards in the current selection

  var slugs = [];
  state.filtAwards.forEach(function(award) {
    var s = String(award['Company'])+String(award["DUNS"])+String(award["Address1"])
    slugs.push(s)
  })
  state.filtRecipsData = state.recipsData.filter( award => slugs.includes(String(award['Company'])+String(award["DUNS"])+String(award["Address1"])) )

  // filtered the data
  //console.log("filtered the data","awards",state.filtAwards,"recips",state.filtRecipsData)
  // now add the recips to the map, update Cd Vocab and Stats as needed
  addRecipsToMap(state.filtRecipsData);
  getCdStats(state.currentCd);
  getCdVocab(state.currentCd);


};


// MARCH 12 - compute aggregate stats depending on the filter, for parcoords switch
function switchParcoordsData(){

  console.log("filt state before swithc",state.procData,state.filtCdAggData)

  if (state.parcoordsState === "econ"){
    state.procData = state.acsData;
    initParcoords();
    draw();
  }
  else if (state.parcoordsState === "funding"){
     // reset the brush on any existing parcoords
      parcoords.brushReset();
      brushMap();

      d3.csv('data/cd116_agency_year_fund_aggs.csv').then(function(data) {

        // slickgrid needs each data element to have an id
        data.forEach(function(d,i) { d.id = d.id || i; });
        // if we've read the data once before, then just set the current filters
        state.cdAggData = data;
	//console.log("year range",state.yearRange)
        let filtCdFund = state.cdAggData.filter(d=>state.yearRange.includes(parseInt(d.year)))
	//console.log("AGG DATA",state.cdAggData,"FILT CD FUND",filtCdFund)
        

        if (state.yearRange.length > 1){
	//console.log("at start of summ loop",state.selectedAgencies)
          var aggCdFund = {};
          var result = filtCdFund.reduce(function(r, o) {
            var key = String(o.GEOID)
            
            if(!aggCdFund[key]) {
              aggCdFund[key] = {"name": o["name"],"TOTAL":0}
              r.push(aggCdFund[key]);
            } else {
              for (i = 0; i<Object.values(agencyNames).length; i++){
                let agency = String(Object.values(agencyNames)[i]);
                let agency_full = String(Object.keys(agencyNames)[i]);
                if (state.selectedAgencies.includes(agency_full)){
                    //console.log("agency",agency)
                  if(!aggCdFund[key][agency]){
                    aggCdFund[key][agency] = 0
                  }
                  aggCdFund[key][agency] += parseInt(o[agency])
                  aggCdFund[key]["TOTAL"] += parseInt(o[agency])
                }
                
                
                //console.log("agency",parseFloat(o[agency]))
              }
              aggCdFund[key]["GEOID"] = key
              aggCdFund[key]["id"] = key
              
            }
            return r;
          }, []);
          // unpack it
          aggCdFund = Object.values(aggCdFund)
          state.filtCdAggData = aggCdFund;
          state.procData = aggCdFund;
          console.log("state after switch coords update",state.procData,state.filtCdAggData)
        }
        else if (state.yearRange.length === 1){
          var aggCdFund = {};
          for (i=0; i<filtCdFund.length; i++){
           
            let key = filtCdFund[i]["GEOID"];
            aggCdFund[key] = {"name":filtCdFund[i]["name"],"TOTAL":0}

            for (j=0; j<Object.values(agencyNames).length; j++){
              aggCdFund[key][String(Object.values(agencyNames)[j])] = parseInt(filtCdFund[i][String(Object.values(agencyNames)[j])])
              aggCdFund[key]["TOTAL"] += parseInt(filtCdFund[i][String(Object.values(agencyNames)[j])]);
            }
            aggCdFund[key]["GEOID"] = key
            aggCdFund[key]["id"]= key
            
          }
          aggCdFund = Object.values(aggCdFund)
          state.filtCdAggData = aggCdFund;
          state.procData = aggCdFund;

        }
        
        //console.log("result ob",result)
        
	  //console.log("FILT CD FUND",filtCdFund,"Helper agg",aggCdFund,"STTE",state);
        if (state.lastClusterGroup != null) {
          state.lastClusterGroup.clearLayers();
        }
        
        initParcoords();
        draw();
            //console.log("DATA AT FIRST LOAD",data)
        
      });
    
    

    
  }

};


// add recipients data to the map
function addRecipsToMap(d){
 
  // if there is a previous cluster group already down, log it as the last, remove it
  state.lastClusterGroup = state.currentClusterGroup == null ? null : state.currentClusterGroup;
  if (state.lastClusterGroup != null) {
    state.lastClusterGroup.clearLayers();
  }

  var myIcon = L.icon({
    iconUrl: 'award-fill.svg',
    iconRetinaUrl: 'award-fill.svg',
    iconSize: [20, 20],
    iconAnchor: [9, 9],
    popupAnchor: [0, -14]
  });

  var markerClusters = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: maxZoomLevel
  });
 
  for ( var i = 0; i < d.length; ++i ) {
    var company = d[i].Company
    var duns = d[i].DUNS
    var addr = d[i].Address1
    
    /*var awards = state.awardsData.filter(x=>x.Company === company)
    //console.log("AWARDS FOR",d[i].Company,awards)
    var pop_content = `<strong>${d[i].Company}</strong>`
    for (var j = 0; j < awards.length; j++) {
      pop_content = pop_content + awards[j].Award_Title
    }*/

    var pop_content = d[i].Company+"</br>" ;
    /* 
    '<svg width="400" height="110"><rect width="300" height="100" style="fill:rgb(0,0,255);stroke-width:3;stroke:rgb(0,0,0)" /></svg>'+
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City + d[i].Company +
                '<br/>' + d[i].City */

    var popup = L.popup({maxHeight: 150}).setContent(pop_content);
    //console.log("right after declaring w max height we get",popup)

    var m = L.marker( [d[i].lat, d[i].long], {icon: myIcon} )
                    .bindPopup(pop_content+"Loading...")


    m._leaflet_id = company+"_"+duns+"_"+addr;
    m.on('click',function(e){
      // on marker click, call the function to get the awards info for the popup
      var popup = e.target.getPopup();
      //var popup = L.popup({maxHeight: 150}).setContent(getMarkerAwards(e.target._leaflet_id));
      popup.setContent(getMarkerAwards(e.target._leaflet_id));
      popup({maxHeight: 150})
      popup.update()
      //(this).bindPopup()

    });

  
    markerClusters.addLayer( m );
  };
  state.currentClusterGroup = markerClusters;
  mymap.addLayer( markerClusters )
};

// function to get the marker popup dynamically so not all of them have to render before necessary
// here the id is the company name, duns, and addr1
function getMarkerAwards(id){
    // MARCH 11: update this call to ensure it filters from the filtered award data
    var awards = state.filtAwards.filter(x=>x.Company+"_"+x.DUNS+"_"+x.Address1 === id)
    var slug = id.split("_")
    var company = toTitleCase(slug[0].replaceAll("&amp;","&")).replaceAll(" Llc"," LLC").replaceAll(" llc"," LLC").replaceAll(" INC"," Inc.")
    //console.log("AWARDS FOR",d[i].Company,awards)
    var pop_header = `<div class="awards-pop-header"><p class="awards-pop-company"><strong>${company}</strong></p></div>`
    var pop_content = "";
    awards.sort(function(a, b) {
      return parseFloat(b['Award_Amount']) - parseFloat(a['Award_Amount']);
    });
    for (var j = 0; j < awards.length; j++) {
      var title = awards[j]['Award_Title'].replaceAll("&amp;","&"),
        agency = awards[j]['Agency'],
        amount = awards[j]['Award_Amount'].toLocaleString(),
        program = awards[j]['Program'],
        phase = awards[j]['Phase'],
        year = awards[j]["Award_Year"]


      pop_content = pop_content + `<div class="row awards-pop-info"><div class="col awards-pop-col"><p class="awards-pop-title">${title}</p><p class="awards-pop-agency">${agency} </br>(${program}, ${phase}) - ${year}</p></div><div class="col-auto awards-pop-col"><p class="awards-pop-amount">$${amount}</p></div></div>`
      
    }
    return pop_header+'<div class="awards-pop-container">'+pop_content+'</div>' ;

};


// IF we don't want to use d3's json load, edit this function for parity; just use the global distr_data.js
function initIndustData(){


  var geojson = d3.json("data/cd116_5yearACS2018_LISAclust.geojson").then(function(data){
    
    var pctCols = ["pct_agro",	"pct_construct",	"pct_manufact",
    "pct_wholesale",	"pct_retail",	"pct_transport_util",
    "pct_information",	"pct_finance_realest",	"pct_prof_sci_mgmt_adm",
    "pct_edu_health",	"pct_arts_ent_food_rec",	"pct_otherserv",
    "pct_public_admin"]
    // parse string to float for pct cols
    for (i = 0; i < data.features.length; i++){
      for (j = 0; j < pctCols.length; j++){  
        data.features[i].properties[pctCols[j]] = parseFloat(data.features[i].properties[pctCols[j]]);
        distr_data.features[i].properties[pctCols[j]] =  parseFloat(distr_data.features[i].properties[pctCols[j]]);
      };  

    }
    // get dimension stats
    for (j = 0; j < pctCols.length; j++){  
      var dimStats = dimensionStats(d3.map(data.features,d=>d.properties[pctCols[j]]));
      //console.log("PCTCOL",pctCols[j],dimStats)
      state.industStats[String(pctCols[j])] = {"mean": dimStats[0],"stdev":dimStats[1]};
    };
    // compute normalized values
    for (i = 0; i < data.features.length; i++){
      for (j = 0; j < pctCols.length; j++){  
        var m = state.industStats[pctCols[j]]['mean']
        var s = state.industStats[pctCols[j]]['stdev']
        data.features[i].properties["norm_"+pctCols[j]] =  (data.features[i].properties[pctCols[j]] - m) / s  ;
        distr_data.features[i].properties["norm_"+pctCols[j]] =  (distr_data.features[i].properties[pctCols[j]] - m) / s  ;
      };  

    };
    
    state.industData = distr_data;

    change_map_color();

    });

   
    
};
// chloropleth style mapping
function style(feature) {

  if (state.parcoordsState === "econ"){
    var industries =  [ ...shortAttributeNames.values() ];
    var selectedVar = industries.indexOf(state.color);
    selectedVar = [...shortAttributeNames.keys()][selectedVar]
    var normVar = "norm_"+selectedVar;
    var clustVar = "LSAcl_."+selectedVar;
  }
  else if (state.parcoordsState === "funding"){
    var normVar = "";
    var clustVar = "";
  }
  

  //console.log("SELECTED VAR",selectedVar,"NORM VAR",normVar);
// do what you want to do with `data` here...
  return {
      fillColor: fundedChloro(feature,normVar),
      //chloroScale(feature.properties[normVar]),
      color: getBorderStyle(feature,clustVar)[0],
      weight: getBorderStyle(feature,clustVar)[1],
      opacity: getBorderStyle(feature,clustVar)[2],
      dashArray: '1',
      fillOpacity: getFillOpacity(feature)
  };
};



// function to set map polygons border styling

// MARCH 12 - update to switch for nonfunded districts
function getBorderStyle(feature,clustVar){

  if (state.parcoordsState === "econ") {
    var val = parseInt(feature.properties[clustVar])
    var district = feature.properties.AFFGEOID;
    var border =  val === 5 ?  ['darkslategray',0.5,0.6] :
                  val === 2 ? ['blue',1.25,0.6] :
                    ['red',1.25,0.6];
    if (state.currentCd === district) {border[1] = 4; border[2] = 1}
    else if (state.lastCd === district && border[0] === 'darkslategray') {border[1] = 0.5; border[2] = 0.6}
    else {border[1] = 1.25; border[2] = 0.6;}
  
    return border;
  }
  else if (state.parcoordsState === "funding"){
    var district = feature.properties.AFFGEOID;
    var border = ['darkslategray',1.25,0.6]
    if (state.currentCd === district) {border[1] = 4; border[2] = 1}
    //else if (state.lastCd === district && border[0] === 'darkslategray') {border[1] = 0.5; border[2] = 0.6}
    else {border[1] = 1.25; border[2] = 0.6;}
    return border;
    
  }
  
};
// MARCH 12 - update to switch for nonfunded districts
// function to set map polygons fill opacity, depending on selection
function getFillOpacity(feature){
  var district = feature.properties.AFFGEOID;
  if (state.currentCd === district) {return 0.9;}
  else {return 0.5;}

};

// MARCH 12 -- update to flip for parcoords data
function get_infobar_stats(dimension){

  if (state.parcoordsState === "econ"){
    var industries =  [ ...shortAttributeNames.values() ];
    var selectedVar = industries.indexOf(dimension);
    selectedVar = [...shortAttributeNames.keys()][selectedVar];
    //console.log("inputdimen",dimension,"infobarstatsset", selectedVar);
    
    // get stats from state
    var avg = industStats_global[selectedVar]['mean'];
    var dev =  industStats_global[selectedVar]['stdev'];
    var outString = `<strong>Sector Nat'l Employment Avg.:</strong> ${Math.round(avg*100)}% </br><strong>Std. Deviation:</strong> ${Math.round(dev*100)}%`
    return outString;
  }
  else if (state.parcoordsState === "funding"){
    //let agency_abbrev = dimension;
    //let agency_full = Object.keys(agencyNames)[Object.values(agencyNames).indexOf(agency_abbrev)]
    let total = 0;
    state.filtCdAggData.forEach(d=> total+= d[dimension])
    return "$"+d3.format(".4s")(total).replace("G","B");
  }

};


// chloropleth district highlight
function highlightFeature(e) {
  //console.log('highlight gives you e',e)


  // if the layer is already selected, dont do anything, if it's not, do highlighting
  // this helps to reduce the highlighting jitters when teh map is zoomed in far enough
  if (state.currentCd !== e.target.feature.properties.AFFGEOID) {
    var layer = e.target;

    layer.setStyle({
        weight: 3,
        opacity: 0.8,
        dashArray: '',
        fillOpacity: 0.8
    });
  };

  

  /*if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
  };*/
  //console.log("Map highlight e",e)
  var selected_dist_id = parcoords.data().filter(d=>d.GEOID === e.target.feature.properties.AFFGEOID);

  var unselected_dist_id = parcoords.data().filter(d=>d.GEOID !== e.target.feature.properties.AFFGEOID);
  //console.log("ON HIGHLIHGT","selected are",selected_dist_id,"unselected are",unselected_dist_id);
  //console.log("parcoords dist id",dist_id)
  // highlight the path in parcoords
  parcoords.unhighlight(unselected_dist_id)
  parcoords.unmark(unselected_dist_id)
  parcoords.highlight(selected_dist_id); 


  //gridUpdate(selected_dist_id)
  //brushMap();

};
// reset highlight
function resetHighlight(e) {
  state.currentChloroLayer.resetStyle(e.target);
  
  // keep the highlighting set to only the selected Cd
  var selected_dist_id = d3.filter(parcoords.data(),d=>d.GEOID === e.target.feature.properties.AFFGEOID)
  var unselected_dist_id = d3.filter(parcoords.data(),d=>d.GEOID !== e.target.feature.properties.AFFGEOID)
  var marked_dist = d3.filter(parcoords.data(),d=>d.GEOID === state.currentCd)
  // update parcoords accordingly

  parcoords.unhighlight(unselected_dist_id);
  
  parcoords.mark(marked_dist);


  brushMap();
};

function zoomToFeature(e) {

  

	//console.log("natural click e",e)

  // fit bounds
  // alaska is causing issues, so we handle that case manually
  if (e.target.feature.properties.AFFGEOID === "5001600US0200"){
    mymap.setView([ 65.017086,-151.083984],3.5);
  }
  else {
    mymap.fitBounds(e.target.getBounds());

  }


  // get id in parcoords and highlight/unhighlight as needed
  var selected_dist_id = d3.filter(parcoords.data(),d=>d.GEOID === e.target.feature.properties.AFFGEOID)
  var unselected_dist_id = d3.filter(parcoords.data(),d=>d.GEOID !== e.target.feature.properties.AFFGEOID)
  parcoords.unhighlight(unselected_dist_id);
  parcoords.unmark(unselected_dist_id);
  //parcoords.highlight(selected_dist_id);
  
  parcoords.highlight(selected_dist_id);


  // change state
  state.lastCd = state.currentCd
  var district = e.target.feature.properties.AFFGEOID;
  state.currentCd = district

  // if the user clicked the same district again, let's clear the parcoords highlighting
  if (state.lastCd === state.currentCd && state.cdReclick === 0){
    parcoords.unhighlight(selected_dist_id);
    parcoords.unmark(selected_dist_id);
    state.cdReclick += 1;
  }
  else if (state.lastCd === state.currentCd && state.cdReclick === 1) {
    parcoords.mark(selected_dist_id);
    parcoords.unmark(unselected_dist_id)
    parcoords.unhighlight(unselected_dist_id);
    state.cdReclick = 0;
  };
  
  // reset the last selected district 
  var map_layers = [state.currentChloroLayer._layers][0]
  var last_layer = Object.filter(map_layers, d => d.feature.properties.AFFGEOID === state.lastCd);
  //console.log("LAST LAYER",last_layer)
  last_layer = last_layer[0];
  state.currentChloroLayer.resetStyle(last_layer);

  
  getCdStats(state.currentCd);
  // get the vocab for that district -- state gets reset here too
  getCdVocab(state.currentCd);

  // reset style of last Cd
  
  // TO DO: update state for selected district, 
  // use selected district to override style palette
  // use brushed districts to zoom, too
  var layer = e.target;
  layer.setStyle(style);
};


function onEachFeature(feature, layer) {
  layer._id = feature.AFFGEOID;
  layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature,

  });
};


function brushMap(){
  Object.filter = (obj, predicate) => 
  Object.keys(obj)
        .filter( key => predicate(obj[key]) )
        .reduce( (res, key) => (res[key] = obj[key], res), {} );

  var map_layers = [state.currentChloroLayer._layers][0]
  var brushedrows = parcoords.brushed();

  // as long as not every thing is brushed or no brushes are applied...
  if ((state.parcoordsState === "econ" && brushedrows != false && brushedrows.length != 437) || (state.parcoordsState === "funding" && brushedrows != false && brushedrows.length != 427)) {
    var brushed_ids = []
    brushedrows.forEach(d=>brushed_ids.push(d.GEOID))
    //console.log('brushed rows',brushedrows,"ids",brushed_ids);
    
    var brushed_layers = []
    var brushed_layers = Object.filter(map_layers, d => brushed_ids.includes(d.feature.properties.AFFGEOID)); 
    brushed_layers = Object.keys(brushed_layers);
    var nonbrushed_layers = Object.filter(map_layers, d => !brushed_ids.includes(d.feature.properties.AFFGEOID)); 
    nonbrushed_layers = Object.keys(nonbrushed_layers);
    for (i=0; i<brushed_layers.length; i++){
      state.currentChloroLayer.getLayer(brushed_layers[i]).setStyle({
        weight: 1.5,
        //color: 'black',
        dashArray: '',
        fillOpacity: 0.9,
        opacity: 0.9
      });
    };
    for (i=0; i<nonbrushed_layers.length; i++){
      var layer = state.currentChloroLayer.getLayer(nonbrushed_layers[i])
      state.currentChloroLayer.resetStyle(layer);
    };
  }
  else {
    for (i=0; i<map_layers.length; i++){
      var layer = state.currentChloroLayer.getLayer(map_layers[i])
      state.currentChloroLayer.resetStyle(layer);
    };

  };

  //console.log("NO BRUSHED",brushedrows);
  
  //state.currentChloroLayer._layer.forEach()
  //state.currentChloroLayer.eachLayer(function(layer) { highlightFeature(layer, doesRelate(layer._id, d.AFFGEOID)); });
  
  
  
  //console.log("map brushed",);
  
};

// use this for getting grammatical number suffixes in getCdTextSummary
function ordinal_suffix_of(i) {
  var j = i % 10,
      k = i % 100;
  if (j == 1 && k != 11) {
      return i + "st";
  }
  if (j == 2 && k != 12) {
      return i + "nd";
  }
  if (j == 3 && k != 13) {
      return i + "rd";
  }
  return i + "th";
}




function getCdTextSummary(district,awards){
	//console.log("filteredCdAwards",state,"district/awards",district,awards)

  var acs_data = state.acsData.filter(d=>d.GEOID === district)
  


  // intro
  let intro;
  let years = [... new Set(state.selectedYears)]
  if (years.length == 1){
    intro = `In ${years[0]}`
  }
  else { intro = `Between ${years[0]} and ${years[1]}, `}
  
  // district grammar
  var name = acs_data[0]['name']
  var us_state = name.split(",")[1].trim().replace("District of Columbia","Washington D.C.")
  var district_no = name.split(",")[0].replace("District","")


  let districtString = ""
  if (district_no.includes("Large")){
    districtString = us_state+"'s sole Congressional District in the 116th Congress (2018)"
  }
  else {districtString = us_state+"'s "+ordinal_suffix_of(parseInt(district_no))+" Congressional District in the 116th Congress (2018)"}

  let district_titleString = districtString.replace(" in the 116th Congress (2018)","").replace("Congressional","").replace("sole","At Large")


  // num awards
  let awardsDescription = ""
  let awards_number = awards.length;
  // if there are awards to the district...
  if (awards_number !== 0) {
    let awards_total = 0;
    for (i = 0; i<awards_number; i++){
      awards_total += parseInt(awards[i]["Award_Amount"])
    }
    awards_total = "$"+d3.format(".4s")(awards_total).replace("G","B")  
    let awards_numString = ` received <strong>${awards_number} awards</strong>, totaling <strong>${awards_total}</strong> from the selected Federal departments and agencies. `
  
    // top recipients
    let aw_recips = []
    awards.reduce(function(res, value) {
      if (!res[value.Company]) {
        res[value.Company] = { Company: value.Company,'total': 0, 'count':0};
        aw_recips.push(res[value.Company])
  
      }
        res[value.Company]['total'] += value.Award_Amount;
        res[value.Company]['count'] += 1;
  
      return res;
    }, {});
  
    aw_recips.sort((a, b) => b.total - a.total)
    let topRecip = aw_recips[0]
    let topCompany = toTitleCase(topRecip.Company.replaceAll("&amp;","&")).replaceAll(" Llc"," LLC").replaceAll(" llc"," LLC").replaceAll(" INC"," Inc.")
    let topRecip_funds = "$"+d3.format(".2s")(topRecip.total).replace("G","B") 
    let topRecipStr = `<strong>${topCompany}</strong> was the company receiving the most funds from the selected agencies, receiving <strong>${topRecip.count} award(s)</strong> totaling <strong>${topRecip_funds}</strong>. `

    awardsDescription = awards_numString+topRecipStr;

  }
  // if the district received no awards...
  else {
    awardsDescription = " <u><em>does not appear to have received any funds through the SBIR and/or STTR programs from the selected Federal agencies and departments</u></em>.  Change the selected years and agencies to identify any additional funding this district may have received between 2008 and 2018, or go to SBIR.gov to find more data."
  }
  // Industry ranks
  let profile = acs_data[0]['profile'].split("),")
  let acsRanks = []
  let acsString = "According to the American Community Survey's 2018 estimates <em><strong>regarding this district's labor force</strong></em>, by proportion of civilian workers across the 437 districts nationwide, <u>this district had:</u> "
  for (i = 0; i<3; i++){
    let ind_rank = profile[i].split("(")
    let ind = ind_rank[0].trim()
    let rank = parseInt(ind_rank[1].trim())

    if (i !== 2){
      acsString = acsString + `the <strong>${ordinal_suffix_of(rank)}</strong> ranking labor force in the ${ind} sector(s),`
    }
    else {
      acsString = acsString + ` and the <strong>${ordinal_suffix_of(rank)}</strong> ranking labor force in the ${ind} sector(s).`
    }
    
  }
  d3.select("#district-summary-title").text(district_titleString);
  d3.select("#district-summary-text").selectAll(".default-welcome-summary").remove();

	d3.selectAll(".district-autotexts").remove();

  d3.select("#district-summary-text").append("p")
    .attr("class","district-autotexts")
    .html(intro+districtString+awardsDescription);
  
  d3.select("#district-summary-text").append("p")
  .attr("class","district-autotexts")
  .html(acsString);
  
	//console.log("cd text summarY:",intro,districtString,awardsDescription,acsString)


}


function getCdVocab(district){
  // change state
  //state.lastCd = state.currentCd
  //state.currentCd = district
  // if the CD is different from teh one already loaded, go forward, if not nothing
  if (state.currentCd !== "99" && state.currentCd !== state.lastCd){
    fetch("data/cd116_vocab_aggs/"+district+".json").then(response => {
      if (!response.ok) {
        //console.log(response);
        state.currentCdVocab = [];
        // remove any existing pills
        d3.selectAll('.pill-container').remove();
        showCdVocab(state.currentCdVocab);
        throw new Error("unable to fetch");
      }
      return response.json();
    }).then(data => {
	//console.log("LOADED FILE","data/cd116_vocab_aggs/"+district+".json")
      state.currentCdVocab = data;
      showCdVocab(state.currentCdVocab)

    })


    /*
      // get the full vocab file and put it in state
      d3.json("data/cd116_vocab_aggs/"+district+".json").then(function(data){
        state.currentCdVocab = data;
        
  
      });
      // pass the vocab to the show function, where it's filtered properly by the state params
      showCdVocab(state.currentCdVocab)
      //console.log("CD VOCAB",state.currentCdVocab)
      */
  }
  else {
	//console.log("we got to the false condition for no rasno?")
  }

};


function showCdVocab(data){



  // if we're not on the info tab...
  if (state.selectedVocab !== "vocabsInfo"){
      // FILTER THE DATA BY YEARS AND AGENCIES....
    var ag = Object.keys(data).filter( d => state.selectedAgencies.includes(d))
    //console.log("filt ag",ag)
    var allvocab = []
    // MARCH 11: update this to reflect state.selectedagencies
    for (i=0; i<ag.length; i++){
      // MARCH 11: update this to reflect state.selectedyears
      var yr = Object.keys(data[ag[i]]).filter( d => state.yearRange.includes(parseInt(d)) )

      //console.log('FILT YEAR',yr)
      for (j=0; j<yr.length; j++){
        if (state.selectedVocab === "All"){
          for (k=0; k<vocabs.length; k++){
            allvocab.push(data[ag[i]][yr[j]][vocabs[k]])
          }
        }
        else if (state.selectedVocab == "textrank-tfidf_keywords"){
          allvocab.push(data[ag[i]][yr[j]]['textrank'])
          allvocab.push(data[ag[i]][yr[j]]['tfidf_keywords'])
        }
        else { allvocab.push( data[ag[i]][yr[j]][state.selectedVocab]   )}
        //allvocab.push(data[ag[i]][yr[j]])
      }
    }
    allvocab = allvocab.filter(x => x !== undefined && String(Object.keys(x)[0]) !== "" && String(Object.keys(x)[0]).length > 2);
    
    allvocab = mergeVocabs(allvocab)

    //console.log("ALL VOCAB AG YEAR FILT",allvocab)
    var sortedVocab = [];
    for (var term in allvocab) {
      sortedVocab.push([term, allvocab[term]]);
    }

    sortedVocab.sort(function(a, b) {
        return b[1] - a[1];
    });

    state.filteredCdVocab = sortedVocab;

    // if there's no vocab for the Cd...
    if (state.filteredCdVocab.length === 0){
      d3.select(".vocab-info-text").remove();
      d3.selectAll('.pill-container').remove();
      d3.select('.no-data-vocab').remove();


      var vocabArea = d3.select("#vocab-pills").append("p").attr("class","no-data-vocab").text("There are no keywords from the selected vocabularies, or this district did not receive Federal SBIR/STTR grants in the selected years from the selected agencies. Select another vocabulary, or expand the criteria to learn more about this district.")
    }
    // otherwise, show the selected vocab
    else  {
        //console.log("SHOW CD VOCAB",data)
      // remove any existing pills
      d3.select(".vocab-info-text").remove();
      d3.selectAll('.pill-container').remove();
      d3.select('.no-data-vocab').remove();

      // close any open popovers
      $(document).ready(function(){
        $(".vocab-popover").popover();
      
        $(document).on('click', function(){
            $(".vocab-popover").popover('hide');
        });
      
        $('.vocab-popover').click(function(){
            return false;
        });
      });
      //console.log("CD VOCAB",state.currentCdVocab)

      // draw the term badges
      var vocabArea = d3.select("#vocab-pills")
        .selectAll("pill-container")
        .data(state.filteredCdVocab)
        .join(
          enter => enter.append("div")
            .attr("class","pill-container")
            .attr("id",state.currentCd+"_vocab")
            .attr("data-bs-toggle","popover")
            .attr("data-bs-placement","top")
            .attr("data-bs-html","true")
            .attr("data-bs-custom-class","vocab-popover")
            .attr("data-bs-container","#vocab-pills")
            // add this function to all popover axis-remove text
            .attr("data-bs-content",  (d,i)=> "In X grants in district,</br>Y nationally")
            // this adds the content, on click of content, remove axis
            .attr("data-bs-trigger","click")
            /*.on("mouseenter", function() {
              var _this = this;
              setTimeout(function() {
                $(_this).popover('show');
                }, 150);
                $('.pill-container').not(this).popover('hide');
              })
              .on("mouseleave", function() {
              var _this = this;
              setTimeout(function() {
                if (!$(".vocab-popover:hover").length) {
                  $(_this).popover("hide");
                  }
                }, 0);
              })*/
              .html(function(d){
                var pillButton = `<button type="button" class="btn rounded-pill btn-primary btn-sm"`+
                ` id="term-badge">`+
                // add one to the term freq count, as some of the underly counts were extracted but then not re- counted quite right...
                `${d[0].replaceAll("_"," ").replaceAll(" abbr","")} <span class="badge bg-secondary">${d[1]+1}</span></button>`
                return pillButton;
              })
            .call(enter => enter.transition()
                  ),
          update => update
          .attr("class","pill-container")
          .attr("id",state.currentCd+"_vocab")
          // add this function to all popover axis-remove text
          .attr("data-bs-toggle","popover")
          .attr("data-bs-placement","top")
          .attr("data-bs-html","true")
          .attr("data-bs-custom-class","vocab-popover")
          .attr("data-bs-container","#vocab-pills")
          // add this function to all popover axis-remove text
          .attr("data-bs-content",  (d,i)=> "In X grants in district,</br>Y nationally")
          // this adds the content, on click of content, remove axis
          .attr("data-bs-trigger","click")
          /*.on("mouseenter", function() {
            var _this = this;
            setTimeout(function() {
              $(_this).popover('show');
              }, 150);
              $('.pill-container').not(this).popover('hide');
            })
            .on("mouseleave", function() {
            var _this = this;
            setTimeout(function() {
              if (!$(".vocab-popover:hover").length) {
                $(_this).popover("hide");
                }
              }, 0);
            })*/
            // this adds the content, on click of content, remove axis
            .html(function(d){
              var pillButton = '<button type="button" class="btn rounded-pill btn-primary btn-sm"'+
              ' id="term-badge">'+
              `${d[0].replaceAll("_"," ")} <span class="badge bg-secondary">${d[1]}</span></button>`
              return pillButton;
            })
            .call(update => update.transition()
            )
        );

      /*var popover = new bootstrap.Popover(document.querySelector(".pill-container"),{
        container: '#vocab-pills',
      });*/
    }
    
   




  }
  // if we ARE on the info tab...
  else {
      d3.selectAll('.pill-container').remove();
      d3.select('.no-data-vocab').remove();
      d3.select(".vocab-info-text").remove();


      var vocabInfoText = d3.select("#vocab-pills")
        .append("div")
        .attr("class","container vocab-info-text")
        .html('<div class="row"><div class="col-12"><p class="vocab-info-intro">Research topics and keywords were extracted using the following external controlled vocabularies and extraction methods:</p></div></div><div class="row vocab-info-row vocab-top-entry"><div class="col-3 vocab-name"><p>GEMET</p></div><div class="col-9 vocab-source"><a href="https://www.eionet.europa.eu/gemet/en/themes/" target="_blank" rel="noopener noreferrer">European Environment Agency General Multilingual Environmental Thesaurus</a><p>Environmental issue classifications from the European Commission.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>EIGE</p></div><div class="col-9 vocab-source"><a href="https://eige.europa.eu/thesaurus/overview" target="_blank" rel="noopener noreferrer">European Institute for Gender Equality (EIGE) Glossary & Thesaurus</a><p>Gender equality thesaurus from the European Commission.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>AGROVOC</p></div><div class="col-9 vocab-source"><a href="http://www.fao.org/agrovoc/" target="_blank" rel="noopener noreferrer">Food and Agriculture Organization of the United Nations - AGROVOC Thesaurus</a><p>Food systems and agricutltural classifications from the United Nations.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>STW</p></div><div class="col-9 vocab-source"><a href="http://zbw.eu/stw" target="_blank" rel="noopener noreferrer">STW Thesaurus of Economics</a><p>Standardized subject headings and individual keywords in various areas of economics, geography, society and politics from the Leibniz Information Centre for Economics.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>EU-SCIVOC</p></div><div class="col-9 vocab-source"><a href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/euroscivoc" target="_blank" rel="noopener noreferrer">European Science Vocabulary (EuroSciVoc)</a><p>Science related classifications from the European Commission.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>EUVOC</p></div><div class="col-9 vocab-source"><a href="https://op.europa.eu/en/web/eu-vocabularies/dataset/-/resource?uri=http://publications.europa.eu/resource/dataset/eurovoc" target="_blank" rel="noopener noreferrer">EUROVOC Thesaurus of Activities related to the EU</a><p>Governmental, social, political, legal and economic classifications from the European Commission.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>MeSH</p></div><div class="col-9 vocab-source"><a href="https://www.nlm.nih.gov/mesh/meshhome.html" target="_blank" rel="noopener noreferrer">National Library of Medicine Medical Subject Headings</a><p>The Medical Subject Headings (MeSH) thesaurus is a controlled and hierarchically-organized vocabulary produced by the National Library of Medicine. It is used for indexing, cataloging, and searching of biomedical and health-related information.</p></div></div><div class="row vocab-info-row"><div class="col-3 vocab-name"><p>Extracted Keywords</p></div><div class="col-9 vocab-source"><p>Emergent vocabulary extracted from grant abstracts and titles using TF-IDF and Textrank methods.</p></div></div>')
  }
    
   


};

// this function gets content from the map, 
// and is modified to take an id and return the marker corresponding to it

function getFeaturesInView(map) {
  var features = [];
  map.eachLayer( function(layer) {
    if(layer instanceof L.Marker) {
      features.push(layer)
    }
    if (Object.keys(layer).includes("_childClusters")){
      var markers = layer.getAllChildMarkers();
      for (i=0; i<markers.length; i++) {
        features.push(markers[i])
      }
    };
      
  });
  return features;
};

// this function populates the funder recipient bar graph/stats tabs
function showCdGraph(fundSummary,countSummary) {


  $(".bargraph-svg").remove();
  $(".recips-table").remove();
  $(".agency-bar-legend").remove();
  $(".no-data-graph").remove();
  $("#grants-graph-container").remove();

  // if we're at the start of the app...
  if (fundSummary === "99") {
    // put intro text in the panel to start
  }
  // else, if there is data in the summary... 
  else if (Object.keys(fundSummary).length > 0){

    // bar graph for agency funding
    if (state.selectedGraph === "agency-graph") {


      var width = parseInt($('#bargraph').css('width')),
      height = parseInt($('#bargraph').css('height')),
      paddingInner = 0.2,
      margin = { right: 40, left: 55, 
        top: 30, bottom: 25 };
  
      // Horizontal Bars
      var series = d3.stack()
      .keys(["sbir","sttr"])
      (fundSummary)
        .map(d => (d.forEach(v => v.key = d.key), d))
  
      //console.log("SERIES",series)
  
      // x scale is for total funding amts
      var x = d3.scaleLinear()
      .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
      .rangeRound([margin.left, width - margin.right])
  
      // y scale is for agencies
      var y = d3.scaleBand()
      .domain(fundSummary.map(d => d.Agency))
      .range([height - margin.bottom, margin.top])
      .padding(paddingInner)
  
  
      var formatValue = y => isNaN(y) ? "N/A" : y.toLocaleString("en")
      // funding format string
      function formatTick(d) {
        const s = (d / 1e6).toFixed(1);
        return this.parentNode.nextSibling ? `\xa0$${s}` : `$${s} million`;
      }
  
      // draw axis ticks the height of the graph
      var xAxis = g => g
      .attr("transform", `translate(0,${height-margin.bottom})`)
      .call(d3.axisTop(x)
              .tickSize(height-margin.top-margin.bottom)
              .tickFormat(formatTick)
              .ticks(4))
          .call(g => g.select(".domain")
              .remove())
          .call(g => g.selectAll(".tick:not(:first-of-type) line")
              .attr("stroke-opacity", 0.5)
              .attr("stroke-dasharray", "2,2"))
          .call(g => g.selectAll(".tick text")
              .attr("x", 0)
              .attr("dy", -4))
      .call(g => g.selectAll(".domain").remove())
  
      // vertical axis anchros left, 
      var yAxis = g => g
      .attr("transform", `translate(${margin.left-4},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0).tickSize(4))
      .call(g => g.selectAll(".domain").remove())
      .call(g => g.selectAll(".tick line").remove())
  
      // create the svg
      var svg = d3.select("#bargraph")
      .append("svg")
      .attr("class","bargraph-svg")
      .attr("width", width)
      .attr("height", height);
  
  
      svg.append("g")
          .call(xAxis)
            .selectAll(".tick text")
            .attr("class","bar-x-ticks")
            //.attr("transform",`translate(0,${margin.top})`)
            
            
  
      svg.append("g")
          .call(yAxis)
          .selectAll(".tick text")
          .attr("class","bar-y-ticks")
          .call(wrap, margin.left);
          
        
      svg.append("g")
          .selectAll("g")
          .data(series)
          .join("g")
            .attr("fill", function(d){
              return d.key == "sttr" ? sttr_color : sbir_color;
            })
          .selectAll("rect")
          .data(d => d)
          .join("rect")
            .attr("class","bargraph-rect")
            .attr("y", (d, i) => y(d.data.Agency))
            .attr("x", d => x(d[0]))
            .attr("width", d => x(d[1]) - x(d[0]))
            .attr("height", y.bandwidth())
          .append("title")
            .text(d => `${d.data.Agency}, ${String(d.key).toUpperCase()} Funding (${state.yearRange[0]}-${state.yearRange[state.yearRange.length - 1]}):
            $${formatValue(d.data[d.key])}`);
  
      // add the legend if we've already selected a CD
      if (state.currentCd != null || Object.keys(series).length > 0) {
        var legend = svg.append("g")
        .attr("class","agency-bar-legend")
  
        legend
            .append("rect")
            .attr("class","bargraph-legend-rect")
            .attr("transform",`translate(${width-margin.right*3},${height-margin.bottom})`)
            .attr("height",margin.left/4)
            .attr("width",margin.left/4)
            .attr("fill",sbir_color)
  
        legend
            .append("rect")
            .attr("class","bargraph-legend-rect")
            .attr("transform",`translate(${width-margin.right*3},${height-margin.bottom- margin.left/3})`)
            .attr("height",margin.left/4)
            .attr("width",margin.left/4)
            .attr("fill",sttr_color)
            
  
        legend
            .append("text")
            .attr("class","agency-bar-legend-label")
            .attr("transform",`translate(${ (width-margin.right*3) + 20},${height-margin.left/4})`)
            .text("SBIR Grants")
            .attr("font-size","0.8em")
            
  
          legend
            .append("text")
            .attr("class","agency-bar-legend-label")
            .attr("transform",`translate(${ (width-margin.right*3) + 20},${height-(margin.left*7/12)})`)
            .text("STTR Grants")
            .attr("font-size","0.8em")
  
      }
  
      
  
          
        // Vertical Bars
      /*
      var series = d3.stack()
      .keys(["sbir","sttr"])
      (fundSummary)
        .map(d => (d.forEach(v => v.key = d.key), d))
  
      console.log("SERIES",series)
  
      var y = d3.scaleLinear()
      .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
      .rangeRound([height - margin.bottom, margin.top])
    
  
      var x = d3.scaleBand()
      .domain(fundSummary.map(d => d.Agency))
      .range([margin.left, width - margin.right])
      .padding(0.5)
  
      var formatValue = x => isNaN(x) ? "N/A" : x.toLocaleString("en")
      function formatTick(d) {
        const s = (d / 1e6).toFixed(1);
        return this.parentNode.nextSibling ? `\xa0${s}` : `$${s} million`;
      }
  
      var yAxis = g => g
        .attr("transform", `translate(2.5,0)`)
        .call(d3.axisRight(y)
                .tickSize(width-7.5)
                .tickFormat(formatTick)
                .ticks(6))
            .call(g => g.select(".domain")
                .remove())
            .call(g => g.selectAll(".tick:not(:first-of-type) line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
                .attr("x", 4)
                .attr("dy", -4))
        .call(g => g.selectAll(".domain").remove())
  
      var xAxis = g => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .call(g => g.selectAll(".domain").remove())
  
  
  
  
      var svg = d3.select("#bargraph")
          .append("svg")
          .attr("class","bargraph-svg")
          .attr("width", width)
          .attr("height", height);
  
      svg.append("g")
          .call(xAxis)
            .selectAll(".tick text")
            .attr("class","bar-ticks")
            .call(wrap, x.bandwidth()/2);
            
      svg.selectAll(".bar-ticks")
          .call(wrap, x.bandwidth()/2);
  
      svg.append("g")
          .call(yAxis);
        
  
      svg.append("g")
          .selectAll("g")
          .data(series)
          .join("g")
            .attr("fill", function(d){
              return d.key == "sttr" ? "blue" : "black";
            })
          .selectAll("rect")
          .data(d => d)
          .join("rect")
            .attr("x", (d, i) => x(d.data.Agency))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
          .append("title")
            .text(d => `${d.data.Agency} ${d.key}
                ${formatValue(d.data[d.key])}`);
  
      */
    }
    // table of recipients
    else if (state.selectedGraph === "recips-graph"){
     
      // so that rows can find the popups, we need to use the id
      //  as an attribute to the row
      // on row hover, we'll be able to open up the marker popup for that row
     
  
      function tableFundFormat(d) {
        const s = (d / 1e6).toFixed(2);
        return `$${s}` 
      }
  
      var table = d3.select('#bargraph')
        .append("table")
        .attr("class","table table-hover table-striped recips-table")
  
      table
        .append('thead')
        .attr("class","table-dark")
        .append('tr')
          .selectAll('th')
          // Table column headers (here constant, but could be made dynamic)
          .data(['Company', 'Grants Received', 'Funding ($M)'])
        .enter().append('th')
          .attr("class","recips-table-header")
          .text(d => d);
  
  
      var tablebody = table.append("tbody");
      var rows = tablebody
                  .selectAll("tr")
                  .data(fundSummary)
                  .enter()
                  .append("tr")
                  .attr("id",d=>d.row_id+"|"+d.lat+"|"+d.lng)
                  // on row click, we'll go there in the map and generate the popup
                  .on("click",function(e){
                    var id = e.target.parentElement.id
                    var recip_id = id.split("|")[0]
                    //console.log("e target parent element",e.target.parentElement)
                    var zoom = mymap.getZoom() > maxZoomLevel ? mymap.getZoom() : maxZoomLevel;
                    var recip_lat = id.split("|")[1]
                    var recip_lng = id.split("|")[2]
                    mymap.setView([recip_lat,recip_lng],zoom)
  
                    var features = getFeaturesInView(mymap);
                    //console.log("THIS IS YOUR MAP",mymap)
                    //var features = getMarkers(mymap);
                    var recip_marker = features.filter(d=>d._leaflet_id === recip_id);
                    //console.log("HOVER TABLE ROW",e.target.parentElement.id, "recip marker",recip_marker,features)
                    //recip_marker[i].openPopup();
                    //console.log("PARENT IS",recip_marker[0]._parent)
                    var marker = recip_marker[0]; 
                    var lat = marker._latlng.lat; // get the marker's coords to go there and zoom beyond the cluster spiderfy
                    var lng = marker._latlng.lng;
                    
  
                    mymap.setView([lat, lng], zoom);
  
                    if (recip_marker.length > 0) {
                      var popup = recip_marker[0].getPopup();
      
                      //var popup = L.popup({maxHeight: 150}).setContent(getMarkerAwards(e.target._leaflet_id));
                      popup.setContent(getMarkerAwards(recip_id));
                      //popup({maxHeight: 150})
                      popup.update()
                      recip_marker[0].openPopup();
                    }
                  });
  
      // We built the rows using the nested array - now each row has its own array.
      var cells = rows.selectAll("td")
              // each row has data associated; we get it and enter it for the cells.
                  .data(function(d) {
                      //console.log(d);
                      return [d.Company, d.count, d.total];
                  })
                  .attr("id",d=>d.Company)
                  .enter()
                  .append("td")
                  .html(function(d,i){ 
                    if(i == 0) {return toTitleCase(d.replaceAll("&amp;","&")).replaceAll(" Llc"," LLC").replaceAll(" llc"," LLC").replaceAll(" INC"," Inc.");   }
                    else if (i == 1) {return d;}
                    else {return tableFundFormat(d)                  };
                  });
                  
  
  
  
                  ///.text(function(d) {
                  //    return d;
                  //});
  
    }
    // grants indicators
    else if (state.selectedGraph === "grants-graph"){
        var indicators = d3.select("#bargraph")
          .append("div")
          .attr("class","container grants-graph")
          .attr("id","grants-graph-container")
          .data(fundSummary)

	//console.log("grants graph fund summ",fundSummary)

        function formatFund(d) {
          if (parseInt(d) > 1e6){
            var s = (parseInt(d) / 1e6).toFixed(1);
            return `$${s} M`;
          }
          else {
            var s = (parseInt(d) / 1e3).toFixed(1);
            return `$${s} K`;
          }
        };

        // 
        var first_row = indicators.append("div").attr("class","row justify-content-md-center grants-detail-row")
      
            first_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=>formatFund(d.total))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Total awarded, to</br><strong>"+String([...new Set(d.companies)].length)+" grantee(s)</strong> ")

            first_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=>formatFund(d3.median(d.award_amts)))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Median award, across</br><strong>"+String(d.award_amts.length)+" grants</strong>")

        var second_row = indicators.append("div").attr("class","row justify-content-md-center grants-detail-row")

            second_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=>formatFund(d.phase_1))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Phase I funding</br><strong>"+String(d.phase_1_count)+" grants</strong>")

            second_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=>formatFund(d.phase_2))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Phase II funding</br><strong>"+String(d.phase_2_count)+" grants</strong>")
       
        var third_row = indicators.append("div").attr("class","row justify-content-md-center grants-detail-row")

            third_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=> d3.format(".0%")(d.women_owned/d.total))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Funding to companies <strong>owned by women</strong>")
              
            third_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=> d3.format(".0%")(d.socioecon/d.total))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Funding to companies owned by <strong>socially & economically disadvantaged</strong> groups<strong>")

        

        var final_row = indicators.append("div").attr("class","row justify-content-md-center grants-detail-row")

            final_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=> d3.format(".0%")(d.hubzone/d.total))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Funding to companies in <strong>hub-zones</strong>")

            final_row.append("div").attr("class","col-sm-5 grants-detail-col")
              .append("div").attr("class","row indicator-main-row")
              .append("p").attr("class","indicator-main-stat")
              .text(d=> d3.median(d.employees))
              .append("div").attr("class","row indicator-sub-row")
              .append("p").attr("class","indicator-sub-stat")
              .html(d=>"Median <strong>number of employees</strong> at grantee companies")






        //indicators
    };

  }
  // else show the no data message... 
  else {
    var graphArea = d3.select("#bargraph").append("p").attr("class","no-data-graph").text("This district does not appear to have received Federal SBIR/STTR grants in the selected years from the selected agencies. Select another district or expand the criteria to learn more about this district.")

  };
 
};

// return markers from map
function getMarkers(map) {
  var markerList = [];
  map._layers.forEach(function (layer) {
    if ((layer instanceof L.Marker) && (map.getBounds().contains(layer.getLatLng()))) {
      markerList.push(layer);
    };
  });

  
  return markerList;
};
// return the map districts
function getDistricts(map) {
  var layerList = [];
  map.eachLayer(function(layer){
    if (!(layer instanceof L.Marker)) {
      layerList.push(layer)
    };
  });

  return layerList;
};





// scale to window size
window.onresize = function() {
		

  // consider whether there should be a UI element to recommend and refresh full screen at the same position as the notice

  var panelWidth = parseInt($('#map-par-panel').css("width"));
  var panelHeight = parseInt($('#map-par-panel').css("height"));
  var panelPaddingTop = parseInt($('#map-par-panel').css("padding-top"));
  var panelPaddingBottom = parseInt($('#map-par-panel').css("padding-bottom"));
  var panelPaddingLeft = parseInt($('#map-par-panel').css("padding-left"));
  var panelPaddingRight = parseInt($('#map-par-panel').css("padding-right"));



  var pcHeight = (panelHeight) * 0.18
  var pcWidth = panelWidth - panelPaddingLeft - panelPaddingRight


  parcoords.width(pcWidth).height(pcHeight).render();
  parcoords.resize().autoscale()
  if(state.parcoordsState === "econ"){
    parcoords.commonScale();
  }

  draw();
  

};

/* Get the documentElement (<html>) to display the page in fullscreen */
var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
if (elem.requestFullscreen) {
  elem.requestFullscreen();
} else if (elem.webkitRequestFullscreen) { /* Safari */
  elem.webkitRequestFullscreen();
} else if (elem.msRequestFullscreen) { /* IE11 */
  elem.msRequestFullscreen();
}
};

/* Close fullscreen */
function closeFullscreen() {
if (document.exitFullscreen) {
  document.exitFullscreen();
} else if (document.webkitExitFullscreen) { /* Safari */
  document.webkitExitFullscreen();
} else if (document.msExitFullscreen) { /* IE11 */
  document.msExitFullscreen();
}
};


