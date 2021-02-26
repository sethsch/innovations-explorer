

//var svg = d3.select("#example").style("width","800px").style("height","320px");


/**
 * APPLICATION STATE
 * */
let state = {
  data: [],
  cols: [],
  usStates: [],
  selectedPlace: "All States",
  color: null,
  paletteInfoString: "",
  changedOpt: null,
  selectedRows: [],
  unselRows: []
};

let buffer = 2;
// dropdowns and filters
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
        pct_transport_util:           "TRNSP/UTIL",
        pct_information:             "INFO",	
        pct_finance_realest:          "FNC/REAL",	
        pct_prof_sci_mgmt_adm:        "SCI/MGMT",
        pct_edu_health:             "ED/HEALTH",	
        pct_arts_ent_food_rec:              "ARTS/ENT",	
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
  "TRNSP/UTIL": "Transportation, warehousing, and utilities",
  "INFO": "Information",
  "FNC/REAL": "Finance, insurance, real estate, rental and leasing",
  "SCI/MGMT": "Professional, scientific, management, waste mgmt. services",
  "ED/HEALTH": "Educational services, health care, social assistance",
  "ARTS/ENT": "Arts, entertainment, recreation, accommodation and food services",
  "OTHER": "Other services, except public administration",
  "PUBADMIN": "Public administration"}


dropDown = d3.select("#dropdown2")

var options = dropDown.selectAll("option")
      .data(Array.from(shortAttributeNames))
      .enter()
      .append("option");

options.text(function(d) {
        return d[1];
      })
      .attr("value", function(d) {
        return d[0];
      });


//let colorRange = ["brown", "#999", "#999", "steelblue"];
let colorRange = d3.schemeSpectral[4]
//let colorRange = d3.schemeRdYlBu[4];
// set the color scale function
// color scale for zscores
var zcolorscale = d3.scaleLinear()
  .domain([-2,-0.5,0.5,2])
  .range(colorRange)
  .interpolate(d3.interpolateLab);


/// setup the legend -- eventually this needs to be placed in a function,
/// when teh color changes, the ticks etc. also change

legArea = d3.select("#legend")
  .append("svg")
  //.attr("class","legArea")
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


var parcoords = ParCoords()("#example")
  .rate(20)
  .composite("darker-over")
  //.brushedColor("#000")
  .mode("queue") // progressive rendering
  //.height(d3.max([document.body.clientHeight-326, 220]))
  .margin({
    top: 40,
    left: 10,
    right: 50,
    bottom: 20,
  })
  .smoothness(0.13)
  .alphaOnBrushed(0.2)
  .alpha(0.5); // set bundling strength





// load csv file and create the chart
// TODO: load version with amount sums, or wire up lookups to grants data with GEOID
d3.csv('data/acs2018_industry_congdist.csv').then(function(data) {


  // slickgrid needs each data element to have an id
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
 



  // default color to start
  state.color = "INFO"


  // TO DO: create a dict which gets the summary stats for each sector to display on select/hover
  // default string when the palette has been selected
  state.paletteInfoString = `Current palette: % employed in <strong><strong> ${industryNames[state.color]} sector(s)</strong> OTHERSTUFFFF`;
  // set the initial tooltip text
  var tooltip = d3.select(".tooltip")
                      .html(state.paletteInfoString);
           
  


  parcoords
    .data(procData)
    .hideAxis(["id","GEOID","name","state","profile"])
    .render()
    // TO DO: let this parameter be user/customizable -- 
    .commonScale() // sometimes it's useful to put it in common, but othertimes its nicer to have more space on the axis
    .interactive()
    .reorderable()

    //.brushable()
    .bundlingStrength(0.6)
    .bundleDimension(state.color)
    .brushMode("1D-axes");


  change_color(state.color);

  


    

  // click label to activate coloring
  parcoords.svg.selectAll(".dimension")
    .on("click", change_color)
    .selectAll(".label")
    //.call(wrap, 16)
    .attr("transform","translate(0,-10) rotate(0)")

  // add hover over activity to labels, to show full label
  // ideally, labels will have abbreviations, and when hovered over the full
  // sector title will display in a tooltip.. maybe the answer is to make
  // the tooltip centered and statically positioned rather than floating,
  // this way the wrapping isn't an issue

  // consider shifting this so that on hover it shifts but on mouseout it reverts to the selected scale
  parcoords.svg.selectAll(".dimension .label")
    .on("mouseout", function () {
        tooltip
        .style("opacity",0)
        .html(state.paletteInfoString)
        .style('pointer-events', 'none')
        .transition()
        .style("opacity",1)
        .delay(0)
        .duration(100); 
    })
    .on("mouseover", function(d) {
      tooltip
        .style("opacity",1)
        .html(`<strong>${industryNames[d]} sector(s)</strong> OTHERSTUFFFFFF`) // this should be a call to a dictionary, the abbrev returns the full
        .transition()
        .duration(500)
        //.style("transform",`translate(${parentPos.x + 15}px,${parentPos.y - 20}px)`)
        ;
    });
    
    

  console.log("DATA",procData.columns);
  // setting up grid
  // create data table, row hover highlighting






// load csv file and create the chart


  /* create data table, row hover highlighting
  var grid = d3.divgrid();

  grid.columns(data.columns);

  d3.select("#grid")
    .datum(data.slice(0,10))
    .call(grid)
    .selectAll(".row")
    .attr("class","row")
    .on({
      "mouseover": function(d) { 
        console.log("ROWHOV",this);
        parcoords.mark(data.filter(d=>d.name === "Beverage, instant breakfast powder, chocolate, not reconstituted")) },
      "mouseout": parcoords.unmark
    });

  // update data table on brush event
  parcoords.on("brush", function(d) {
    d3.select("#grid")
      .datum(d.slice(0,10))
      .call(grid)
      .selectAll(".row")
      .on({
        "mouseover": function(d) { parcoords.mark([d]) },
        "mouseout": parcoords.unmark
      });
  });*/






  /// TO DO: have the grid feature other data about the GEOID, like ranks



  var column_keys = procData.columns;
  var columns = column_keys.map(function(key,i) {
    return {
      id: key,
      name: key,
      field: key,
      sortable: true,
    }
  });

  var options = {
    enableCellNavigation: true,
    enableColumnReorder: false,
    //multiColumnSort: true,
    asyncEditorLoading: true,

  };

  var dataView = new Slick.Data.DataView({inlineFilters: true });
  var grid = new Slick.Grid("#grid", dataView, columns, options);
  grid.setSelectionModel(new Slick.RowSelectionModel());
  //var columnpicker = new Slick.Controls.ColumnPicker(columns, grid, options);

  var pager = new Slick.Controls.Pager(dataView, grid, $("#pager"));

  

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

  function percentCompleteSort(a, b) {
    return a["percentComplete"] - b["percentComplete"];
  };
  



  // column sorting
  var sortcol = "name";
  var sortdir = 1;
  var percentCompleteThreshold = 0;
  var searchString = "";

  function comparer(a, b) {
    var x = a[sortcol], y = b[sortcol];
    return (x == y ? 0 : (x > y ? 1 : -1));
  };

  
  
  // Define function used to get the data and sort it.
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

  // highlight row in chart
  grid.onMouseEnter.subscribe(function(e,args) {
    // Get row number from grid
    var grid_row = grid.getCellFromEvent(e).row;

    // Get the id of the item referenced in grid_row
    var item_id = grid.getDataItem(grid_row).id;
    var d = parcoords.brushed() || procData;

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

    grid.onAddNewRow.subscribe(function (e, args) {
      //var item = {"num": data.length, "id": "new_" + (Math.round(Math.random() * 10000)), "title": "New task", "duration": "1 day", "percentComplete": 0, "start": "01/01/2009", "finish": "01/01/2009", "effortDriven": false};
      $.extend(item, args.item);
      dataView.addItem(item);
      
    });



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
  
  /*/// this is about what needs to happen for the text filter to 
  /// match the parcoords lines and filter the others out... what function should bes be embeded in or called from?
  let filtData = Array.from(dataView.getItems());
    let showData = Array.from(filtData.filter(d=>d.name.includes(searchString)))
    let exclData = Array.from(filtData.filter(d=>!d.name.includes(searchString)))
    //console.log("FILT",filtData)
    var d = parcoords.brushed() || data;
    
    showData.forEach(function(item) {
        parcoords.mark([d[item.id]])
    });
    exclData.forEach(function(item){
        parcoords.mark([d[item.id]])

    });
  
  */


  


  // wire up the search textbox to apply the filter to the model
  $("#txtSearch,#txtSearch2").keyup(function (e) {
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
    dataView.endUpdate()
    
   
    
    
  }; 
  function updateFilter() {
    dataView.setFilterArgs({
      percentCompleteThreshold: percentCompleteThreshold,
      searchString: searchString,
      sortcol: sortcol
    });
    dataView.refresh();

    showQueryPaths();


  };

  function preClear(searchString) {
    if (searchString.length < buffer) {
      //parcoords.unhighlight(data);
      parcoords.clear("highlight")
      
    }
  };

  function showQueryPaths () {
    // hmmmmm... is this where highlighting can ge tits values?
    state.selectedRows = dataView.getItems().filter(d=> searchString.length > buffer && d[sortcol].toLowerCase().includes(searchString));
    state.unselRows = dataView.getItems().filter(d=>!d[sortcol].toLowerCase().includes(searchString));

    //console.log( "Sel Size",state.selectedRows);
    parcoords.unhighlight(state.unselRows);
    parcoords.highlight(state.selectedRows);

  }

  // fill grid with data
  gridUpdate(procData);

  // update grid on brush
  parcoords.on("brush", function(d) {
    gridUpdate(d);
    
  });
    // if you don't want the items that are not visible (due to being filtered out
  // or being on a different page) to stay selected, pass 'false' to the second arg
  dataView.syncGridSelection(grid, false);

  


  


  

  

});





// update color
function change_color(dimension) {
  state.color = dimension;
  state.paletteInfoString = `Current palette: % employed in <strong>${industryNames[state.color]} sector(s)</strong> OTHERSTUFFFF`;

  //console.log("color Dim",state.color)
  parcoords.svg.selectAll(".dimension")
    .style("font-weight", "normal")
    .filter(function(d) { return d == dimension; })
    .style("font-weight", "bold")

    parcoords.color(zcolor(parcoords.data(),dimension)).render()
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
var mymap = L.map('mapid').setView([-1.746,1.281],4.05);

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
   attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    //id: 'sethsch/ckl1e8ryc0dqg17jykxnnwlls', //monochrome custom
    id: 'sethsch/ckl1fbohm0esb17my5gsrrwgs', //albers
    tileSize: 512, 
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoic2V0aHNjaCIsImEiOiJja2wxZTFhcWIxMXN4MnBueHdhZnlvOW5mIn0.FTNdrJfrl5rz17HFj-FMpg'
}).addTo(mymap);