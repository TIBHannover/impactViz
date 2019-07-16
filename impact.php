<?php

$location = "index.html";

// get identifier from form and pass it on
if(isset($_POST['identifier']) && $_POST['identifier']!= null){
  $location .= "?identifier=".$_POST['identifier'];
}

// go back to homepage
header("Location: ".$location);

?>
