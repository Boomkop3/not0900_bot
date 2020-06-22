<?php
// ini_set('error_reporting', E_ALL);
// ini_set('display_errors', E_ALL);
$currentOut = Array();
$state;

function main(){
  global $state;
  if ($_GET['action'] == 'stop'){
    unlink($_GET['channel'].'.json');
  } else if ($_GET['action'] == 'start'){
    $file = $_GET['file'].'.json';
    if (file_exists($file) && isset($_GET['channel'])){
      $response = Array();
      array_push($response, true); // tell the client the request was sucessful
      array_push($response, "text"); // tell the api the content type (always starts as text, alt: menu)
      $state = firstLevel(file_get_contents($file));
      while (runCommandList($state->scene->pre, $state->story)){
        // Just keep running till there's no more jumps
      }
      file_put_contents($_GET['channel'].'.json', json_encode($state));
      c_flush($response);
    } else {
      echo json_encode(Array(false));
    }
  } else if ($_GET['action'] == 'next'){
    $response = Array();
    array_push($response, true);
    $state = json_decode(file_get_contents($_GET['channel'].'.json'));
    file_put_contents($_GET['channel'].'.json', json_encode(nextstep()));
  } else if ($_GET['action'] == 'menu') {
    $state = json_decode(file_get_contents($_GET['channel'].'.json'));
    file_put_contents($_GET['channel'].'.json', json_encode(handleMenuOption()));
  }
}

function preProcess($story){
  $lcount = count($story['story']);
  for ($i = 0; $i < $lcount; $i++){
    $post = $story['story'][$i]['post'];
    $keys = array_keys($story['story'][$i]['menu']);
    foreach ($keys as $key){
      foreach ($post as $line){
        array_push($story['story'][$i]['menu'][$key], $line);
      }
    }
  }
  return $story;
}

function firstLevel($json){
  $state = new stdClass();
  $story = json_decode($json, true);
  $story = preProcess($story);
  $story = json_decode(json_encode($story));
  $scene = (Object)Array();
  
  $state->story = $story;
  $state->scene = $scene;
  
  $state->scene = getScene($story, $story->startingpoint);
  return $state;
}

function handleMenuOption(){
  global $state;
  $choice = $_GET['menu'];
  $channelID = $_GET['channel'];
  $menucontent = array_values((array)($state->scene->menu))[$choice];
  if (runCommandList($menucontent, $state->story)){
    while (runCommandList($state->scene->pre, $state->story)){
      // Just keep running till there's no more jumps
    }
  }
  $response = Array();
  array_push($response, true);
  array_push($response, "text");
  c_flush($response);
  return $state;
}

function nextstep() {
  global $state;
  global $currentOut;
  array_push($currentOut, true);
  array_push($currentOut, "menu");
  showMenuFor($state->story, $state->scene);
  return $state;
}

function showMenuFor($story, $scene){
  global $currentOut;
  $menu = $scene->menu;
  $keys = array_keys((array)$menu);
  array_push($currentOut, $keys);
  echo json_encode($currentOut);
}

function c_say($command){
  global $currentOut;
  array_push($currentOut, $command);
}
function c_flush($response){
  global $currentOut;
  array_push($response, $currentOut);
  echo json_encode($response);
}
function getScene($_story, $name){
    $story = $_story->story;
    foreach ($story as $part){
        if ($part->label == $name){
            return $part;
        }
    }
}
function runCommandList($list, $story){
  foreach ($list as $command){
    if (runCommand($command, $story)){
      return true;
    }
  }
  return false;
}
function runCommand($command, $story){
  $pieces = explode(" ", $command);
  switch ($pieces[0]){
    case "say:": {
      c_say(substr($command, strlen($pieces[0])));
      break;
    }
    case "jump:": {
      global $state;
      $state->scene = getScene($story, substr($command, strlen($pieces[0]) + 1));
      return true;
      break;
    }
  }
  return false;
}
main();
?>
