$(document).ready(function() {

  // get identifier from url
  let params = new URLSearchParams(location.search);
  let identifier = params.get('identifier');

  // display form with alpaca.js
  displayForm(identifier, "impact.php");

  // get data from paperbuzz and display results with paperbuzzviz and chartjs
  if(identifier != null){

    $('#result').css('display', 'block');

    // get data from paperbuzz
    d3.json('https://api.paperbuzz.org/v0/doi/' + identifier, function(json) {

      // remove loading info
      $("#loading").remove();

      // display title
      $('#title').attr('href', 'http://dx.doi.org/' + json.doi).text(json.metadata.title);

      $.getJSON('./config.json', function(config){

        // display overview and detailed views
        displayOverview(json);
        displayPaperbuzzviz(convertForConcept(json, config['scientific-impact']), scientificimpactviz);
        displayPaperbuzzviz(convertForConcept(json, config['societal-impact']), societalimpactviz);
        displayPaperbuzzviz(convertForConcept(json, config['community']), communityviz);
        displayOpenness(json);

      });

    });
  }
});


/*
* add query form with alpaca to the page
*
* @param identifier
* @param action
*/
function displayForm(identifier, action){

  if(identifier != null){
    action += "?identifier="+identifier;
  }

  $("#form").alpaca({
    "data": {
      "identifier": identifier
    },
    "schema": {
        "type":"object",
        "properties": {
            "identifier": {
                "type":"string",
                "title":"Identifier"
            }
        }
    },
    "options": {
        "form":{
            "attributes":{
                "action": action,
                "method":"post"
            },
            "buttons":{
                "submit":{
                  "title": "Magic!"
                }
            }
        }
      }
  });
}


/*
* convert the json to only contain the required sources
*
* @param json
* @param sources
*/
function convertForConcept(json, sources){

  var data = JSON.parse(JSON.stringify(json));
  var i = 0; // index

  for(var object of data.altmetrics_sources){
    var toss = true;

    for(var source of sources){
      if(object.source_id == source) toss = false;
    }
    if(toss){ delete data.altmetrics_sources[i];}

    i++;
  }

  return data;
}


/*
* display overview with chartjs
*
* @param data
*/
function displayOverview(data){

  display('overview');

  displayPaperbuzzviz(data, overviewviz, true);

  // read and convert data to chart js json syntax
  var sources = data.altmetrics_sources;
  var displayData = convertForChart(sources);

  // this creates the chartjs chart
  var myChart = new Chart($('#chartjs'), {
    data: displayData,
    type: 'polarArea'

  });
}

/*
* display data for the concept openness
*
* @param json
*/
function displayOpenness(json){

  if(json.open_access.is_oa){
    $("#opennessviz").append('<img src="img/open.svg">');
  }
}


/*
* adding visualisation with PaperbuzzViz
*
* @param data
* @param vizDiv div where the visualization will be displayed
* @param showMini display minimal or detailed view
*/
function displayPaperbuzzviz(data, vizDiv, showMini = false){
  var options = {
        minItemsToShowGraph: {
            minEventsForYearly: 1,
            minEventsForMonthly: 1,
            minEventsForDaily: 1,
            minYearsForYearly: 1,
            minMonthsForMonthly: 1,
            minDaysForDaily: 1 //first 30 days only
            },
        graphheight: 200,
        graphwidth:  500,
        showTitle: false,
        showMini: showMini,
        vizDiv: vizDiv
      }

  var paperbuzzviz = undefined;
  options.paperbuzzStatsJson = data;
  paperbuzzviz = new PaperbuzzViz(options);
  paperbuzzviz.initViz();
}


/*
* Helper functions
*/

// display the selected concept and hide all other
function display(concept){

  $('.concept').css('display', 'none');
  $('#'+concept).css('display', 'block');
}


// convert data according to json structure needed for the chart js
function convertForChart(sources){

  // create json structure for chartjs data
  var displayData = {}; datasets = []; labels = []; events = [];

  // get data from each source
  sources.forEach(function(source) {
    events.push(source.events_count);
    labels.push(source.source.display_name);
  });

  datasets.push({data: events});
  displayData.datasets = datasets;
  displayData.labels = labels;

  return displayData;
}
