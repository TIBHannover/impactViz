$(document).ready(function() {

  // get variables from url
  let params = new URLSearchParams(location.search);
  let identifier = params.get('identifier');

  // display search form with alpaca.js
  displaySearchForm(identifier);

  // do something with the identifier
  if(identifier != null){

    // display result
    $('#result').css('display', 'block');

    // check the type of the identifier
    var identifierType = getIdentifierType(identifier);

    if (identifierType){

      // result object
      results = new Object();
      results['scientific-impact'] = new Object();
      results['societal-impact'] = new Object();
      results['community'] = new Object();
      results['openness'] = new Object();

      // handle entity types
      switch (identifierType) {

        case "doi":
          displayEntityByIdentifier("work", identifier);
          break;

        case "orcid":
          displayEntityByIdentifier("person", identifier);
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
* get the data of this indicator for the entity defined by identifier
*
* @param indicatorId
* @param identifier
*/
async function callInterface(indicator, identifier, callback){

    // call interface to get data for this identifier
    $.getJSON(indicator.interface + identifier, function(json){

      // find the dataset we want
      $.each(indicator['key'], function(index, element){
        if(json) json = json[element];
      });

      // write data to html
      $('#'+indicator['concept']+"-results").append(
        '<div class="paperbuzz-source-row paperbuzz-compact" style="width: 400px"><div class="paperbuzz-source-heading">'+indicator['name']+': '+json+'</div></div>');

      callback(json);
    });
}


/*
* get indicator by id
*
* @param indicatorId
*/
function getIndicatorById(indicatorId, callback){

  // read metadata of this indicator from json
  $.getJSON('./indicators/data/data.json', function(indicators){

    $.each(indicators, function(index, indicator){

      if(indicatorId == indicator['id']){

        callback(indicator);

      }
    });
  });
}


/*
* get indicators for the entity defined by identifer
*
* @param indicatorIds
* @param identifier
* @returns indicators
*/
function getIndicators(indicatorIds, identifier, callback){

  // get single indicators
  $.each(indicatorIds, function(index, indicatorId){

    // get metadata of this indicator
    getIndicatorById(indicatorId, function(indicator){

      // call api
      callInterface(indicator, identifier, function(value){

        // store in array
        results[indicator.concept][indicator.name] = value;

        callback(results);

      });
    });
  });
}

/*
* display data for a entity type
* get data from paperbuzz and display results with paperbuzzviz and chartjs
*
* @param entity
* @param identifier
*/
function displayEntityByIdentifier(entity, identifier){

  // loading message
  $('#loading').text('Ah yes, this seems to be a '+entity+'. Please be patient while we are collecting the data. This may take a while.');

  // read schema from url (use entity name as default if not existing)
  let params = new URLSearchParams(location.search);
  let schemaFile = params.get('schema') || entity;

  // get schema for this entity type
  $.getJSON('./entities/'+schemaFile+'.json', function(schema){

    // get data from paperbuzz
    $.getJSON(schema['api'] + identifier, function(json){

      // remove loading info and display title
      $('#loading').remove();
      display('overview'); // css stuff
      displayCustomizeForm();

      // handle entities differently
      switch(entity){

        case 'person':
          $('#title').text(json._full_name);
          break;

        case 'work':
          // display title of the work
          $('#title').attr('href', json.metadata.URL).text(json.metadata.title);

          // display detailed views (paperbuzz data with paperbuzzviz)
          displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts']['scientific-impact'], 'scientific-impact'), scientificimpactviz);
          displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts']['societal-impact'], 'societal-impact'), societalimpactviz);
          displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts']['community'], 'community'), communityviz);

          break;
      }

      // get the indicators for this entity by identifier
      getIndicators(schema['indicators'], identifier, function(results){

        // display a visualisation for each concept at overview
        $.each(schema.concepts, function(concept){
          displayImpactByConcept(results, concept, schema['visualisation'][concept]);
        });
      });

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
function displaySearchForm(identifier){

  $("#form").alpaca({
    "data": identifier,
    "options": {
      "label": "Identifier",
      "form": {
        "buttons": {
          "view": {
            "label": "Visualize!",
            "click": function() {
             window.location.href = window.location.pathname + '?identifier=' + this.getValue();
            }
          }
        }
      }
    }
  });
}


/**
* display customize form
*/
function displayCustomizeForm(){

  let params = new URLSearchParams(location.search);
  let schema = params.get('schema') || "work";

  // TODO: read configurations from somewhere
  $("#customize").alpaca({
    "data": [schema],
    "schema": {
      "enum": ["work", "work-customized"],
      "required": true
    },
    "options": {
        "type": "select",
        "optionLabels": ["Default publication", "Customized publication"],
        "form": {
            "buttons": {
                "view": {
                    "label": "Customize!",
                    "click": function() {
                      let params = new URLSearchParams(location.search);
                      let identifier = params.get('identifier');
                      window.location.href = window.location.pathname + '?identifier='+ identifier + '&schema=' + this.getValue();
                    }
                }
            }
        }
    }
  });
}


/*
* display overview for a concept with chartjs
*
* @param data
* @param concept
*/
function displayImpactByConcept(data, concept, visualisation = 'pie'){

  var displayData = [];
  var labels = [];
  var label = "";

  // TODO: read from config
  switch (concept) {
    case 'scientific-impact':
      label = 'Citations (COCI)';
      displayData.push(+data[concept][label]);
      labels.push(label);
      label = 'Citations (Paperbuzz)';
      break;
    case 'societal-impact':
      label = 'twitter';
      displayData.push(+data[concept][label]);
      labels.push(label);
      label = 'wikipedia';
      break;
    case 'community':
      label = 'stackexchange';
      break;
    case 'openness':
      label = 'Open Access';
      break;
    default:
      label = "";
    }

    displayData.push(+data[concept][label]); // boolean to 0 / 1 with +
    labels.push(label);

    // store data for chart
    var datasets = {
      datasets: [{
          data: displayData,
          backgroundColor: ['rgba(247,70,74,0.8)']
      }],
      labels: labels
    };

    // hide legend
    var options = {
      legend: {
          display: false
      }
    }

    // create chart
    chart = new Chart($('#'+concept+'-overview'), {
      type: visualisation,
      data: datasets,
      options: options
    });
}


/*
* convert the json to only contain the required sources
*
* @param json
* @param sources
*/
function convertPaperbuzzData(json, sources, concept = ""){

  var data = JSON.parse(JSON.stringify(json));
  var i = 0; // index

  for(var object of data.altmetrics_sources){
    var toss = true;

    for(var source of sources){
      if(object.source_id == source) toss = false;
      if(concept) results[concept][object.source_id] = object.events_count;
    }
    if(toss){ delete data.altmetrics_sources[i];}

    i++;
  }

  return data;
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
            minEventsForDaily: 5,
            minYearsForYearly: 1,
            minMonthsForMonthly: 5,
            minDaysForDaily: 5 //first 30 days only
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
