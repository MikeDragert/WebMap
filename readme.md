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

- There is no saving of your created map objects.  When you reload it will start fresh.  We could save the objects created in local storage or cookies for reloading on the same computer. For the best experience, we could have password protected logins, and save the create objects on the backend (for example in a database), so that the user can access their created objects from any computer that they log in to.
- The detection of click on corners/ends is based on a latitude/longitude window.  This is not necessarily a great experience depending on your zoom level.  Ideally this should be done by pixels instead, so that they are not affected by zoom.  Or, we could update the latitude/longitude window accordingly to work well with each zoom level.
- It would be good to have handles (small squares) on the end/corners of the currently editing map item.
- It would be good to treat a click on the map that is very close to an object, as if it was an actual click on the object.  This would make it easier to select lines.
- We could explore other types of objects. 
  - Circle
  - Non-uniform polygons, for marking custom areas.

# Follow-up Notes

Imagine following scenario.  We have been asked allow for multiple features to be associated with a block of text and to allow for multiple text blocks to be associated with a feature. 

The current design assumes one text block per map item in a 1-1 relationship.  This allowed a simpler design by having a mapOjbect class that contained one and only one text block.  However, we are not being asked to use a many to many relationship instead.

We would start by changing the program to keep two seperate lists.  Right now it has a list of map objects (and the text is included in that).  Instead the text blocks would be removed from the mapObject, and instead create as separate objects (noting the latitude, longitude of the text block) and saved in a separate list.

Each map object will need to keep a list of text blocks that are associated with it.  And each text block will need to keep a list of map objects that it is associated with.  These two lists will need to be kept in sync.  This adds extra complexity to the program to manage.  Consider the following use cases.

Use cases:

Create a map object (marker, line, rectangle, etc). 
  - We may want to auto create a marker. It is expected most map objects will have a text box.  If not, then they would have to delete the auto text box.
    - In this case, the program would create the text box as well.
    - The new map object adds the text box to it's list
    - The text box adds the map object to it's list

Create a new text box
  - Users will need to be able to create a new text box
  - this text box would not be associated with any map object

Join a map object to a text box (or vice versa)
  - Add the text box to the map objects list
  - Add the map object to the text boxes list
  - Should be considered so that this is easy and intuitive

Break apart map objects and text boxes
  - Need to remove the text box from the map objects list
  - Need to remove the map object from the text boxes list
  - Should be considered so that this is easy and intuitive

Delete a text box
  - Go through each map object connected to the text box
    - Remove the text box from each objects list
  - Delete the text box from the text box list
  - Remove display of text box from the map

Delete a map object
  - Go through each text box connected to the map object
    - Remove the map object from each text box
    - Consider deleting the text box too, if there are no other map objects attached
  - Delete the map object from the map object list
  - Remove display of map object from the map

Moving Objects on the map
  - Move map object.  We may want to move the text box (depending on what other objects it's attached to)
  - Move text box.  This likely would not result in a move of the map object.

Clicking on a text in the sidebar list
  - This would take the user to the location of the text box 

--text
--diagrams
--design considerations
--approach

# Installation

- run npm i
- you may want to install "nodemon" as well
- with nodemon
  - "npm run local" to run

# Requirements

This was create with node.  The following npm packages are requied.
 - express: 4.19.2
 - jquery: 3.7.1
 - leaflet: 1.9.4
 - nodemon: 3.1.0

 # Screenshot

 ![screenshot](https://github.com/MikeDragert/WebMap/blob/master/Screenshots/Leaflet%20Screenshot.png?raw=true)