$(document).ready(function() {

  displayForm("customize.php");

});



  /*
  * add query form with alpaca to the page
  *
  * @param identifier
  * @param action
  */
  function displayForm(action){

    $("#form").alpaca({
      "schema": {
           "type": "object",
           "properties": {
               "choice": {
                   "title": "Do you want to pick a Flavour or a Topping?",
                   "type": "string",
                   "enum": ["Flavour", "Topping", "test", "test"],
                   "required": true
               },
               "flavour": {
                   "title": "Pick a Flavour",
                   "type": "string",
                   "enum": ["Vanilla", "Chocolate", "Coffee", "Strawberry", "Mint"]
               },
               "topping": {
                   "title": "Pick a Topping",
                   "type": "string",
                   "enum": ["Marshmellow", "Chocolate Chip", "Caramel", "Cookie Dough"]
               },
               "test": {
                   "title": "Pick a test",
                   "type": "string",
                   "enum": ["Marshmellow", "Chocolate Chip", "Caramel", "Cookie Dough"]
               }
           },
           "dependencies": {
               "flavour": ["choice"],
               "topping": ["choice"],
               "test": ["choice"]
           }
       },
       "options": {
           "fields": {
               "flavour": {
                   "dependencies": {
                       "choice": "Flavour"
                   }
               },
               "test": {
                   "dependencies": {
                       "choice": "Flavour"
                   }
               },
               "topping": {
                   "dependencies": {
                       "choice": "Topping"
                   }
               }
           }
       }
    });
  }
