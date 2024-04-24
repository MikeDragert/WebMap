import {
  modeType,
  LONGCLICKMINTIME,
  TOOLTIPTEXTDEFAULT,
  EDITINGCOLOR,
  FINISHEDCOLOR,
  MapObject } from './mapObjects.js';

// a super class to represent any object based on two points
export class TwoPointObject extends MapObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map);
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._callbacks = callbacks;
    this._editing = true;
  }

  // get the centerpoint of the mapObject
  getCenterPoint = function() {
    if (this._points.length <= 1) {
      return undefined;
    }
    let centerPoint = new this._L.LatLng(
      this._points[0].lat + (this._points[1].lat-this._points[0].lat)/2, 
      this._points[0].lng + (this._points[1].lng-this._points[0].lng)/2
    );
    
    return centerPoint;
  }

  _hasEnoughPoints = function(targetPoints) {
    return targetPoints.length > 1;
  }

  // allocate one specific map object
  // to be overridden
  _allocateSpecificMapObject = function(targetPoints, objectColor){
    return undefined;
  }

  // allocate one two-point map object
  _allocateMapObject = function(targetPoint = undefined) {
    let targetPoints = this._getTargetDrawPoints(targetPoint);
    if (this._hasEnoughPoints(targetPoints)) {
      const objectColor = this._editing ? EDITINGCOLOR : FINISHEDCOLOR;
      return this._allocateSpecificMapObject(targetPoints, objectColor)
    }
    return undefined;
  }

  // finish the draw of the object by adding second point
  _mouseFinishDraw = function(self, location) {
    self._points.push(location);
    self._map.removeLayer(self._mapElement);          
    self.createOnMap();
  }

  // finish the move of the object
  _mouseFinishMoving = function(self) {
    self._moving = false;
    self._callbacks.setIgnoreNextClick();
  }

  // try to determine if a corner was clicked on
  // and if so, what is the point that we want to keep on the object
  _mouseFindCornerClicked = function(self, location) {
    let objectLatLngs = [];
    if (self._type === modeType.LINE) {
      objectLatLngs = self._mapElement.getLatLngs();
    }
    if (self._type === modeType.RECTANGLE) {
      objectLatLngs = self._mapElement.getLatLngs()[0];
    }
    if (objectLatLngs.length > 1) {
      for(let index = 0; index < objectLatLngs.length; index++) {
        if (self._pointsClose(location, objectLatLngs[index])) {
          return {
            foundCorner: true, 
            keepPoint: objectLatLngs[
              objectLatLngs.length === 4? 
              (index + 2) % objectLatLngs.length : 
              (index + 1) % objectLatLngs.length
            ]
          };
        }
      }
    }
    return { foundCorner: false, keepPoint: undefined};
  }

  // mouse up handler for mapObject
  _mouseUpHandler = function(event, self) {
    if (self._mapElement === event.sourceTarget) {
      let stillDrawing = self._points.length !== 2;

      if (stillDrawing) {
       this._mouseFinishDraw(self, event.latlng);
      } else {
        if (self._moving) {
          self._mouseFinishMoving(self);
        } else {
          if (self._editing) {
            let {foundCorner, keepPoint} = self._mouseFindCornerClicked(self, event.latlng);
            if (foundCorner) {
              self._points = [keepPoint];
              self.createOnMap(event.latlng)
            } else if (new Date() - self._mouseDownTime > LONGCLICKMINTIME) {
              self._moving = true;
              self._callbacks.setIgnoreNextClick();
            } else {
              self.toggleEdit();
              self._callbacks.setIgnoreNextClick();
            }
          } else {
            self.toggleEdit();
          }
        }
      }
    } 
  }

  // create this mapObject on the map
  createOnMap = function(targetPoint = undefined) {
    let targetPoints = [...this._points];
    if ((targetPoints.length === 1) && (targetPoint instanceof this._L.LatLng)) {
      targetPoints.push(targetPoint);
    }
    if (!this._hasEnoughPoints(targetPoints)) {
      return;
    }
    let lastMapElement = this._mapElement;    
    this._mapElement = this._allocateMapObject(targetPoint);
    if (!this._mapElement) {
      return;
    }
    this._mapElement.on('mousedown', (event) =>  this._mouseDownHandler(event, this));
    this._mapElement.on('mouseup', (event) => this._mouseUpHandler(event, this));
    if (lastMapElement) {
      this._map.removeLayer(lastMapElement);
    }
    this._mapElement.addTo(this._map);
    this._createTooltip();
  }
}