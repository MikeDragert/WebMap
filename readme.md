# A Leaflet Map

This is a jQuery page that uses leaflet to allow the user to mark points, lines, or rectangles directly on the map.

# Usage Instructions

Upon loading you should be shown a map of your location (if you allow permissions).  You can navigate the map as you would normally expect.  In the top left, under the title, you have three buttons for your draw options. 

  - Marker
  - Line
  - Rectangle

Select the button for what you wish to add, and then left click on the map.  For lines and rectangles, you will have to click again to finish the object.  Once you create the object, you will be in editing mode (green).  While in editing mode, you can do the following.
  - Type to set the text for the object
  - Enter finishes editing the object
  - Shift-Enter adds a new line to the text for the object
  - Click on the ends of a line, or corners of a object to resize
    (Note: in current version this click has to be on the object)
  - Long click on the object to pick it up and move it.  Click again to place in new spot
  - Backspace to delete a character
  - Delete to delete the object
  - Escape while drawing to cancel the line or rectangle

As you create objects, their text will be shown to the left side of the map, under the search box.  You may type in the search box and press enter to search all the object texts for one of the matching keywords.  You can clear the search by entering a blank search, or by clicking X on the show searched words.

In the list of map object texts, you can click on any of them to be moved to that object on the map.

# Notes

The following are notes and ideas for future:

- There is no saving of your created map objects.  When you reload it will start fresh.  We could save the objects create in local storage or cookies for reloading on the same computer. For the best experience, we could have password protected logins, and save the create objects on the backend (for example in a database), so that the user can access their created objects from any computer they log in to.
- The detection of click on corners/ends is based on a latitude/longitude window.  This is not necessarily a great experience depending on your zoom level.  Ideally this should be done by pixels instead.  Or, we should update the latitude/longitude window accordingly to work well with each zoom level.
- It would be good to have handles (small squares) on the end/corners of the currently editing map item.
- It would be good to treat a click on the map that is very close to an object, as if it was an actual click on the object.  This would make it easier to select lines.


# Requirements

This was create with node.  The following npm packages are requied.
 - express: 4.19.2
 - jquery: 3.7.1
 - leaflet: 1.9.4

 # Screenshot

 ![screenshot](https://github.com/MikeDragert/WebMap/blob/master/Screenshots/Leaflet%20Screenshot.png?raw=true)