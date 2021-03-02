

//var svg = d3.select("#example").style("width","800px").style("height","320px");

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
  data: [],
  procData: [],
  parData: [],
  recipsData: [],
  industData: [],
  industStats: [],
  currentChloroLayer: null,
  cols: [],
  usStates: [],
  selectedPlace: "All States",
  defaultHiddenAxes: ["id","GEOID","name","state","profile"],
  hiddenAxes: ["id","GEOID","name","state","profile"],
  currentAxes: [],
  defaultColor: "AGRIC",
  color: null,
  paletteInfoString: "",
  changedOpt: null,
  selectedRows: [],
  unselRows: []
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
'pct_agro': {'mean': 0.019107477743707094, 'stdev': 0.02492691803944095},
'pct_arts_ent_food_rec': {'mean': 0.09709313590846688, 'stdev': 0.02478666254994243},
'pct_construct': {'mean': 0.06493889406407324, 'stdev': 0.016741604324190498},
'pct_edu_health': {'mean': 0.2320128615789473, 'stdev': 0.03328312551876628},
'pct_finance_realest': {'mean': 0.06422619412128149, 'stdev': 0.02076702867483482},
'pct_information': {'mean': 0.02015461168649883, 'stdev': 0.010306822824995704},
'pct_manufact': {'mean': 0.10252189041876426, 'stdev': 0.04727747231385272},
'pct_otherserv': {'mean': 0.048906455414187616, 'stdev': 0.006403847620039182},
'pct_prof_sci_mgmt_adm': {'mean': 0.11167448162929057, 'stdev': 0.03646271361236327},
'pct_public_admin': {'mean': 0.04688159643249426, 'stdev': 0.02111663008647217},
'pct_retail': {'mean': 0.11359310667276894, 'stdev': 0.013279286235067538},
'pct_transport_util': {'mean': 0.052658708295194444, 'stdev': 0.014976210224363492},
'pct_wholesale': {'mean': 0.026230585965675055, 'stdev': 0.006339945705734841}
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
  .range(d3.schemeSpectral[7].reverse());

function getColor(d) {
    var val = d;
    return val > 20  ? '#2B83BA' :
           val > 10  ? '#ABDDA4' :
           val > 0   ? '#FFFFBF' :
           val > -10  ? '#FDAE61' :
           val > -20   ? '#D7191C' :
           'blue'
};
// For the text search, set a buffer before the filtering starts to operate -- num of chars
let buffer = 2;


// For parcoords, we need lists of variable names; as in the data abbrevs and spelled out for the UI
var attributes = ["GEOID","distr_name","us_state","ind_profile","pct_agro",	"pct_construct",	"pct_manufact",
      "pct_wholesale",	"pct_retail",	"pct_transport_util",
      "pct_information",	"pct_finance_realest",	"pct_prof_sci_mgmt_adm",
      "pct_edu_health",	"pct_arts_ent_food_rec",	"pct_otherserv",
      "pct_public_admin"]

var shortAttributeNames = new Map(
      Object.entries({
        GEOID: "GEOID",
        distr_name: "name",
        us_state: "state",
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







// INIT - DATA LOAD
// TODO: load version with amount sums, or wire up lookups to grants data with GEOID
d3.csv('data/acs2018_industry_congdist.csv').then(function(data) {

  // INIT - Process the data, select only the variables from it we need 
  // Note: slickgrid needs each data element to have an 'id'
  data.forEach(function(d,i) { d.id = d.id || i; });
  console.log("DATA AT FIRST LOAD",data)
  var procData = [];
      procData.columns = [Array.from(shortAttributeNames.values())].flat()
      data.forEach(function(district) {
            let distData = {};
            attributes.forEach(function(industry) {
                  distData["id"] = +district["id"]
                  distData[shortAttributeNames.get(industry)] = +district[industry]
                  distData[shortAttributeNames.get('distr_name')] = district["distr_name"]
                  distData[shortAttributeNames.get('ind_profile')] = district["ind_profile"]
                  //console.log(typeof district[industry])
                  distData['GEOID'] = district["GEOID"]
                  distData[shortAttributeNames.get("us_state")] = district["us_state"]

            });
           // console.log(distData);
           procData.push( distData );
      })
      console.log("FILT",procData);
      state.procData = procData;
 

  init();



});


function init() {

  

  /// INIT - set up the color legend
  /// 
  var legArea = d3.select("#legend")
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

  console.log("ZCOLORSCALE",legend)


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
  
  // setup infobar
  state.paletteInfoString = `<strong>Current sector(s):</strong> ${industryNames[state.defaultColor]}</br>${get_infobar_stats(state.defaultColor)}`
  // set the initial info-bar text
  infobar = d3.select("#info-bar")
                      .html(state.paletteInfoString);

  /// INIT FOR PARCOORDS
  initParcoords();


  // setting up grid
  /// TO DO: have the grid feature other data about the GEOID, like ranks
  // INIT - Slick Grid columns
  var column_keys = state.procData.columns;
  var columns = column_keys.map(function(key,i) {
    return {
      id: key,
      name: key,
      field: key,
      sortable: true,
    }
  });
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

  // Now call the draw function(s) to get going...
  draw();


};


function draw() {
 
  // Initial draw of parcoords
  parcoords
    .data(state.procData)
    //.dimensions(state.currentAxes) // using state variable to hide axes dynamically when needed
    .hideAxis(state.defaultHiddenAxes)
    .render()
    // TO DO: let this parameter be user/customizable -- 
    .commonScale() // sometimes it's useful to put it in common, but othertimes its nicer to have more space on the axis
    .interactive()
    .reorderable() // if this is on, need to figure out how to make the state keep track of order, so that removal popover works right
    //.brushable()
    .bundleDimension(state.color) // bundle the parcoords on the color dimension
    .bundlingStrength(0.6)
    .brushMode("1D-axes");


  console.log("PARCOORDS DATA",parcoords.data())  
  


  // DRAW - Add label interactivity: click label to activate coloring
  parcoords.svg.selectAll(".dimension")
    .on("click", change_color)
    .selectAll(".label")
    .attr("class","label")
    .attr("transform","translate(0,-10) rotate(0)")

  // DRAW - establish popovers
  var popover = new bootstrap.Popover(document.querySelector('.label'), {
      container: 'body',

      
      //trigger: 'manual'
    })
    
  // DRAW - set up popovers on labels
  parcoords.svg.selectAll(".label")
    .attr("axis-id",(d,i)=>state.currentAxes[i])
    .attr("data-bs-container",'body') // add the popover menu from bootstrap, to allow hiding
    .attr("data-bs-toggle","popover")
    .attr("data-bs-placement","top")
    .attr("data-bs-html","true")
    // add this function to all popover axis-remove text
    .attr("data-bs-content",  (d,i)=> `<div class="axis-remove" data-bs-dismiss="alert" id="${state.currentAxes[i]}">&times;</div>`
    ) // this adds the content, on click of content, remove axis
    .attr("data-bs-trigger",'manual')
    // on right click = context menu 
    /*.on("mouseenter", function (d) {
      $(this).popover('show');
      
      event.preventDefault();

      // add hide settings after some msec
      var pop = $(this).popover();
      pop.on('shown.bs.popover',function(){ 
        setTimeout(function(){
          pop.popover("hide")},1500); 
      });
    });*/
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
        console.log("ooh you clicked the popup for",this);
        updateHides(this.id);

    });
  });



  // add hover over activity to labels, to show full label
  // ideally, labels will have abbreviations, and when hovered over the full
  // sector title will display in a tooltip.. maybe the answer is to make
  // the tooltip centered and statically positioned rather than floating,
  // this way the wrapping isn't an issue

  // DRAW - on label hover, change the info bar to display full axis info, revert to current palette on mouseleave
  parcoords.svg.selectAll(".dimension .label")
    .on("mouseout", function () {
        infobar
        .style("opacity",0)
        .html(state.paletteInfoString)
        .style('pointer-events', 'none')
        .transition()
        .style("opacity",1)
        .delay(300)
        .duration(450); 
    })
    .on("mouseover", function(d) {
      infobar
        .style("opacity",0)
        .html(`<strong>${industryNames[d]}</strong></br>${get_infobar_stats(d)}`) // this should be a call to a dictionary, the abbrev returns the full
        .transition()
        .style("opacity",1)
        .delay(300)
        .duration(300)
        //.style("transform",`translate(${parentPos.x + 15}px,${parentPos.y - 20}px)`)
        ;
    });
    
  
  // set up listener for the axis hides
  // parcoords.hideAxis(state.hiddenAxes).updateAxes();
  // Initial coloration of parcoords
  change_color("AGRIC");    
  console.log("DATA",state.procData.columns);




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

    // Get the element position of the id in the data object
    elementPos = d.map(function(x) {return x.id; }).indexOf(item_id);

    // Highlight that element in the parallel coordinates graph
    parcoords.highlight([d[elementPos]]);
  });
  grid.onMouseLeave.subscribe(function(e,args) {
    parcoords.unhighlight();
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

  // DRAW - fill grid with data
  gridUpdate(state.procData);

  // DRAW - update grid on brush
  // TO DO -- add function for updating map too
  parcoords.on("brush", function(d) {
    gridUpdate(d);
    
  });
    // if you don't want the items that are not visible (due to being filtered out
  // or being on a different page) to stay selected, pass 'false' to the second arg
  dataView.syncGridSelection(grid, false);


};
//// END MAIN DRAW FUNCTION





function updateHides(d){
  state.hiddenAxes.push(d);
  state.hiddenAxes = [... new Set(state.hiddenAxes)]

  var justHidden = state.currentAxes.indexOf(d);
  //console.log("just hidden index for",d," is ",justHidden," while the current axis list was",state.currentAxes);

  state.currentAxes = Object.keys(industryNames).filter( ( el ) => !state.hiddenAxes.includes( el ) );
  //console.log("HIDDEN ARE",state.hiddenAxes, "CURRENT ARE",state.currentAxes);

  // then update the ids for the new label order, so popovers work
  parcoords.svg.selectAll(".label")
  .attr("axis-id",(d,i)=>state.currentAxes[i])
  .attr("data-bs-content",  (d,i)=> `<div class="axis-remove" data-bs-dismiss="alert" id="${state.currentAxes[i]}">&times;</div>`
  );

  parcoords.svg.selectAll(".dimension")
  .attr("axis-id",(d,i)=>state.currentAxes[i]);

  //state.parData = state.procData
  //delete state.parData[d]
  // if that item was the color palette, pass the selection onto the first axis still available
  // and update the palette string
  if (state.color === d) {
    change_color(state.currentAxes[0]);
    state.color = state.currentAxes[0];
    parcoords.bundleDimension(state.color);
    //console.log("so we switched the bolding and color choice to",state.currentAxes[0]," from the list where axes are",state.currentAxes);


  };
  //console.log("BEFORE RESETTING DIM",parcoords.state);
  parcoords.dimensions(state.currentAxes);
  //console.log("AFTER TRYING DIMENSIONS UPDATE",parcoords.state);
  infobar.html(state.paletteInfoString);
  

};


// function to remove map layers
function clear_maplayer(layer) {
  mymap.removeLayer( layer );
}
function change_map_color(){
  // remove any old map layer 
  if (state.currentChloroLayer !== null) {
    mymap.removeLayer(state.currentChloroLayer);
    //console.log("I REMOVED THE MAP LAYER",state.currentChloroLayer)
  };
  // change map color
  var chloroLayer = L.geoJson(distr_data,{style: style});
  state.currentChloroLayer = chloroLayer;
  chloroLayer.addTo(mymap);
};


// update color
function change_color(dimension) {
  


  state.color = dimension;
  state.paletteInfoString = `<strong>Current sector(s):</strong> ${industryNames[state.color]}</br>${get_infobar_stats(state.color)}`

  //console.log("color Dim",state.color)
  parcoords.svg.selectAll(".dimension")
    .style("font-weight", "normal")
    .filter(function(d,i) { return state.currentAxes[i] == dimension; })
    .style("font-weight", "bold")

  parcoords.color(zcolor(parcoords.data(),dimension)).render();


  change_map_color();
 
  //console.log("NOW I RESET THE CHLOROLAYLER",state.currentChloroLayer)

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

function dimensionStats(col){
  var n = col.length;
  var mean = d3.mean(col);
  var sigma = d3.deviation(col);
  return [mean,sigma];
  
};



// FUNCTION - String filter for grid/parcoords search
function myFilter(item, args) {
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
  dataView.setFilter(myFilter);
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
    //parcoords.unhighlight(data);
    parcoords.clear("highlight")
    
  }
};

// FUNCTION -- highlight behavior for the parcoords when the text string is typed
// TO DO - this can be updated to include map highlighting as well
function showQueryPaths () {
  // hmmmmm... is this where highlighting can get its values?
  state.selectedRows = dataView.getItems().filter(d=> searchString.length > buffer && d[sortcol].toLowerCase().includes(searchString));
  state.unselRows = dataView.getItems().filter(d=>!d[sortcol].toLowerCase().includes(searchString));

  //console.log( "Sel Size",state.selectedRows);
  parcoords.unhighlight(state.unselRows);
  parcoords.highlight(state.selectedRows);

};

function wrap(text, width) {
  text.each(function() {
      var text = d3.select(this),
      words = text.text().split(/\s+/).reverse(),
      word,
      line = [],
      lineNumber = 0, //<-- 0!
      lineHeight = 1.2, // ems
      x = text.attr("x"), //<-- include the x!
      y = text.attr("y"),
      dy = text.attr("dy") ? text.attr("dy") : 0; //<-- null check
      tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
          }
      }
  });
}

function type(d) {
  d.value = +d.value;
  return d;
}

function initAwardsData(){
  d3.csv('data/cd116_sbirRecipients_epsg3857.csv').then(function(data) {

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
      rData["lat"] = parseInt(recipient['Latitude'])
      rData["long"] = parseInt(recipient["Longitude"])
      rData["distr_name"] = recipient["distr_name"]
      rData["City"] = recipient["City"]
      rData["County"] = recipient["County"]
      rData["State"] = recipient["State"]
      procData.push( rData );
      });

    //console.log("Processed recips",procData);
    state.recipsData = procData;
    addRecipsToMap(state.recipsData);
  })
};


function addRecipsToMap(d){
 
  var myIcon = L.icon({
    iconUrl: './node_modules/leaflet/dist/images/marker-icon.png',
    iconRetinaUrl: './node_modules/leaflet/dist/images/marker-icon.png',
    iconSize: [20, 20],
    iconAnchor: [9, 9],
    popupAnchor: [0, -14]
  });

  var markerClusters = L.markerClusterGroup();
 
  for ( var i = 0; i < d.length; ++i )
  {
    var popup = d[i].Company +
                '<br/>' + d[i].City 
  
    var m = L.marker( [d[i].lat, d[i].long], {icon: myIcon} )
                    .bindPopup( popup );
  
    markerClusters.addLayer( m );
  }
 
  mymap.addLayer( markerClusters );
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
    
    //console.log("dim stats",dimStats,parseFloat(data.features[i].properties[pctCols[j]]))
    //data.features[i].properties["norm_"+pctCols[j]] = (parseFloat(data.features[i].properties[pctCols[j]]) - dimStats[0]) / dimStats[1];

    state.industData = distr_data;

    industStats_global = state.industStats;
    change_map_color();
    console.log("INDUSTSTATS",state.industStats);
    //console.log("DIM STATS",dimensionStats(d3.map(state.industData.features,d=>d.properties['pct_agro'])));

    });

   
    
};

function style(feature) {

  var industries =  [ ...shortAttributeNames.values() ];
  var selectedVar = industries.indexOf(state.color);
  selectedVar = [...shortAttributeNames.keys()][selectedVar]
  var normVar = "norm_"+selectedVar;
  var clustVar = "LSAcl_."+selectedVar;

  //console.log("SELECTED VAR",selectedVar,"NORM VAR",normVar);
// do what you want to do with `data` here...
  return {
      fillColor: chloroScale(feature.properties[normVar]),
      weight: getBorderStyle(feature.properties[clustVar])[1],
      opacity: 0.7,
      color: getBorderStyle(feature.properties[clustVar])[0],
      dashArray: '1',
      fillOpacity: 0.7
  };
};
function RGBToHex(rgb) {
  // Choose correct separator
  let sep = rgb.indexOf(",") > -1 ? "," : " ";
  // Turn "rgb(r,g,b)" into [r,g,b]
  rgb = rgb.substr(4).split(")")[0].split(sep);

  let r = (+rgb[0]).toString(16),
      g = (+rgb[1]).toString(16),
      b = (+rgb[2]).toString(16);

  if (r.length == 1)
    r = "0" + r;
  if (g.length == 1)
    g = "0" + g;
  if (b.length == 1)
    b = "0" + b;

  return "#" + r + g + b;
};
function getBorderStyle(d){
  var val = parseInt(d)
  return val === 5 ?  ['darkslategray',1] :
          val === 2 ? ['blue',2] :
          ['red',2];

};
function get_infobar_stats(dimension){
  var industries =  [ ...shortAttributeNames.values() ];
  var selectedVar = industries.indexOf(dimension);
  selectedVar = [...shortAttributeNames.keys()][selectedVar];
  console.log("inputdimen",dimension,"infobarstatsset", selectedVar);
  
  // get stats from state
  var avg = industStats_global[selectedVar]['mean'];
  var dev =  industStats_global[selectedVar]['stdev'];
  var outString = `<strong>Sector Employment Avg.:</strong> ${Math.round(avg*100)}% </br><strong>Std. Deviation:</strong> ${Math.round(dev*100)}%`
  return outString;
};

function initParcoords(){
  // PC INIT - set the state equal to the industryName keys minus the default hidden
  state.currentAxes = Object.keys(industryNames).filter( ( el ) => !state.defaultHiddenAxes.includes( el ) );
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
    .alphaOnBrushed(0.2)
    .alpha(0.5); // set bundling strength


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
  state.currentHiddenAxes = state.defaultHiddenAxes;
  state.color = state.defaultColor;

};









// monochrome set view: [39.425,-94.796], 3.68
// albers USA set view: [-1.746,1.281],4.05








/*  // scale to window size
window.onresize = function() {
  
  var parentElement = document.getElementById('map-par-panel');

  var panelWidth = parseInt($('#map-par-panel').css("width"));
  var panelHeight = parseInt($('#map-par-panel').css("height"));
  var panelPaddingTop = parseInt($('#map-par-panel').css("padding-top"));
  var panelPaddingBottom = parseInt($('#map-par-panel').css("padding-bottom"));
  var panelPaddingLeft = parseInt($('#map-par-panel').css("padding-left"));
  var panelPaddingRight = parseInt($('#map-par-panel').css("padding-right"));

  console.log("PANELWIDTH",panelWidth)

  var pcHeight = panelHeight*0.16 - panelPaddingTop - panelPaddingBottom
  var pcWidth = panelWidth - panelPaddingLeft - panelPaddingRight


  var tableElement = document.getElementById('districts-table')
  $("#parcoords").remove();
  var newElement = document.createElement('div');
  newElement.class = "parcoords"
  newElement.id = "parcoords"
  parentElement.insertBefore(newElement, tableElement);
  initParcoords(pcHeight,pcWidth);

};*/