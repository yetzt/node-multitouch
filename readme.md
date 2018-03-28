# multitouch

read touch pointers from a sharp signage tpc-ic multitouch usb screen bezel via `node-hid`.

## usage

``` javascript

var multitouch = require("multitouch");

multitouch().on("data", function(data){
	
	console.log(data);
	
});

```

## data format


``` javascript
[ 
	<bool touching>, // true if touching
	<int pointerid>, // 0-49, id of pointer
	<int x>,         // 0-15360, from left
	<int y>,         // 0-8640, from top
	<int a>,         // 0-255, probably area or intensity
	<int b>,         // 0-3, probably area or intensity
	<int n>,         // 1-50, total number of current pointers
	<int s>,         // 0-~9000, sequential number
	<int t>,         // unix offset timestamp
 ]
```

## events

### `data`

raw pointer data

### `start`

pointer touching changed to true

### `end`

pointer touching changed to false

### `pointers`

array of all pointers

### `raw`

raw driver data

