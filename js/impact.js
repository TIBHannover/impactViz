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
* @param indicator
* @param identifier
*/
async function getIndicator(indicator, identifier, callback){

  await d3.json(indicator['api'] + identifier, function(json){

    $.each(indicator['key'], function(index, element){
      json = json[element];
    });

    // write data to html
//    $('#indicators').append(indicator['concept']+": " + indicator['name']+" <img title='"+indicator['source']+"' class='source-icon' src="+indicator['logo']+">: "+json+"<br>");
    $('#'+indicator['concept']+"-results").append(indicator['name']+" (<img title='"+indicator['source']+"' class='source-icon' src="+indicator['logo']+">): "+json+"<br>");

    callback(json);

  });

}


function getIndicators(indicators, identifier, callback){

  var flower = new Object();
//  flower['scientific-impact'] = 18;
  flower['societal-impact'] = 10;
  flower['community'] = 7;
  flower['openness'] = 3;

  // get single indicators
  $.each(indicators, function(index, indicator){

      getIndicator(indicator, identifier, function(value){

        if(Number.isInteger(Number(value))){
          flower[indicator['concept']] = Number(value);
        }

        // return flower

      });

      console.log(flower);

  });

  callback(flower);

}

/*
* display data for a entity type
* get data from paperbuzz and display results with paperbuzzviz and chartjs
*
* @param identifier
*/
function displayEntityByIdentifier(entity, identifier){

    $('#loading').text('Ah yes, this seems to be a '+entity+'. Please be patient while we are collecting the data. This may take a while.');

    // get schema for this entity type
    $.getJSON('./schemas/'+entity+'.json', function(schema){

      // get data from paperbuzz
      d3.json(schema['api'] + identifier, function(json){

        // remove loading info and display title
        $('#loading').remove();

        // handle entities differently
        switch(entity){

          case 'person':
            $('#title').text(json._full_name);
            break;

          case 'work':

            getIndicators(schema['indicators'], identifier, function(flower){
          //    console.log(flower);
              displayFlower(flower, schema['overview']);
            });

            $('#title').attr('href', json.metadata.URL).text(json.metadata.title);

            // display overview and detailed views
            display('overview'); // css stuff
            displayPaperbuzzviz(json, overviewviz, true);

            // display paperbuzz data with paperbuzzviz
            displayPaperbuzzviz(convertForConcept(json, schema['concepts']['scientific-impact']), scientificimpactviz);
            displayPaperbuzzviz(convertForConcept(json, schema['concepts']['societal-impact']), societalimpactviz);
            displayPaperbuzzviz(convertForConcept(json, schema['concepts']['community']), communityviz);

            // display openness
            if(json.open_access.is_oa){
              $("#opennessviz").append('<img src="img/open.svg">');
            }

            break;
        }


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
* display flower with chartjs
*
* @param data
* @param concepts
*/
function displayFlower(data, concepts){

  console.log(data);
  console.log(concepts);

  // create json structure for chartjs data
  var displayData = {}; datasets = []; labels = []; events = [];

  // get data from each source and convert data according to json structure needed for the chart js
  concepts.forEach(function(concept) {
    events.push(data[concept]);
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
