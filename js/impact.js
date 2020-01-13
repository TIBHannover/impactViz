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

      var type;

      // handle entity types
      switch (identifierType) {
        case "doi":
          type = "work";
          break;
        case "orcid":
          type = "person";
          break;
      }

      // get and display all data for this identifier
      displayEntityByIdentifier(type, identifier);

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

  // get schema for this entity type
  $.getJSON('./entities/'+entity+'.json', function(schema){

    // get data from paperbuzz
    $.getJSON(schema['api'] + identifier, function(json){

      // remove loading info
      $('#loading').remove();
      display('overview'); // css stuff

      // display dropdown
      displayCustomizeForm();

      // handle entities differently
      switch(entity){

        case 'person':
          $('#title').text(json._full_name);
          break;

        case 'work':
          // display title of the work
          $('#title').attr('href', json.metadata.URL).text(json.metadata.title);

          // display detailed views for the concepts (paperbuzz data with paperbuzzviz)
          displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts']['scientific-impact']['sources'], 'scientific-impact'), scientificimpactviz);
          displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts']['societal-impact']['sources'], 'societal-impact'), societalimpactviz);
          displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts']['community']['sources'], 'community'), communityviz);

          break;
      }

      // read schema from url (use entity name as default if not existing)
      let params = new URLSearchParams(location.search);
      let schemaId = params.get('schema') || "0";

      $.getJSON('./customize/data/data.json', function(customize){

        // get the indicators for this entity by identifier
        getIndicators(customize[schemaId]["indicators"], identifier, function(results){

          // display a visualisation for each concept at overview
          $.each(schema.concepts, function(concept){
              displayImpactByConcept(results, concept, schema['concepts'][concept]['visualisation'], schema['concepts'][concept]['overview']);
            });
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
      "helper": "Find out about the impact of your research. Enter an identifier like an DOI or select an example below.",
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
* read available schema from json file
*/
function displayCustomizeForm(){

  $.getJSON('./customize/data/data.json', function(customize){

    // store ids and names of schemas
    var schemas = {};
    schemas.ids = [];
    schemas.names = [];

    $.each(customize, function(index, element){
      schemas.ids.push(element.id);
      schemas.names.push(element.name);
    });

    // get schema from url or use default 0
    let params = new URLSearchParams(location.search);
    let schema = params.get('schema') || "0";

    // create dropdown with available schema
    $("#customize").alpaca({
      "data": [schema],
      "schema": {
        "enum": schemas.ids,
        "required": true // needed to disable "none" option
      },
      "options": {
          "type": "select",
          "optionLabels": schemas.names,
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
  });
}


/*
* display overview for a concept with chartjs
*
* @param data
* @param concept
*/
function displayImpactByConcept(data, concept, visualisation = 'pie', sources){

  var displayData = [];
  var labels = [];
  var label = "";

  // put data for this concept to the display data
  $.each(sources, function(index, label){
    displayData.push(+data[concept][label]);  // boolean to 0 / 1 with +
    labels.push(label);
  });

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

    // store data in results array
    for(var source of sources){
      if(object.source_id == source) toss = false;
      if(concept) results[concept][object.source_id] = object.events_count;
    }
    if(toss) delete data.altmetrics_sources[i];
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
