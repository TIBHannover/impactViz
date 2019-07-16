$(document).ready(function() {

  // get identifier from url
  let params = new URLSearchParams(location.search);
  let identifier = params.get('identifier');

  // display visualisation with paperbuzzviz
  if(identifier != null){
    displayPaperbuzzviz(identifier);
  }

  // display form with alpaca.js
  var action = "impact.php";
  displayForm(identifier, action);

});

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


// adding visualisation with PaperbuzzViz
function displayPaperbuzzviz(identifier){
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
        showTitle: true,
        showMini: false,
      }

  var paperbuzzviz = undefined;

  d3.json('https://api.paperbuzz.org/v0/doi/' + identifier, function(data) {
      options.paperbuzzStatsJson = data
      paperbuzzviz = new PaperbuzzViz(options);
      paperbuzzviz.initViz();
    });
}
