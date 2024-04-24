import {
  modeType,
  LONGCLICKMINTIME,
  TOOLTIPTEXTDEFAULT,
  FINISHEDICONURL,
  EDITINGICONURL,
  MapObject } from './mapObjects.js';

// Marker mapObject
export class Marker extends MapObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map);
    this._type = modeType.POINT;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._editing = true;
    this._callbacks = callbacks;
  }

  _hasEnoughPoints = function(targetPoints) {
    return targetPoints.length > 0;
  }

  // mouse up handler
  _mouseUpHandler = function(event, self) {
    if (self._moving) {
      self._moving = false;
    } else if (new Date() - self._mouseDownTime > LONGCLICKMINTIME) {
      self._moving = true;
    } else {
      if (self._mapElement === event.sourceTarget) {
        self.toggleEdit(self._L, self._map);
      }
    }
  }
  
  // allocate one Marker object
  _allocateMapObject = function(targetPoint = undefined) {
    if (this.type === modeType.POINT) {
      let iconUrl = this._editing? EDITINGICONURL: FINISHEDICONURL;
      return this._L.marker(this._points[0], { icon: new this._L.Icon({iconUrl: iconUrl, iconSize: [25, 41], iconAnchor: [12, 41]})});
    }
    return undefined;
  }

  // create this marker on the map
  createOnMap = function() {
    if (!this._hasEnoughPoints(this._points)) {
      return;
    }
    if (this._type === modeType.POINT) {
      let lastMapElement = this._mapElement;
      this._mapElement = this._allocateMapObject();
      this._mapElement.on('mousedown', (event) =>  this._mouseDownHandler(event, this));
      this._mapElement.on('mouseup', (event) => this._mouseUpHandler(event, this));
      this._mapElement.addTo(this._map);
      if (lastMapElement) {
        this._map.removeLayer(lastMapElement);
      }
      this._createTooltip();
    }
  }
}
