/*
* ImpactViz
* see https://github.com/TIBHannover/rosi-prototype
* Distributed under the MIT License.
*
* @brief Visualization of open scientometric indicators
* @param identifier
*/
function ImpactViz(identifier) {

  this.initViz = function() {

    // check the type of the identifier
    var identifierType = getIdentifierType(identifier);

    if (identifierType){

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
    }
  }
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

      // call api to get data
      callInterface(indicator, identifier, function(value){

        // store in array
        results[indicator.concept][indicator.name] = value;

        // write data to html
        displayIndicator(indicator.concept, indicator.name, value);

        callback(results);

      });
    });
  });
}


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

      callback(json);
    });
}


/*
* display data for an entity type
* get data from paperbuzz and display results with paperbuzzviz and chartjs
*
* @param entity
* @param identifier
*/
function displayEntityByIdentifier(entity, identifier){

  // loading message (will be removed, once the data is there)
  $('#impactviz-overview').append('<div id="impactviz-loading">Collecting the data for the entered '+entity+'. Please be patient - this may take a while.</div>');
  $('#impactviz-loading').append('<img src="./img/loading.gif"></img>');

  // get schema for this entity type
  $.getJSON('./entities/'+entity+'.json', function(schema){

    // get data from paperbuzz
    $.getJSON(schema['api'] + identifier, function(json){

      // remove loading info
      $('#impactviz-loading').remove();
      display('impactviz-overview'); // css stuff

      // display dropdown
      displayCustomizeForm();

      $('#impactviz-overview').append('<h3><a id="title"></a></h3><p class="help-block"><i class="glyphicon glyphicon-info-sign"></i> Click on a concept to get more information.</p><br>');

      // handle entities differently
      switch(entity){

        case 'person':
          $('#title').text(json._full_name);
          break;

        case 'work':

          // display title of the work
          $('#title').attr('href', json.metadata.URL).text(json.metadata.title);

          // add div for overview
          $('#impactviz-overview').append('<div class="section row" id ="impactviz-overview-row">');

          // get list of concepts from schema file
          var conceptIds = [];
          for (var key in schema['concepts']) conceptIds.push(key);

          // result object to store the retrieved indicators
          results = {};

          // display overview and detailed views for each concept (paperbuzz data with paperbuzzviz)
          $.each(conceptIds, function(index, conceptId){

            // create a storage area for each concept in the result object
            results[conceptId] = {};

            concept = schema['concepts'][conceptId];

            // create overview html structure
            $('#impactviz-overview-row').append('<div class="col-lg-3"><a id="'+conceptId+'-link" href="#"><img width="80px" src="./img/'+conceptId+'-white.png" id="'
            +conceptId+'-image"></img><br/><h4>'
            +concept.title+'<i class="material-icons">arrow_drop_down</i></h4></a><div id="'
            +conceptId+'-overview"/></div>');

            $('#'+conceptId+'-link').on("click", function(e){
              display(conceptId);
            });

            $('#impactviz-details').append('<div class="section concept" id="'+conceptId+'"><div class="alert alert-info"><i class="material-icons">'
            +schema['concepts'][conceptId]['icon']+'</i>	<strong>'
            +concept.title
            +' </strong>'+concept.definition+'</div>	<div id="'+conceptId+'-results"></div></div>');

            // write data to detailed view with paperbuzzviz
            displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts'][conceptId]['sources'], conceptId), '#'+conceptId+'-results');

          });

          break;
      }

      // read customize schema from url
      let params = new URLSearchParams(location.search);
      let schemaId = params.get('schema') || "0";

      $.getJSON('./customize/data/data.json', function(customize){

        // get the indicators for this entity by identifier
        getIndicators(customize[schemaId]["indicators"], identifier, function(results){

          // display data from result array for each concept at overview
          $.each(schema.concepts, function(concept){

            $.each(results[concept], function(indicatorName, value){

              $.each(schema['concepts'][concept]['overview'], function(key, overview){

                if(indicatorName == overview){

                  // write to overview
                  displayIndicator(concept, indicatorName, value, true);

                }
              });
            });
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

  identifier = identifier.replace(/(^\w+:|^)\/\//, '');

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
      "helper": "Visualize scientometric indicators: Enter persistent identitifiers (currently Digital Object Identifiers - DOI) or select one of the random examples of publications and research data below.",
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

    //$("#impactviz").append('<div id="impactviz-customize"></div>');

    // create dropdown with available schema
    $("#impactviz-customize").alpaca({
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
* write data to html
*/
function displayIndicator(concept, label, data, overview = false){

  // replace concept icon
  $('#'+concept+'-image').attr('src', './img/'+concept+'.png');

  // display icon if the data is binary
  if(data === true || data === false || data === null){
    data = '<img width="20px" src="./img/'+data+'.png"></img>';
  }

  var id = label.replace(/\s+/g, '');
  id = id.replace(/[^a-zA-Z 0-9]+/g,'');

  // write to overview
  if(overview && $('#paperbuzz-count-'+id+'-overview').length == 0){
    $('#'+concept+'-overview').append('<div class="paperbuzz-source-row paperbuzz-compact" style="width: 200px"><div class="paperbuzz-source-heading">'+label+'<div class="paperbuzz-count-label" id="paperbuzz-count-'+id+'-overview">'+data+'</div></div></div>');
  }

  if($('#paperbuzz-count-'+id+'').length == 0){
    // write to detailed view
    $('#'+concept+'-results').append(
      '<div class="paperbuzz-source-row paperbuzz-compact" style="width: 300px"><div class="paperbuzz-source-heading">'+label+'<div class="paperbuzz-count-label" id="paperbuzz-count-'+id+'">'+data+'</div></div></div>');
  }
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
      if(object.source_id == source){
        toss = false;
        if(concept){
          results[concept][object.source_id] = object.events_count;
        }
      }
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
