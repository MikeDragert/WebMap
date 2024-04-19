
const modeType = {
  POINT: 1,
  LINE: 2,
  RECTANGLE: 3
}

const LINEWEIGHT = 4;
const LINEOPACITY = 0.75;
const POINTCLICKBOUNDS = 0.005;  //this maybe should scale with the zoom

let points = [];
let savedTooltipText = '';
let objectJustClicked = false;

let mode = modeType.POINT;
let currentObject = undefined;

let setMode = function(newMode) {
  if (Object.values(modeType).includes(newMode)) {
    mode = newMode;
  }
}

let pointsClose = function(point1, point2) {
  return (point1.lat - POINTCLICKBOUNDS) <= point2.lat && 
          point2.lat <= (point1.lat + POINTCLICKBOUNDS) &&
         (point1.lng - POINTCLICKBOUNDS) <= point2.lng && 
          point2.lng <= (point1.lng + POINTCLICKBOUNDS); 
}

let currentTooltipObject = undefined;
let currentTooltipText = '';

const setCurrentTooltipText = function(newText, editing) {
  currentTooltipText = newText;
  if (editing) {
    currentTooltipObject.setContent(`<strong>${currentTooltipText}</strong>`);
  } else {
    currentTooltipObject.setContent(currentTooltipText);
  }
}

const createTooltip = function (map, element, content = '') {
  element.bindTooltip(content, {permanent: true, direction: "auto", interactive: true, bubblingMouseEvents: false})
    .openTooltip()
    .on('click', (e) => {
      if (tooltipMatch(element, e)) {
        toggleTooltipEdit(map, element.getTooltip());   
      }
    });

  if (content.length === 0) {
    toggleTooltipEdit(map, element.getTooltip());
  }
}

const tooltipMatch = function(element, event) {
  return element.getTooltip() === event.sourceTarget;
}

let toggleTooltipEdit = function(map, tooltipObject) {
  if (!tooltipObject) {
    $('#map').focus();
    map.keyboard.enable();
    currentTooltipObject = undefined;
    return;
  }

  if (currentTooltipObject === tooltipObject) {
    setCurrentTooltipText(currentTooltipText, false);
    $('#map').focus();
    map.keyboard.enable();
    currentTooltipObject = undefined;
    return;
  }

  if (currentTooltipObject !== undefined) {
    setCurrentTooltipText(currentTooltipText, false);
    currentTooltipObject = undefined;
  }

  currentTooltipText = tooltipObject.getContent();
  currentTooltipObject = tooltipObject;
  setCurrentTooltipText(currentTooltipText, true);
  map.keyboard.disable(); //todo: something weird happens here.  enabling keyboard later doesn't work until we click outside the map and then back in
}

let handleKey = function(keyEvent) {
  if (currentTooltipObject !== undefined) {
    if ((keyEvent.keyCode === 8) || (keyEvent.keyCode === 127)) {
      setCurrentTooltipText(currentTooltipText.slice(0,-1), true);      
    } else if (keyEvent.keyCode === 13) {
      setCurrentTooltipText(currentTooltipText + "<br>", true);
    } else if (keyEvent.keyCode === 32) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      setCurrentTooltipText(currentTooltipText + keyEvent.key, true);
    } else if (keyEvent.keyCode >= 48 ) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      setCurrentTooltipText(currentTooltipText + keyEvent.key, true);
    }
  }

}

//todo:  we have an issue where things like removing a marker, or editing a tooltip text
//       put leaflet in a state where key commands don't work
//     However, clicking outside and then back inside the map seem to fix it.  Weird...
//     Also attempting keyboard entry puts a border around the map.  

$(document).ready(function() {
  
  $(document).on('keydown', handleKey);


  $("#pointButton").on('click', () => setMode(modeType.POINT));
  $("#lineButton").on('click', () => setMode(modeType.LINE));
  $("#rectangleButton").on('click', () => setMode(modeType.RECTANGLE));


  //todo:  what is the default location - can we get the location of the user?
  let map = L.map('map').setView([51.505, -0.09], 13);
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  
  let createMarker = function(currentPoints) {
    if (currentPoints.length < 1) {
      return;
    }
    let marker = L.marker(points[0]);
    marker.on('click', (e) => {
      if (marker === e.sourceTarget) {
        map.removeLayer(marker);
        $('#map').focus();
      }
    });

   
    marker.addTo(map);
    createTooltip(map, marker);
    
    points = [];
  }
  
  let drawMapObject = function(currentPoints, currentMode, tooltipText, drawing = false) {
    if (currentPoints.length < 2) {
      return;
    }
    let color = drawing ? "CornflowerBlue" : "MediumSlateBlue"
    let newMapObject = undefined;
    
    if (currentMode === modeType.LINE) {
      newMapObject = new L.Polyline(currentPoints, {
          color: color,
          weight: 3,
          opacity: 0.75,
          smoothFactor: 1
      });
    }

    if (currentMode === modeType.RECTANGLE) {
      newMapObject = new L.Rectangle(currentPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }

    if (!newMapObject) {
      return;
    }

    newMapObject.on('click', (e) => {
      //todo: can me make markers, lines, rectangles movable by click drag?
      if (newMapObject === e.sourceTarget) {
        let notStillDrawing = points.length === 0;

        if (notStillDrawing) {
          //did we click near a corner?
          let objectLatLngs = [];
          let totalPoints = 0;
          if (newMapObject instanceof L.Polyline) {
            mode = modeType.LINE;
            objectLatLngs = newMapObject.getLatLngs();
            totalPoints = 2;
          }
          if (newMapObject instanceof L.Rectangle) {
            mode = modeType.RECTANGLE;
            objectLatLngs = newMapObject.getLatLngs()[0];
            totalPoints = 4;
          }
          if (objectLatLngs.length > 1) {
            for(let index = 0; index < objectLatLngs.length; index++) {
              if (pointsClose(e.latlng, objectLatLngs[index])) {
                let keepPoint = totalPoints === 4? (index + 2) % totalPoints : (index + 1) % totalPoints;
                points = [objectLatLngs[keepPoint]];
                break;
              }
            }
          }
          savedTooltipText = newMapObject.getTooltip().getContent();
          map.removeLayer(newMapObject);
          
          drawMapObject([...points, e.latlng], mode, tooltipText, true);

          objectJustClicked = true;
        }
      }
    });

    if (currentObject) {
      map.removeLayer(currentObject);
    }
    if (drawing) {
      currentObject = newMapObject;
    }

    newMapObject.addTo(map);
    if (savedTooltipText.length > 0) {
      createTooltip(map, newMapObject,savedTooltipText);
    } else if (!drawing) {
      createTooltip(map, newMapObject);
    }

    if (!drawing) {
      points = [];
      savedTooltipText = '';
    }
  }


  //handle on click event for map
  map.on('click', (e) => {
    if ((!objectJustClicked)) {
      points.push(e.latlng)
    } 
    objectJustClicked = false;
    
    switch(mode) {
      case modeType.POINT:
        createMarker(points);
        break;
      case modeType.LINE:
        case modeType.RECTANGLE:
        drawMapObject(points, mode, undefined, false);
        break;
    }
  })
  
  map.on('mousemove', (e) => {
    if (points.length > 0 )  {
      switch(mode) {
        case modeType.LINE:
        case modeType.RECTANGLE:
          drawMapObject([...points, e.latlng], mode, undefined, true);
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
