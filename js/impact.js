$(document).ready(function() {

  // get identifier from url
  let params = new URLSearchParams(location.search);
  let identifier = params.get('identifier');

  // display form with alpaca.js
  var action = "impact.php";
  displayForm(identifier, action);

  // get data from paperbuzz and display results with paperbuzzviz and chartjs
  if(identifier != null){

    // get data from paperbuzz
    d3.json('https://api.paperbuzz.org/v0/doi/' + identifier, function(data) {

      // display title
      $('#title').attr('href', 'http://dx.doi.org/' + data.doi).text(data.metadata.title);

      $('#result').css('display', 'block');
      display('overview');

      // display oa status
      var message = "this is closed :(";
      if(data.open_access.is_oa){
        message = "this is open access, yay!";
      }
      $("#oa-status").append("p").text(message);

      // display overview with chartjs
      displayOverview(data);

      // display detailed view with paperbuzzviz
      displayPaperbuzzviz(data);

    });

  }

});


// display the selected concept and hide all other
function display(concept){

  $('.concept').css('display', 'none');
  $('#'+concept).css('display', 'block');

}


// query form with alpaca (identifier as data)
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


// display overview with chartjs
function displayOverview(data){

  // read and convert data to chart js json syntax
  var sources = data.altmetrics_sources;
  var displayData = convertForChart(sources);

  // this creates the chartjs chart
  var myChart = new Chart($('#chartjs'), {
    data: displayData,
    type: 'polarArea'

  });
}

// adding visualisation with PaperbuzzViz
function displayPaperbuzzviz(data){
  var options = {
        minItemsToShowGraph: {
            minEventsForYearly: 10,
            minEventsForMonthly: 10,
            minEventsForDaily: 10,
            minYearsForYearly: 6,
            minMonthsForMonthly: 6,
            minDaysForDaily: 6 //first 30 days only
            },
        graphheight: 200,
        graphwidth:  500,
        showTitle: false,
        showMini: false,
      }

  var paperbuzzviz = undefined;
  options.paperbuzzStatsJson = data;
  paperbuzzviz = new PaperbuzzViz(options);
  paperbuzzviz.initViz();
}
