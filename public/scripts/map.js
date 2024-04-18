
const modeType = {
  POINT: 1,
  LINE: 2,
  RECTANGLE: 3
}

const LINEWEIGHT = 4;
const LINEOPACITY = 0.75;
const POINTCLICKBOUNDS = 0.005;  //this maybe should scale with the zoom

let points = [];
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


$("document").ready(function() {
  
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
      map.removeLayer(marker);
    });
    marker.addTo(map);
    points = [];
  }
  
  let drawMapObject = function(currentPoints, currentMode, drawing = false) {
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

      let notStillDrawing = points.length === 0;

      console.log(points, notStillDrawing)
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
              console.log('close at index', index)
              let keepPoint = totalPoints === 4? (index + 2) % totalPoints : (index + 1) % totalPoints;
              points = [objectLatLngs[keepPoint]];
              break;
            }
          }
        }
        console.log('removing object')
        map.removeLayer(newMapObject);

        objectJustClicked = true;

        console.log('points after click to resize', points)
      }
    });

    if (currentObject) {
      map.removeLayer(currentObject);
    }
    if (drawing) {
      currentObject = newMapObject;
    }

    newMapObject.addTo(map);
    if (!drawing) {
      points = [];
    }
  }


  //handle on click event for map
  map.on('click', (e) => {
    console.log('map click event!')
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
        drawMapObject(points, mode, false);
        break;
    }
  })
  
  map.on('mousemove', (e) => {
    if (points.length > 0 )  {
      switch(mode) {
        case modeType.LINE:
        case modeType.RECTANGLE:
          drawMapObject([...points, e.latlng], mode, true);
          break;
      }
    } 
  })


  //each of those three elements to have multiline text boxes
  //  assume able to edit text box after

  // this needs to be editable by clicking inside the text box


  //finally, allow search of all those text boxes
    // can we keep the values in one array or object?
    // or maybe keep all the added objects in an array, with the text under each object


})
