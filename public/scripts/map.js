import {modeType, Marker, Line, Rectangle } from './mapObjects.js';


let map = undefined;
let mapObjects = [];
let searchWords = "";

let mode = modeType.POINT;
let ignoreNextClick = false;

let setIgnoreNextClick = function() {
  ignoreNextClick = true;
}

let setMode = function(newMode) {
  if (Object.values(modeType).includes(newMode)) {
    mode = newMode;
  }
}

const getCurrentEditingTooltipObject = function() {
  return mapObjects.find((mapObject) => mapObject.editingTooltip)
}

const getCurrentEditingSizeObject = function() {
  return mapObjects.find((mapObject) => mapObject.editingSize)
}


const clearAllEditingObjects = function(exception) {
  mapObjects.forEach( mapObject => {
    if ((mapObject !== exception) && (mapObject.editingTooltip)) {
      mapObject.toggleTooltipEdit(map);
    }
  })
}

const removeMapObject = function(removeObject) {
  mapObjects = mapObjects.filter(mapObject => mapObject !== removeObject);
  displayMapObjects();
}

const handleKey = function(keyEvent) {
  let currentObjectEditing = getCurrentEditingTooltipObject();
  if (currentObjectEditing) {
    if ((keyEvent.keyCode === 8) || (keyEvent.keyCode === 127)) {
      currentObjectEditing.removeLastCharFromTooltipContent();       
    } else if (keyEvent.keyCode === 13) {
      currentObjectEditing.addCharToTooltipContent("<br>"); 
    } else if (keyEvent.keyCode === 32) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      currentObjectEditing.addCharToTooltipContent(keyEvent.key); 
    } else if (keyEvent.keyCode >= 48 ) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      currentObjectEditing.addCharToTooltipContent(keyEvent.key);
    }
  }
}

//todo: we may want the option to just update one from the list, instead of removing all and recreating on typing text
const displayMapObjects = function() {
  let filteredMapObjects = mapObjects;
  if (searchWords.length > 0) {
    filteredMapObjects = mapObjects.filter( mapObject => {
      return searchWords.reduce((found, searchWord) => found || mapObject.tooltipContent.toLowerCase().includes(searchWord), false)  
    })
  }
  
  $("#searchResults").empty();
  filteredMapObjects.forEach( mapObject => {
    let newSpan = $('<span />').html(mapObject.tooltipContent).on('click', () => map.flyTo(mapObject.getCenterPoint()))
    $("#searchResults").append(newSpan);
  })
}

$(document).ready(function() {
  
  $(document).on('keydown', handleKey);


  $("#pointButton").on('click', () => setMode(modeType.POINT));
  $("#lineButton").on('click', () => setMode(modeType.LINE));
  $("#rectangleButton").on('click', () => setMode(modeType.RECTANGLE));

  //todo:  what is the default location - can we get the location of the user?
  map = L.map('map').setView([51.505, -0.09], 13);
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  //handle on click event for map
  map.on('click', (e) => {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      return;
    }
    switch(mode) {
      case modeType.POINT:
        mapObjects.push(new Marker([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map);
        displayMapObjects();
        break;
      case modeType.LINE:
        mapObjects.push(new Line([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map, e.latlng);
        displayMapObjects();
        break;
      case modeType.RECTANGLE:
        mapObjects.push(new Rectangle([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map, e.latlng);
        displayMapObjects();
        break;
    }
  })
  
  map.on('mousemove', (e) => {
    let editObject = getCurrentEditingSizeObject()    
    if (editObject) {
      switch(mode) {
        case modeType.LINE:
        case modeType.RECTANGLE:
          editObject.createOnMap(L, map, e.latlng);
          break;
      }
    } 
  })

  $('#searchText').on('keydown', (event) => {
    if (event.keyCode === 13) {
      let searchText = $('#searchText').val().toLowerCase();
      searchWords = searchText.split(' ');
      $('#searchText').val('');
      displayMapObjects();
    }
  })

  $('#map').focus();

  //searching improvements
    // show term searched for somewhere
    //  \-> X for clearing search results?
    //  list section allow scroll if too many items
    
  //todo:  some quality of life features
  //      1 - escape while drawing should cancel the draw
  //      2 - enter should end typing in box
  //        |-> shift enter should add new line
  //      3 - allow moving the items with long click, or click drag
  //          \-> needs to work with deleting too
  //      4 - need select area on points scale with zoom - or based on pixels and not long/lat
  // OR 1 - click once to edit, click again (or escape) to stop editing
  //      - while selected - clicking a point can resize
  //      - long click to drage
  //      - delete key to delete

  // todo:  we really want it to load to the persons actual location if we can

  //styling
  //  1 - colour scheme
  //     \-> Title colour, background colour, text color, border colors
  //  2 - Buttons styling - font-awesome?
  //  3 - map items styling
  //    \-> drawing/selected colour, finished colour, tooltip styling
  //  4 - clear title bar?


})
