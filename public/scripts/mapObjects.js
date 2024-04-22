export const modeType = {
  POINT: 1,
  LINE: 2,
  RECTANGLE: 3
}

const LINEWEIGHT = 4;
const LINEOPACITY = 0.75;
const POINTCLICKBOUNDS = 0.005;  //this maybe should scale with the zoom
const TOOLTIPTEXTDEFAULT = "Type here";
const EDITINGCOLOR = "#2AAD27";
const FINISHEDCOLOR = "#2A81CB";

export class MapObject {
  _type = undefined;
  _points = [];
  _tooltipContent = TOOLTIPTEXTDEFAULT;
  _editingTooltip = false;
  _mapElement = undefined;
  _callbacks = undefined;
  _editingObject = false;

  constructor () {
    this._editingTooltip = false;
  }

  get editingTooltip() {
    return this._editingTooltip;
  }

  get tooltipContent() {
    return this._tooltipContent;
  }

  get type() {
    return this._type;
  }
  
  get numberPoints() {
    return this._points.length
  }
  
  get editingObject() {
    return this._editingObject;
  }

  setPoints = function(points) {
    this._points = points;
  }

  addPoint = function(point) {
    this._points.push(point);
  }

  clearPoints = function() {
    this._points = [];
  }

  removeLastPoint = function() {
    this._points.pop();
  }

  setTooltipContent = function(tooltipContent) {
    this._tooltipContent = tooltipContent;
    this._displayCurrentTooltipText();
  }
  
  clearTooltipContent = function() {
    this._tooltipContent = '';
    this._displayCurrentTooltipText();
  }
  
  addCharToTooltipContent = function(char) {
    if (this._tooltipContent === TOOLTIPTEXTDEFAULT) {
      this._tooltipContent = "";
    }
    this._tooltipContent += char;
    this._displayCurrentTooltipText();
  }
  
  removeLastCharFromTooltipContent = function () {
    this._tooltipContent = this._tooltipContent.slice(0,-1);  
    if (this._tooltipContent === '') {
      this._tooltipContent = TOOLTIPTEXTDEFAULT;
    }
    this._displayCurrentTooltipText();
  }

  getCenterPoint = function() {
    if (this._points.length === 0) {
      return undefined;
    }
    
    if (this._points.length === 1) {
      return this._points[0];
    }

    let centerPoint = new L.LatLng(
      this._points[0].lat + (this._points[1].lat-this._points[0].lat)/2, 
      this._points[0].lng + (this._points[1].lng-this._points[0].lng)/2
    );
    
    return centerPoint;
  }

  _displayCurrentTooltipText = function() {
    if (this._editingTooltip) {
      this._mapElement.getTooltip().setContent(`<strong>${this._tooltipContent }</strong>`);
    } else {
      this._mapElement.getTooltip().setContent(this._tooltipContent );
    }
    this._callbacks.displayMapObjects();
  }
  
  _createTooltip = function (map) {
    if (!this._mapElement) {
      return;
    }

    this._mapElement.bindTooltip(this._tooltipContent, {permanent: true, direction: "auto", interactive: true, bubblingMouseEvents: false})
      .openTooltip()
      .on('click', (event) => {
        if (this._tooltipMatch(event)) {
          this.toggleTooltipEdit(map);   
        }
      });
  
    if ((this._tooltipContent.length === 0) || (this._tooltipContent === TOOLTIPTEXTDEFAULT)) {
      this.toggleTooltipEdit(map);
    }
  }
  
  _tooltipMatch = function(event) {
    if (!this._mapElement) {
      return false;
    }
    return this._mapElement.getTooltip() === event.sourceTarget;
  }
  
  toggleTooltipEdit = function(map) {
    if (!this._mapElement) {
      return;
    }
    this._editingTooltip = !this._editingTooltip;
    
    if (!this._mapElement.getTooltip()) {
      $('#map').focus();
      map.keyboard.enable();
      return;
    }

    this._displayCurrentTooltipText();
    $('#map').focus();
  
    if (this._editingTooltip) {
      this._callbacks.clearAllEditingObjects(this);
      map.keyboard.disable(); //todo: something weird happens here.  enabling keyboard later doesn't work until we click outside the map and then back in
      return;
    } 
    map.keyboard.enable(); 
  }
  
  _pointsClose = function(point1, point2) {
    return (point1.lat - POINTCLICKBOUNDS) <= point2.lat && 
            point2.lat <= (point1.lat + POINTCLICKBOUNDS) &&
           (point1.lng - POINTCLICKBOUNDS) <= point2.lng && 
            point2.lng <= (point1.lng + POINTCLICKBOUNDS); 
  }

  removeFromMap = function(map) {
    if (this._mapElement) {
      map.removeLayer(this._mapElement);
      this._mapElement = undefined;
    }
  }

  _createMarker = function(L, map) {
    if (this._points.length < 1) {
      return;
    }

    let iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png"
    if (this._type.editingObject) {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
    }
    if (this._type = modeType.POINT) {
      if (this._mapElement === undefined) {
        this._mapElement = L.marker(this._points[0], { icon: new L.Icon({iconUrl: iconUrl, iconSize: [25, 41], iconAnchor: [12, 41],})});
        this._mapElement.on('click', (e) => {
          if (this._mapElement === e.sourceTarget) {
            map.removeLayer(this._mapElement);
            this._mapElement = undefined;
            $('#map').focus();
            this._callbacks.removeMapObject(this);
          }
        });

        this._mapElement.addTo(map);
        this._createTooltip(map);
      }
    }
  }

  _drawMapObject = function(L, map, targetPoint = undefined) {
    let targetPoints = [...this._points];
    if ((targetPoints.length === 1) && (targetPoint instanceof L.LatLng)) {
      targetPoints.push(targetPoint);
    }
    
    if (targetPoints.length < 2) {
      return;
    }
    let drawing = this._points.length < 2;
    let color = drawing ? EDITINGCOLOR : FINISHEDCOLOR;
    let lastMapElement = this._mapElement;    
    if (this._type === modeType.LINE) {
      this._mapElement = new L.Polyline(targetPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }

    if (this._type === modeType.RECTANGLE) {
      this._mapElement = new L.Rectangle(targetPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }

    if (!this._mapElement) {
      return;
    }

    this._mapElement.on('click', (event) => {
      //todo: can me make markers, lines, rectangles movable by click drag?
      if (this._mapElement === event.sourceTarget) {
        let stillDrawing = this._points.length !== 2;

        if (stillDrawing) {
          this._points.push(event.latlng);
          this._editingObject = false;
          map.removeLayer(this._mapElement);          
          this._drawMapObject(L, map);
        } else {
          //did we click near a corner?
          let objectLatLngs = [];
          let totalPoints = 0;
          if (this._type === modeType.LINE) {
            objectLatLngs = this._mapElement.getLatLngs();
            totalPoints = 2;
          }
          if (this._type === modeType.RECTANGLE) {
            objectLatLngs = this._mapElement.getLatLngs()[0];
            totalPoints = 4;
          }
          
          let foundPoint = false;
          if (objectLatLngs.length > 1) {
            for(let index = 0; index < objectLatLngs.length; index++) {
              if (this._pointsClose(event.latlng, objectLatLngs[index])) {
                let keepPoint = totalPoints === 4? (index + 2) % totalPoints : (index + 1) % totalPoints;
                this._points = [objectLatLngs[keepPoint]];
                foundPoint = true;
                break;
              }
            }
          }
          map.removeLayer(this._mapElement);  
          if (foundPoint) {
            this._drawMapObject(L, map, event.latlng);
            this._editingObject = true;
          } else {
            this._callbacks.removeMapObject(this);
          }
        }
      }
      this._callbacks.setIgnoreNextClick();
    });

    if (lastMapElement) {
      map.removeLayer(lastMapElement);
    }
    
    this._mapElement.addTo(map);
    this._createTooltip(map);
  }

  createOnMap = function(L, map, targetPoint = undefined) {
    switch(this._type) {
      case modeType.POINT:
        this._createMarker(L, map);
        return;
      case modeType.LINE:
      case modeType.RECTANGLE:
        this._drawMapObject(L, map, targetPoint);
        return;
    }
  }
}

export class Marker extends MapObject {
  constructor (points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super();
    this._type = modeType.POINT;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._editingObject - false;
    this._callbacks = callbacks;
  }
}

export class Line extends MapObject {
  constructor (points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super();
    this._type = modeType.LINE;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._editingObject = this._points.length < 2;
    this._callbacks = callbacks;
    if (this._points.length < 2) {
      this._editingObject = true;
    }
  }
}

export class Rectangle extends MapObject {
  constructor (points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super();
    this._type = modeType.RECTANGLE;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._editingObject = this._points.length < 2;
    this._callbacks = callbacks;
    if (this._points.length < 2) {
      this._editingObject = true;
    }
  }
}
