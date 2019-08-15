$(document).ready(function() {

  // get identifier from url
  let params = new URLSearchParams(location.search);
  let identifier = params.get('identifier');

  // display form with alpaca.js
  displayForm(identifier, "impact.php");

  if(identifier != null){

    $('#result').css('display', 'block');

    // check the type of the identifier
    var identifierType = getIdentifierType(identifier);

    if (identifierType){

      // display work info if it is a doi and person info for an orcid
      switch (identifierType) {

        case "doi":
          displayWork(identifier);
          break;

        case "orcid":
          displayPerson(identifier);
          break;

        default:
          break;
      }
    }else{
      $('#result').text('Nope, try again.');
    }
  }
});


/*
* display data for the entity type person
* get data from impactstory and display results with ?
*
* @param identifier
*/
function displayPerson(identifier){

  $('#loading').text('Nice, an ORCID! Wait a second (or more) for the results ...');

  $.getJSON('./schemas/person.json', function(config){

    d3.json(config['api'] + identifier, function(json){

      console.log(json);

      // remove loading info and display title
      $("#loading").remove();
      $('#title').text(json._full_name);

        displayOverview(json, config['overview']);

    });

  });

}


/*
* display data for the entity type work
* get data from paperbuzz and display results with paperbuzzviz and chartjs
*
* @param identifier
*/
function displayWork(identifier){

  $('#loading').text('Ah yes, this seems to be a DOI. Wait a second (or more) for the results ...');

  $.getJSON('./schemas/work.json', function(config){

    // get data from paperbuzz
    d3.json(config['api'] + identifier, function(json){

      // remove loading info and display title
      $('#loading').remove();
      $('#title').attr('href', 'http://dx.doi.org/' + json.doi).text(json.metadata.title);

      // get info about referenced by count directly from json
      $('#referencedby').text('The publication has been referenced '+json['metadata']['is-referenced-by-count'] + ' times.');

      // display overview and detailed views
      displayOverview(json, config['overview']);
      displayPaperbuzzviz(convertForConcept(json, config['concepts']['scientific-impact']), scientificimpactviz);
      displayPaperbuzzviz(convertForConcept(json, config['concepts']['societal-impact']), societalimpactviz);
      displayPaperbuzzviz(convertForConcept(json, config['concepts']['community']), communityviz);
      displayOpenness(json);
    });
  });
}


/*
* check identifierType with regular expressions (possible values: doi and orcid)
*
* @param identifier
* @return identifierType
*/
function getIdentifierType(identifier){

  const doiPattern = /^10.\d{4,9}\/[-._;()\/:a-zA-Z0-9]+$/gm;
  const orcidPattern = /^\d{4}[-]\d{4}[-]\d{4}[-]\d{4}$/gm;

  if (doiPattern.exec(identifier)) {
    return "doi";
  }else if (orcidPattern.exec(identifier)) {
    return "orcid";
  }
}


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
                  "title": "Visualize!"
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
function displayOverview(data, concepts){

  display('overview'); // css stuff

  displayPaperbuzzviz(data, overviewviz, true);

  // create json structure for chartjs data
  var displayData = {}; datasets = []; labels = []; events = [];

  // get data from each source and convert data according to json structure needed for the chart js
  concepts.forEach(function(concept) {
    events.push(Math.floor((Math.random() * 10) + 5)); // random number TODO: get real data
    labels.push(concept);
  });

  datasets.push({data: events});
  displayData.datasets = datasets;
  displayData.labels = labels;

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
