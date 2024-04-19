import {modeType, Marker, Line, Rectangle } from './mapObjects.js';


let map = undefined;
let mapObjects = [];

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
        mapObjects.push(new Marker([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map);
        console.log(mapObjects);
        break;
      case modeType.LINE:
        mapObjects.push(new Line([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map, e.latlng);
        break;
      case modeType.RECTANGLE:
        mapObjects.push(new Rectangle([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map, e.latlng);
        break;
    }
  })
  
  map.on('mousemove', (e) => {
    //todo: we need to properly figure out what we are editing!
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

  $('#map').focus();

  //for every item created - save points array, and tooltip text
  //    needs to be updatable from map (delete, or change points, or change text)


  //finally, allow search of all those text boxes
    // what will this do?  return all created items that match?
    //  put in list?
    //  allow click in list to zoom to map
    // can we keep the values in one array or object?
    // or maybe keep all the added objects in an array, with the text under each object


  //todo:  some quality of life features
  //      1 - escape while drawing should cancel the draw
  //      2 - enter should end typing in box
  //        |-> shift enter should add new line
  //     
  //      3 - need select area on points scale with zoom - or based on pixels and not long/lat

  // todo:  we really want it to load to the persons actual location if we can


})
