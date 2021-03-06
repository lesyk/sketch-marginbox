var onRun = function(context) { // eslint-disable-line

  @import 'common.js';

  //
  // Functions
  //

  // Get min value from array
  const min = arr => Math.min.apply(Math, arr);
  // Min (y) pos from layers
  const minY = layers => min(layers.slice().map(layer => layer.frame().y()));
  // Min (x) pos from layers
  const minX = layers => min(layers.slice().map(layer => layer.frame().x()));
  // Get layers bounds
  const getLayerBounds = layers => MSLayerGroup.groupBoundsForContainer(
    MSLayerArray.arrayWithLayers(layers)).size;
  // Get all children of selection
  const getChildrenOfSelection = (selection) => {
    const all = [];
    let childs = [];
    for (let i = 0; i < selection.length; i += 1) {
      if(selection[i].class() == 'MSLayerGroup') {
        childs = selection[i].children();
        for (let j=0; j<childs.length; ++j) {
          all.push(childs[j])
        }
      }
    }
    return all;
  }
  // Create rectangle type layer
  const createRectLayer = (name, x, y, width, height, parent) => {
    if(parent.class() == 'MSLayerGroup') {
      const rectShape = MSRectangleShape.alloc().init();
      rectShape.frame = MSRect.rectWithRect(NSMakeRect(x,y,width,height));
      const shapeGroup = MSShapeGroup.shapeWithPath(rectShape);
      shapeGroup.name = name;
      parent.addLayers([shapeGroup]);
      return shapeGroup;
    }
  }
  // Extract margin values from layer name
  const fourValuesFromString = str => {
    const cleanValues = str.toLowerCase().split(/:/g).pop().trim().replace(/\s+/g, " ")
    const singleFormat = cleanValues.match(/[A-z]\d+/g)
    const margin = [0, 0, 0, 0]
    if (singleFormat) {
      for (let i = 0; i < singleFormat.length; i += 1) {
        if (singleFormat[i][0] == "t") { margin[0] = singleFormat[i].slice(1, 99)}
        if (singleFormat[i][0] == "r") { margin[1] = singleFormat[i].slice(1, 99)}
        if (singleFormat[i][0] == "b") { margin[2] = singleFormat[i].slice(1, 99)}
        if (singleFormat[i][0] == "l") { margin[3] = singleFormat[i].slice(1, 99)}
      }
      return margin.map(x => Number(x))
    } else {
      const cssFormat = cleanValues.split(/\s/g)
      if (cssFormat.length == 1) {
        margin[0] = cssFormat[0];
        margin[1] = cssFormat[0];
        margin[2] = cssFormat[0];
        margin[3] = cssFormat[0];
      }
      if (cssFormat.length == 2) {
        margin[0] = cssFormat[0];
        margin[2] = cssFormat[0];
        margin[1] = cssFormat[1];
        margin[3] = cssFormat[1];
      }
      if (cssFormat.length == 4) {
        margin[0] = cssFormat[0];
        margin[1] = cssFormat[1];
        margin[2] = cssFormat[2];
        margin[3] = cssFormat[3];
      }
      return margin.map(x => Number(x))
    }
  }


  //
  // Consts
  //

  const MARGIN_LAYER_NAME = 'marginbox';
  const MARGIN_BORDER_COLOR = { r:255, g:0, b:128, a:0.5 };
  const MARGIN_FILL_COLOR = { r:255, g:0, b:128, a:0.05 };
  const MARGIN_BORDER_THICKNESS = 1;

  //
  // Main
  //

  // User seleccion
  const selection = context.selection;
  const allChildren = getChildrenOfSelection(selection);
  const justGroups = allChildren.slice().filter(layer => layer.class() == 'MSLayerGroup');

  for (let i=0; i<justGroups.length; ++i) {
    const keyLayer = justGroups[i];
    const childsOfKeyLayer = keyLayer.layers();

    // Marginbox layer
    var marginbox = findLayersByName(MARGIN_LAYER_NAME, childsOfKeyLayer).firstObject();

    // Filter marginbox layer
    const validLayers = childsOfKeyLayer.slice().filter(layer => layer.name() != MARGIN_LAYER_NAME);

    // Boundingbox of all child layers
    const bounds = getLayerBounds(validLayers);
    const heightBoundingBox = bounds.height;
    const widthBoundingBox = bounds.width;

    if(marginbox == null) {
      marginbox = createRectLayer (MARGIN_LAYER_NAME, 0, 0, 1, 1, keyLayer);
      MSLayerMovement.moveToBack([marginbox]);

      // Add fill
      marginbox.style().addStylePartOfType(0);
      // Add border
      marginbox.style().addStylePartOfType(1);
      // Get fill
      const originalFill = marginbox.style().fills().firstObject();
      // Get border
      const originalBorder = marginbox.style().borders().firstObject();
      // Set fill
      const marginFillColor = MSColor.colorWithRed_green_blue_alpha(
        MARGIN_FILL_COLOR.r, MARGIN_FILL_COLOR.g, MARGIN_FILL_COLOR.b, MARGIN_FILL_COLOR.a
      );
      originalFill.color = marginFillColor;
      // Set border
      const marginBorderColor = MSColor.colorWithRed_green_blue_alpha(
        MARGIN_BORDER_COLOR.r, MARGIN_BORDER_COLOR.g, MARGIN_BORDER_COLOR.b, MARGIN_BORDER_COLOR.a
      );
      originalBorder.color = marginBorderColor;
      originalBorder.thickness = MARGIN_BORDER_THICKNESS;
      originalBorder.position = 1;
    }

    // Reset marginbox layer positions
    marginbox.frame().y = minY(validLayers);
    marginbox.frame().x = minX(validLayers);

    // Get margin values
    const mData = fourValuesFromString(keyLayer.name());

    if (
      mData[0] == 0 && mData[1] == 0 && mData[2] == 0 && mData[3] == 0 ||
      isNaN(mData[0]) && isNaN(mData[1]) && isNaN(mData[2]) && isNaN(mData[3])
    ) {
      if(marginbox) {
        keyLayer.removeLayer(marginbox);
      }
    }

    // Marginbox position
    marginbox.frame().y = marginbox.frame().y() - mData[0];
    marginbox.frame().x = marginbox.frame().x() - mData[3];
    marginbox.frame().height = heightBoundingBox + mData[0] + mData[2];
    marginbox.frame().width = widthBoundingBox + mData[1] + mData[3];

    // Fit size group
    keyLayer.resizeToFitChildrenWithOption(true);
  }

  // Select the first selection layers
  context.document.currentPage().deselectAllLayers();
  for(let i=0, len=selection.length; i<len; ++i) {
    selection[i].select_byExpandingSelection(true, true);
  }
  log("LOL")
}
