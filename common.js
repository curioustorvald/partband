function loadJson(jsonPath, callback) {
  let xobj = new XMLHttpRequest()
  xobj.overrideMimeType("application/json")
  xobj.open('GET', jsonPath, true)
  xobj.onreadystatechange = function () {
    if (xobj.readyState == 4 && xobj.status == "200") {
      // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
      callback(xobj.responseText)
    }
  }
  xobj.send(null)
}

function generateRandomSeq(seed, size) {
  let ret = []
  let v = seed
  for (let i = 0; i < size; i++) {
    v = ((v * 69069) + 1) % 65536
    if (v < 0) v = -v
    ret.push(v)
  }
  return ret
}

Array.prototype.randomPop = function() {
  // Return undefined if array is empty
  if (this.length === 0) {
      return undefined;
  }

  // Generate random index
  const randomIndex = Math.floor(Math.random() * this.length);

  // Remove and return the element at random index
  return this.splice(randomIndex, 1)[0];
};

Array.prototype.randomPick = function() {
  // Return undefined if array is empty
  if (this.length === 0) {
      return undefined;
  }

  // Generate random index
  const randomIndex = Math.floor(Math.random() * this.length);

  return this[randomIndex]
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function coerceIn(x, low, high) {
  return Math.min(Math.max(x, low), high)
}

function removeAll(arr, itemsToRemove) {
  const removeSet = new Set(itemsToRemove);
  return arr.filter(item => !removeSet.has(item));
}

Array.prototype.removeElem = function(elem) {
  const index = this.indexOf(elem); // finds first occurrence
  if (index > -1) {
    this.splice(index, 1); // removes 1 element at index
  }
}

///////////////////////////////////////////////////////////


function aspectRatio(image) {
  return image.width / image.height;
}

function selectRuleSet(image) {
  const imageAspectRatio = image.ratio // larger = wider

  // wide
  if (imageAspectRatio > 1.4) return ['A', 'B']
  // standard
  else if (0.77 <= imageAspectRatio && imageAspectRatio <= 1.4) return ['C', 'D']
  // narrow
  else return ['E1', 'E2', 'F1', 'F2', 'G', 'H', 'I', 'D']
}

function computeBandHeight(images, rule, containerWidth) {
  const mainImage = images[0];
  let mainCols = 2, mainRows = 1;
  switch (rule) {
    case 'A': case 'B': mainCols = 2; mainRows = 2; break;
    case 'C': case 'D': mainCols = 2; mainRows = 3; break;
    case 'E1': case 'E2': mainCols = 1; mainRows = 2; break;
    case 'F1': case 'F2': case 'H': mainCols = 1; mainRows = 2; break;
    case 'G': mainCols = 1; mainRows = 2; break;
    case 'I': mainCols = 1; mainRows = 2; break;
  }
  const colWidth = containerWidth * (mainCols / 3);
  const height = colWidth / mainImage.ratio / mainRows;
  //return Math.max(100, Math.min(400, height));
  return height;
}

Object.prototype.setColRow = function(cols, rows) {
  this.style.gridTemplateColumns = '1fr '.repeat(cols).trim()
  this.style.gridTemplateRows = '1fr '.repeat(rows).trim()
}

class PartitionedBand {
  DEBUG = 1


  prefix = ''
  mainPanel = document.createElement('bandpanel')
  subPanel = document.createElement('bandpanel')
  #images = []
  flipped = false
  picturePanels = []
  panelLetters = []

  resizeHandles = {}
  // Adjustment factors for panel sizes (0.5 = default, <0.5 shrinks first panel, >0.5 grows it)
  resizeFactors = {}


  subPanelWidthPerc = {} // alphabet to number. Remains empty until adjustBandPartitioning is called. 0-1
  subPanelHeightPerc = {} // alphabet to number. Remains empty until adjustBandPartitioning is called. 0-1

  mainPanelWidthPerc = 0 // percentage. 0-100
  mainPanelWidth = 0 // pixels
  height = 0 // pixels
  #isThreeCol = false

  rule = ''

  #createLeafPanel(panel) {
    let r = document.createElement('bandpanel')
    r.className = 'leaf'
    if (this.DEBUG) {
      r.setAttribute('panel', panel)
    }
    return r
  }

  #createIntermediatePanel() {
    let r = document.createElement('bandpanel')
    return r
  }

  #createResizeHandle(panelA, panelB) {
    const handleId = `${panelA.getAttribute?.('panel') || 'unknown'}-${panelB.getAttribute?.('panel') || 'unknown'}`;

    // Initialize resize factor to 0.5 (equal split)
    this.resizeFactors[handleId] = 0.5;

    return {
      // Function to set the resize ratio (0.0 to 1.0)
      // 0.0 = panelA gets 0%, panelB gets 100%
      // 0.5 = equal split (50%-50%)
      // 1.0 = panelA gets 100%, panelB gets 0%
      setRatio: (ratio) => {
        this.resizeFactors[handleId] = coerceIn(ratio, 0.05, 0.95); // Prevent complete collapse
        this.#updatePanelSizes(panelA, panelB, handleId);
      },

      // Function to get current ratio
      getRatio: () => {
        return this.resizeFactors[handleId];
      },

      // Function to adjust ratio by delta (-1.0 to 1.0)
      adjustRatio: (delta) => {
        const currentRatio = this.resizeFactors[handleId];
        const newRatio = coerceIn(currentRatio + delta, 0.05, 0.95);
        this.resizeFactors[handleId] = newRatio;
        this.#updatePanelSizes(panelA, panelB, handleId);
        return newRatio;
      },

      // Get handle ID for debugging/identification
      getId: () => handleId
    };
  }

  #updatePanelSizes(panelA, panelB, handleId) {
    const ratio = this.resizeFactors[handleId];

    // Determine if panels are arranged horizontally or vertically
    const parentGrid = panelA.parentElement;
    if (!parentGrid) return;

    const isHorizontal = parentGrid.style.gridTemplateColumns.split(' ').length > 1;

    if (isHorizontal) {
      // Horizontal arrangement - adjust column sizes
      const colA = `${ratio}fr`;
      const colB = `${1 - ratio}fr`;

      // Find positions of panels in the grid
      const children = Array.from(parentGrid.children);
      const indexA = children.indexOf(panelA);
      const indexB = children.indexOf(panelB);

      if (indexA !== -1 && indexB !== -1) {
        const cols = parentGrid.style.gridTemplateColumns.split(' ');
        cols[indexA] = colA;
        cols[indexB] = colB;
        parentGrid.style.gridTemplateColumns = cols.join(' ');
      }
    } else {
      // Vertical arrangement - adjust row sizes
      const rowA = `${ratio}fr`;
      const rowB = `${1 - ratio}fr`;

      // Find positions of panels in the grid
      const children = Array.from(parentGrid.children);
      const indexA = children.indexOf(panelA);
      const indexB = children.indexOf(panelB);

      if (indexA !== -1 && indexB !== -1) {
        const rows = parentGrid.style.gridTemplateRows.split(' ');
        rows[indexA] = rowA;
        rows[indexB] = rowB;
        parentGrid.style.gridTemplateRows = rows.join(' ');
      }
    }
  }

  #addPicturePanel(panel, letter) {
    this.picturePanels.push(panel)
    this.panelLetters.push(letter)
  }

  constructor(prefix, rule, flip, images) {
    this.prefix = prefix
    this.mainPanel.setColRow(1, 1)
    this.mainPanel.className = 'main leaf'
    this.mainPanel.setAttribute('panel', 'A')
    this.subPanel.setColRow(1, 1)
    this.subPanel.className = 'sub'
    this.picturePanels.push(this.mainPanel) // index 0
    this.panelLetters.push('A')
    this.resizeHandles['A-B'] = this.#createResizeHandle(this.mainPanel, this.subPanel)
    this.flipped = flip
    this.rule = rule

    let panelB, panelC, panelD, panelE, panelBD, panelCD, panelCE, panelBC, panelDE;

    switch(rule) {
      case 'A':
        this.#addPicturePanel(this.subPanel, 'B')
        this.subPanel.className = 'sub leaf'
        this.subPanel.setAttribute('panel', 'B')
        break;

      case 'B': case 'C': case 'H':
        this.isThreeCol = ('H' == rule)
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        this.subPanel.setColRow(1, 2)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        break;

      case 'D':
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        this.subPanel.setColRow(1, 3)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.subPanel.appendChild(panelD)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelD, 'D')
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        this.resizeHandles['C-D'] = this.#createResizeHandle(panelC, panelD)
        break;

      case 'E1':
        this.isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelE = this.#createLeafPanel('E')
        panelBD = this.#createIntermediatePanel(); panelBD.setColRow(1, 2)
        panelCE = this.#createIntermediatePanel(); panelCE.setColRow(1, 2)
        this.subPanel.setColRow(2, 1)
        panelBD.appendChild(panelB);panelBD.appendChild(panelD)
        panelCE.appendChild(panelC);panelCE.appendChild(panelE)
        this.subPanel.appendChild(panelBD)
        this.subPanel.appendChild(panelCE)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelD, 'D')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelE, 'E')
        this.resizeHandles['B-D'] = this.#createResizeHandle(panelB, panelD)
        this.resizeHandles['C-E'] = this.#createResizeHandle(panelC, panelE)
        this.resizeHandles['BD-CE'] = this.#createResizeHandle(panelBD, panelCE)
        break;

      case 'E2':
        this.isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelE = this.#createLeafPanel('E')
        panelBC = this.#createIntermediatePanel(); panelBC.setColRow(2, 1)
        panelDE = this.#createIntermediatePanel(); panelDE.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelBC.appendChild(panelB);panelBC.appendChild(panelC)
        panelDE.appendChild(panelD);panelDE.appendChild(panelE)
        this.subPanel.appendChild(panelBC)
        this.subPanel.appendChild(panelDE)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelD, 'D')
        this.#addPicturePanel(panelE, 'E')
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        this.resizeHandles['D-E'] = this.#createResizeHandle(panelD, panelE)
        this.resizeHandles['BC-DE'] = this.#createResizeHandle(panelBC, panelDE)
        break;

      case 'F1':
        this.isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelCD = this.#createIntermediatePanel(); panelCD.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelCD.appendChild(panelC);panelCD.appendChild(panelD)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelCD)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelD, 'D')
        this.resizeHandles['C-D'] = this.#createResizeHandle(panelC, panelD)
        this.resizeHandles['B-CD'] = this.#createResizeHandle(panelB, panelCD)
        break;

      case 'F2':
        this.isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelBC = this.#createIntermediatePanel(); panelBC.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelBC.appendChild(panelB);panelBC.appendChild(panelC)
        this.subPanel.appendChild(panelBC)
        this.subPanel.appendChild(panelD)
        this.#addPicturePanel(panelD, 'D')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelB, 'B')
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        this.resizeHandles['BC-D'] = this.#createResizeHandle(panelBC, panelD)
        break;

      case 'G':
        this.isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelBD = this.#createIntermediatePanel(); panelBD.setColRow(1, 2)
        this.subPanel.setColRow(2, 1)
        panelBD.appendChild(panelB);panelBD.appendChild(panelD)
        this.subPanel.appendChild(panelBD)
        this.subPanel.appendChild(panelC)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelD, 'D')
        this.resizeHandles['B-D'] = this.#createResizeHandle(panelB, panelD)
        this.resizeHandles['BD-C'] = this.#createResizeHandle(panelBD, panelC)
        break;

      case 'I':
        this.isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        this.subPanel.setColRow(2, 1)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        break;
    }

    // fill in subPanelHeightPerc
    switch (this.rule) {
      case 'A': case 'I':
        this.subPanelHeightPerc.B = 1.0
        this.subPanelHeightPerc.C = 1.0
        break;
      case 'B': case 'C': case 'E1': case 'E2': case 'F1': case 'F2': case 'H':
        this.subPanelHeightPerc.B = 0.5
        this.subPanelHeightPerc.C = 0.5
        this.subPanelHeightPerc.D = 0.5
        this.subPanelHeightPerc.E = 0.5
        break;
      case 'D':
        this.subPanelHeightPerc.B = 1.0 / 3.0
        this.subPanelHeightPerc.C = 1.0 / 3.0
        this.subPanelHeightPerc.D = 1.0 / 3.0
        break;
      case 'G':
        this.subPanelHeightPerc.B = 0.5
        this.subPanelHeightPerc.C = 1.0
        this.subPanelHeightPerc.D = 0.5
        break;
    }

    if (images) {
      this.putImages(images)
    }
  }
  putImages(imgs) {
    //console.log("putImages", imgs)
    this.picturePanels.forEach((panel, i) => {
      if (imgs[i]) {
        //panel.style.backgroundImage = `url(${imgs[i].src})` // adjust to fit the actual data structure
        let imgURL = `https://cdn.taimuworld.com/${this.prefix}_thumbs/${imgs[i].ord}.webp`
        panel.style.backgroundImage = `url(${imgURL})` // adjust to fit the actual data structure
      }
    })

    this.#images = imgs
  }

  // Calculate aspect ratio error for a panel given its dimensions and image
  #calculatePanelError(panelIndex, panelWidth, panelHeight) {
    if (!this.#images[panelIndex]) return 0;

    const imageRatio = this.#images[panelIndex].ratio;
    const panelRatio = panelWidth / panelHeight;
    const error = Math.abs(imageRatio - panelRatio);
    return error * error; // Squared error for RMS calculation
  }

  // Calculate total RMS error for all panels in the band
  calculateRMSError() {
    let totalSquaredError = 0;
    let panelCount = 0;

    // Calculate error for main panel (A)
    const mainPanelWidth = this.mainPanelWidth;
    const mainPanelHeight = this.height;
    totalSquaredError += this.#calculatePanelError(0, mainPanelWidth, mainPanelHeight);
    panelCount++;

    // Calculate error for sub panels
    for (let i = 1; i < this.picturePanels.length; i++) {
      const panelLetter = this.panelLetters[i];
      const panelWidth = INTERNAL_WIDTH * this.subPanelWidthPerc[panelLetter];
      const panelHeight = this.height * this.subPanelHeightPerc[panelLetter];

      totalSquaredError += this.#calculatePanelError(i, panelWidth, panelHeight);
      panelCount++;
    }

    return Math.sqrt(totalSquaredError / panelCount);
  }

  adjustForEvenFit() {
    // Implementation for optimizing panel ratios to minimize RMS error
    // This uses a simple hill-climbing approach to adjust resize handles

    const MAX_ITERATIONS = 50;
    const STEP_SIZE = 0.02; // 2% adjustment per step
    const MIN_IMPROVEMENT = 0.001; // Stop if improvement is less than this

    // Get current RMS error
    let currentError = this.calculateRMSError();
    let bestError = currentError;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
      let improved = false;

      // Try adjusting each resize handle
      for (const handleId in this.resizeHandles) {
        const handle = this.resizeHandles[handleId];
        console.log(handle)
        const originalRatio = handle.getRatio();

        // Try increasing the ratio
        handle.setRatio(originalRatio + STEP_SIZE);
        let newError = this.calculateRMSError();

        if (newError < bestError - MIN_IMPROVEMENT) {
          bestError = newError;
          improved = true;
        } else {
          // Try decreasing the ratio
          handle.setRatio(originalRatio - STEP_SIZE);
          newError = this.calculateRMSError();

          if (newError < bestError - MIN_IMPROVEMENT) {
            bestError = newError;
            improved = true;
          } else {
            // No improvement, revert to original
            handle.setRatio(originalRatio);
          }
        }
      }

      // If no handle adjustment improved the error, we're done
      if (!improved) {
        break;
      }
    }

    // TODO Update panel dimensions after optimization

  }
  #heightfun(imgRatio) {
    const MAX = 0.5 * (4/3) * INTERNAL_WIDTH
    const MIN = 0.5 / (4/3) * INTERNAL_WIDTH
    return coerceIn(1 / (2*imgRatio) * INTERNAL_WIDTH, MIN, MAX)
  }
  adjustBandPartitioning() {
    let mainImageRatio = this.#images[0].ratio
    let targetWidth = (this.#isThreeCol) ?
        (INTERNAL_WIDTH * 0.7 * mainImageRatio) :
        (INTERNAL_WIDTH * 0.5 * mainImageRatio)

    this.height = Math.round(this.#heightfun(INTERNAL_WIDTH, mainImageRatio))|0
    let widthPx = this.height * mainImageRatio
    this.mainPanelWidth = widthPx
    this.mainPanelWidthPerc = widthPx / INTERNAL_WIDTH * 100

    // fill in subPanelWidthPerc
    switch (this.rule) {
      case 'A': case 'B': case 'C': case 'D': case 'H':
        this.subPanelWidthPerc.B = 1.0 - (widthPx / INTERNAL_WIDTH)
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.B
        this.subPanelWidthPerc.D = this.subPanelWidthPerc.B
        break;
      case 'E1': case 'E2': case 'G': case 'I':
        this.subPanelWidthPerc.B = (1.0 - (widthPx / INTERNAL_WIDTH)) / 2
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.B
        this.subPanelWidthPerc.D = this.subPanelWidthPerc.B
        this.subPanelWidthPerc.E = this.subPanelWidthPerc.B
        break;
      case 'F1':
        this.subPanelWidthPerc.B = 1.0 - (widthPx / INTERNAL_WIDTH)
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.B / 2
        this.subPanelWidthPerc.D = this.subPanelWidthPerc.B / 2
        break;
      case 'F2':
        this.subPanelWidthPerc.D = 1.0 - (widthPx / INTERNAL_WIDTH)
        this.subPanelWidthPerc.B = this.subPanelWidthPerc.D / 2
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.D / 2
        break;
    }
  }
  makeHTMLelement() {
    const container = document.createElement('band');
    if (!this.flipped) {
      container.appendChild(this.mainPanel)
      container.appendChild(this.subPanel)
    }
    else {
      container.appendChild(this.subPanel)
      container.appendChild(this.mainPanel)
    }
    container.style.height = `${this.height}px`
    if (this.DEBUG) {
      container.setAttribute('rule', this.rule)
    }
    this.mainPanel.style.width = `${this.mainPanelWidthPerc}%`
    this.subPanel.style.width = `${100 - this.mainPanelWidthPerc}%`
    return container
  }
}

function constructPartition(label) {

}

function panel(image, col, row, flip) {
  const div = document.createElement('div');
  div.className = 'panel';
  div.style.gridColumn = flip ? (4 - col) : col;
  div.style.gridRow = row;
  div.style.backgroundImage = `url(${image.src})`;
  return div;
}

let bandCount = 1
function makeBandClass(prefix, rule, height) {
  const flip = bandCount % 2 === 0;
  const bandClass = new PartitionedBand(prefix, rule, flip)
  return bandClass
}

function clipfun(x0) {
  const clip_p = 0.444
  const clip_p1 = Math.sqrt(1.0 - 2.0 * clip_p)
  const clip_lim = 1.0 / (1.0 + clip_p1)

  let x = x0 * (1.0 + clip_p1) / 2.0
  let t = 0.5 * clip_p1

  if (Math.abs(x0) >= clip_lim) return 0.5 * Math.sign(x0)

  let y0 = (x < -t) ?
    ((x*x + x + 0.25) / clip_p - 0.5) :
  (x > t) ?
    (-(x*x - x + 0.25) / clip_p + 0.5) :

    (x * 2.0 * clip_lim)

  return y0 // returns -0.5 .. 0.5
}

function clippedImageDim(rawRatio) {
  let workDim = (rawRatio < 1.0) ? (1/rawRatio) : rawRatio
  let clippedDim = clipfun(workDim / 4)

  return (rawRatio < 1.0) ? (0.25/clippedDim) : (4*clippedDim)
}

function renderGallery(prefix, images) {
  const gallery = document.getElementById('gallery');
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => (img.epic|0) >= 10);
  let lesser = shuffled.filter(img => (img.epic|0) < 10);

  while (important.length > 0) {
    let fillers = []
    let rule = ''

    // If we're running low on filler images, sort remaining important images
    // to process narrow/square ones first, leaving wide ones for the end
    let main;
    if (lesser.length == 0 && important.length > 1) {
      // Sort remaining important images by aspect ratio (narrow first)
      console.log("Ran out of lesser images, putting important images starting from narrowest")
      important.sort((a, b) => a.ratio - b.ratio);
      main = important.shift();
    } else {
      // Normal case: just pop from the shuffled array
      main = important.pop();
    }

    // Check if we have enough lesser images for complex layouts
    const hasEnoughFillers = lesser.length >= 4; // Need at most 4 for E1/E2

    let ruleSet;
    if (hasEnoughFillers) {
      // Normal case: try all rules
      ruleSet = shuffle(['A', 'B', 'D', 'E1', 'E2', 'F1', 'F2', 'G', 'I']);
    } else {
      // Limited fillers: prioritize simpler rules, but allow some complex ones if we have enough
      if (lesser.length >= 3) {
        ruleSet = shuffle(['A', 'B', 'D', 'F1', 'F2', 'G']);
      } else if (lesser.length >= 2) {
        ruleSet = shuffle(['A', 'B', 'I']);
      } else {
        // Only 0-1 lesser images left: use Rule A only
        ruleSet = ['A'];
      }
    }

    // pre-calculated band dimensions
    let adjustedHeight = INTERNAL_WIDTH / main.ratio

    let band = undefined;
    let ruleFound = false;

    // Keep trying rules until we find one that works or run out of rules
    while (!ruleFound && ruleSet.length > 0) {
      rule = ruleSet.pop()
      console.log(`Band #${bandCount}`)
      let needed;
      switch (rule) {
        case 'A': needed = 1; break;
        case 'B': needed = 2; break;
        case 'C': needed = 2; break;
        case 'D': needed = 3; break;
        case 'E1': needed = 4; break;
        case 'E2': needed = 4; break;
        case 'F1': needed = 3; break;
        case 'F2': needed = 3; break;
        case 'G': needed = 3; break;
        case 'H': needed = 2; break;
        case 'I': needed = 2; break;
        default: needed = 2;
      }

      // Skip this rule if we don't have enough lesser images
      if (needed > lesser.length + 1) { // +1 because we don't count the main image
        console.log(`Skipping rule ${rule}: needs ${needed} images but only have ${lesser.length} lesser images`);
        continue;
      }

      // unset flip status if this is the last band
      if (important.length == 1) {
        console.log("only one image remains:", important[0].title, lesser)
        bandCount++
      }

      band = makeBandClass(prefix, rule, adjustedHeight)
      band.putImages([main]) // put main image only for adjustBandPartitioning
      band.adjustBandPartitioning() // this calculates band height and sub panel width

      // choose filler images now

      // reset fillers
      fillers = []

      // consider aspect ratio of the remaining panels and pick appropriate images
      for (let i = 0; i < needed; i++) {
        // Skip index 0 since that's the main panel 'A'
        let panelIndex = i + 1;
        let panel = band.panelLetters[panelIndex]; // Get the actual panel letter for this index

        let panelW = INTERNAL_WIDTH * band.subPanelWidthPerc[panel]
        let panelH = band.height * band.subPanelHeightPerc[panel]
        let panelRatio = panelW / panelH

        let imgBin = (lesser.length > 0) ? lesser : important

        // pick images from `imgBin` that closely matches the ratio
        let chosen = imgBin.filter(it => (4/5) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (5/4)).randomPick()

        // relax the error margin
        if (!chosen) {
          chosen = imgBin.filter(it => (3/4) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (4/3)).randomPick()
        }

        // relax the error margin
        if (!chosen) {
          chosen = imgBin.filter(it => (2/3) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (3/2)).randomPick()
        }

        // if 66% to 150% is not enough, bail out
        if (!chosen) {
          break
        }

        fillers.push(chosen)
        imgBin.removeElem(chosen)

        if (band.DEBUG) {
          band.picturePanels[panelIndex].setAttribute("panel2", panel)
          band.picturePanels[panelIndex].setAttribute("w", panelW|0)
          band.picturePanels[panelIndex].setAttribute("h", panelH|0)
        }
      }

      if (fillers.length >= needed) { // fillers.length is always same as `needed` if all filler images were found
        // We have enough filler images, we can use this rule
        const allImages = [main, ...fillers]
        // adjust again if needed
        //band.height = computeBandHeight(allImages, rule, INTERNAL_WIDTH);
        band.putImages(allImages) // put all the images now
        ruleFound = true;
      }
      else {
        // Not enough filler images, put them back and try next rule
        // Put back images without creating duplicates
        const lesserSet = new Set(lesser);
        fillers.forEach(img => lesserSet.add(img));
        lesser = Array.from(lesserSet);
      }
    }

    // If no rule worked with available filler images
    if (!ruleFound) {
      console.log("No viable layout found for:", main.title || main.ord, "remaining lesser images:", lesser.length)

      // Fallback to Rule A with just the main image
      rule = 'A'
      band = makeBandClass(prefix, rule, adjustedHeight)
      band.putImages([main])
      band.adjustBandPartitioning()

      console.log(`Fallback: Using Rule A for image ${main.title || main.ord}`)
    }

    band.adjustForEvenFit()
    gallery.appendChild(band.makeHTMLelement())
    bandCount++
  }
}

function precalculateDim(imgObjs) {
  Object.keys(imgObjs).forEach(i => {
    imgObjs[i].ratio0 = eval(imgObjs[i].dim)
    imgObjs[i].ratio = clippedImageDim(imgObjs[i].ratio0)
  })
}

function pack(prefix) {
  loadJson(`${prefix}.json`, str => {
    let imgObjs0 = JSON.parse(str).arts; precalculateDim(imgObjs0)
    let imgObjs = imgObjs0.filter(it => it.ord % 10 == 0 || it.ord < 10)
    precalculateDim(imgObjs)
    renderGallery(prefix, imgObjs)
  })
}

const INTERNAL_WIDTH = 900
