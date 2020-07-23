/*
* ImpactViz
* see https://github.com/TIBHannover/rosi-prototype
* Distributed under the MIT License.
*
* @brief Visualization of open scientometric indicators
* @param identifier
*/
function ImpactViz(identifier, options = '') {

  // set default values for options
  window.customizeFile = './schemas/customize.json';
  window.indicatorsFile = './schemas/indicators.json';
  window.entitiesPath = './entities/';
  window.imgPath = './img/'

  // read options
  if (options.customize) window.customizeFile = options.customize;
  if (options.indicators) window.indicatorsFile = options.indicators;
  if (options.entities) window.entitiesPath = options.entities;
  if (options.img) window.imgPath = options.img;
  if (options.title) window.title = options.title;

  // get and display all data for this identifier
  this.initViz = function() {

      // check the type of the identifier to get the entity
      identifier = identifier.replace(/(^\w+:|^)\/\//, '');
      const doiPattern = /10.\d{4,9}\/[-._;()\/:a-zA-Z0-9]+$/gm;
      const orcidPattern = /^\d{4}[-]\d{4}[-]\d{4}[-]\d{4}$/gm;

      var entity;

      if (doiPattern.exec(identifier)) {
        entity = "work";
      }else if (orcidPattern.exec(identifier)) {
        entity = "person";
      }

      // loading message (will be removed, once the data is there)
      $('#impactviz-overview').append('<div id="impactviz-loading">Collecting the data for the entered '+entity+'. Please be patient - this may take a while.</div>');
      $('#impactviz-loading').append('<img src="'+window.imgPath+'loading.gif"></img>');

      // get schema for this entity type
      $.getJSON(window.entitiesPath+entity+'.json', function(schema){

        // get data from paperbuzz
        $.getJSON(schema['api'] + identifier, function(json){

          // remove loading info
          $('#impactviz-loading').remove();
          display('impactviz-overview'); // css stuff

          // display dropdown
          displayCustomizeForm();

          // title
          if(typeof window.title !== 'undefined'){
            $('#impactviz-overview').append('<h3><a id="title"></a></h3>');
          }

          // handle entities differently
          // NOTE: only the entity work is properly implemented
          switch(entity){

            case 'person':
              $('#title').text(json._full_name);
              break;

            case 'work':

              // display title of the work
              if(typeof window.title !== 'undefined'){
                $('#title').attr('href', json.metadata.URL).text(json.metadata.title);
              }

              // get list of concepts from schema file
              var conceptIds = [];
              for (var key in schema['concepts']) conceptIds.push(key);

              // result object to store the retrieved indicators
              results = {};

              // display overview and detailed views for each concept (paperbuzz data with paperbuzzviz)
              $.each(conceptIds, function(index, conceptId){

                // create a storage area for this concept in the result object
                results[conceptId] = {};

                // create the html structure for this concept
                displayConceptStructure(schema['concepts'][conceptId])

                // write data to detailed view with paperbuzzviz
                displayPaperbuzzviz(convertPaperbuzzData(json, schema['concepts'][conceptId]['sources'], conceptId), conceptId);

              });

              // info block
              $('#impactviz-overview').append('<p class="help-block"><i class="glyphicon glyphicon-info-sign"></i> Click on an icon to get more information.</p><br>');

              break;
          }

          // read customize schema from url
          let params = new URLSearchParams(location.search);
          let schemaId = params.get('schema') || '0';

          $.getJSON(window.customizeFile, function(customize){

            // get the data for this entity by identifier
            getData(customize[schemaId]['indicators'], identifier, function(results){

              // display data from result array for each concept at overview
              $.each(schema.concepts, function(concept){

                $.each(results[concept], function(indicatorName, value){

                  $.each(schema['concepts'][concept]['overview'], function(key, overview){

                    if(indicatorName == overview){

                      // write to overview
                      writeData(concept, indicatorName, value, true);

                    }
                  });
                });
              });
            });
          });
        });
      });

  }
}


/*
* get indicator by id
*
* @param indicatorId
*/
function getIndicatorById(indicatorId, callback){

  // read metadata of this indicator from json
  $.getJSON(window.indicatorsFile, function(indicators){

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
function getData(indicatorIds, identifier, callback){

  // get single indicators
  $.each(indicatorIds, function(index, indicatorId){

    // get metadata of this indicator
    getIndicatorById(indicatorId, function(indicator){

      // call api to get data
      callInterface(indicator, identifier, function(value){

        // store in array
        results[indicator.concept][indicator.name] = value;

        // write data to html
        writeData(indicator.concept, indicator.name, value);

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
      $.each(indicator.key, function(index, element){
        if(json) json = json[element];
      });

      callback(json);
    });
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

/*
* create the html structure for the concept display
*
* @param concept
*/
function displayConceptStructure(concept){

  // create overview html structure
  $('#impactviz-overview').append('<div class="col-sm-3"><a id="'+concept.id+'-link" href="#'+concept.id+'" title="'+concept.title+'"><img width="80px" src="'+window.imgPath+concept.id+'-white.png" id="'
  +concept.id+'-image"></img><br/></a><div id="'
  +concept.id+'-overview"/></div>');

  $('#'+concept.id+'-link').on("click", function(e){
    display(concept.id);
  });

  // display
  $('#impactviz-details').append('<div class="section concept" id="'+concept.id+'"><div class="alert alert-info"><i class="material-icons">'
  +concept.icon+'</i><strong>'+concept.title+' </strong>'+concept.definition+'</div>	<div id="'+concept.id+'-results"></div></div>');

}


/**
* display customize form
* read available schema from json file
*/
function displayCustomizeForm(){

  $.getJSON(window.customizeFile, function(customize){

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
function writeData(concept, label, data, overview = false){

  // replace concept icon - to signalize that there is data available for this concept
  $('#'+concept+'-image').attr('src', window.imgPath+concept+'.png');

  // check, if type of data and display matching icon
  // NOTE: switch case is not working here
  if(data === true) data = '<i class="material-icons">done</i>';
  if(data === false) data = '<i class="material-icons">clear</i>';
  if(data === null) data = '<i class="material-icons">error</i>';
  if(validURL(data)) data = '<a href="'+data+'"><i class="material-icons">link</i></a>';

  // remove empty spaces and non numeric values to be able to use the label as an id
  var id = label.replace(/\s+/g, '');
  id = id.replace(/[^a-zA-Z 0-9]+/g,'');

  // write to overview
  if(overview && $('#paperbuzz-count-'+id+'-overview').length == 0){
    $('#'+concept+'-overview').append('<div class="paperbuzz-source-row paperbuzz-compact"><div class="paperbuzz-source-heading">'+label+'<div class="paperbuzz-count-label" id="paperbuzz-count-'+id+'-overview">'+data+'</div></div></div>');
  }

  // write to detailed view
  if($('#paperbuzz-count-'+id+'').length == 0){
    $('#'+concept+'-results').append(
      '<div class="paperbuzz-source-row paperbuzz-compact"><div class="paperbuzz-source-heading">'+label+'<div class="paperbuzz-count-label" id="paperbuzz-count-'+id+'">'+data+'</div></div></div>');
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
function displayPaperbuzzviz(data, concept, showMini = false){

  var vizDiv = '#'+concept+'-results';

  // replace concept icon - to signalize that there is data available for this concept
  if(data['altmetrics_sources'][0]){
    $('#'+concept+'-image').attr('src', window.imgPath+concept+'.png');
  }

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

// check if string is a url
function validURL(string) {
  var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return pattern.test(string);
}

// display the selected concept and hide all other
function display(concept){
  $('.concept').css('display', 'none');
  $('#'+concept).css('display', 'block');
}
