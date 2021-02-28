

//var svg = d3.select("#example").style("width","800px").style("height","320px");

//const { initial } = require("underscore");


/**
 * APPLICATION STATE
 * */
let state = {
  data: [],
  procData: [],
  parData: [],
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


// default settings for grid
var sortcol = "name";
var sortdir = 1;
var percentCompleteThreshold = 0;
var searchString = "";


// color settings
let colorRange = d3.schemeSpectral[4]
  // color scale for zscores
let zcolorscale = d3.scaleLinear()
  .domain([-2,-0.5,0.5,2])
  .range(colorRange)
  .interpolate(d3.interpolateLab);

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
    )

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

  // PC INIT - set the state equal to the industryName keys minus the default hidden
  state.currentAxes = Object.keys(industryNames).filter( ( el ) => !state.defaultHiddenAxes.includes( el ) );

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




  // INIT - set up the base of parcoords and its settings
  parcoords = ParCoords()("#parcoords")
    .rate(20)
    .composite("darker-over")
    //.brushedColor("#000")
    .mode("queue") // progressive rendering
    //.height(d3.max([document.body.clientHeight-326, 220]))
    /*.margin({
      top: 10,
      left: 10,
      right: 50,
      bottom: 20,
    })*/
    .smoothness(0.13)
    .alphaOnBrushed(0.2)
    .alpha(0.5); // set bundling strength


  // TO DO: create a dict which gets the summary stats for each sector to display on select/hover
  // default string when the palette has been selected
  // set a default color -- THIS NEEDS TO GO IN THE INIT FUNCTION
  // 
  // state.color = state.defaultColor;  

           
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


  state.currentHiddenAxes = state.defaultHiddenAxes;
  state.color = state.defaultColor;
  
  state.paletteInfoString = `Current palette: % employed in <strong><strong> ${industryNames[state.color]} sector(s)</strong> OTHERSTUFFFF`;
  // set the initial info-bar text
  infobar = d3.select("#info-bar")
                      .html(state.paletteInfoString);
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
        .html(`<strong>${industryNames[d]} sector(s)</strong> OTHERSTUFFFFFF`) // this should be a call to a dictionary, the abbrev returns the full
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



// update color
function change_color(dimension) {
  state.color = dimension;
  state.paletteInfoString = `Current palette: % employed in <strong>${industryNames[state.color]} sector(s)</strong> OTHERSTUFFFF`;

  //console.log("color Dim",state.color)
  parcoords.svg.selectAll(".dimension")
    .style("font-weight", "normal")
    .filter(function(d,i) { return state.currentAxes[i] == dimension; })
    .style("font-weight", "bold")

    parcoords.color(zcolor(parcoords.data(),dimension)).render();
}

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



// monochrome set view: [39.425,-94.796], 3.68
// albers USA set view: [-1.746,1.281],4.05
var mymap = L.map('map').setView([39.425,-94.796], 3.5);

var Stamen_TonerLite = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 3,
	maxZoom: 13,
	ext: 'png'
});

Stamen_TonerLite.addTo(mymap);

// to add albers USA tiles from personal API:
/*L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
   attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    //id: 'sethsch/ckl1e8ryc0dqg17jykxnnwlls', //monochrome custom
    id: 'sethsch/ckl1fbohm0esb17my5gsrrwgs', //albers
    tileSize: 512, 
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic2V0aHNjaCIsImEiOiJja2wxZTFhcWIxMXN4MnBueHdhZnlvOW5mIn0.FTNdrJfrl5rz17HFj-FMpg'
}).addTo(mymap);*/