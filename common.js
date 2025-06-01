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

function setColRow(elem, cols, rows) {
  elem.style.gridTemplateColumns = '1fr '.repeat(cols).trim()
  elem.style.gridTemplateRows = '1fr '.repeat(rows).trim()
}

function mustBeVertical(p, x) {
  // Handle edge cases
  if (x < 0) return false;
  if (p % 2 === 0) return false;

  // Special case for p = 1: all non-negative integers
  if (p === 1) return x >= 0;

  // For other values of p, check if x fits the arithmetic sequence
  // Starting value: (p-1)/2, increment: p
  const start = (p - 1) / 2;

  // Check if x can be expressed as start + n*p where n >= 0
  if (x < start) return false;

  const diff = x - start;
  return diff % p === 0;
}

function mustBeFlipped(p, x) {
  const base = Math.ceil(p / 2)
  const maxIncrement = Math.floor(p / 2)

  for (let increment = 0; increment < maxIncrement; increment++) {
      const start = base + increment;
      if ((x - start) >= 0 && (x - start) % p === 0) {
          return true
      }
  }

  return false
}

class PartitionedBand {
  DEBUG = 1

  ord = undefined
  prefix = ''
  mainPanel = document.createElement('bandpanel')
  subPanel = document.createElement('bandpanel')
  #images = []
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

    // Update the stored panel dimensions after resize
    this.#updateStoredPanelDimensions();
  }

  // NEW METHOD: Update stored panel dimensions based on current resize ratios
  #updateStoredPanelDimensions() {
    // Recalculate subPanelWidthPerc and subPanelHeightPerc based on current resize ratios
    this.#recalculatePanelDimensions();
  }

  // NEW METHOD: Recalculate panel dimensions based on resize handle ratios
  #recalculatePanelDimensions() {
    const baseSubWidth = 1.0 - (this.mainPanelWidth / INTERNAL_WIDTH);
    const baseSubHeight = 1.0;

    let rowRatio, colRatio, leftColWidth, rightColWidth, topRowHeight, bottomRowHeight = 0.0;

    switch (this.rule) {
      case 'A': case 'O':
        // No sub-panels to adjust
        break;

      case 'B': case 'C': case 'H':
        if (!this.isVertical()) {
          // Vertical split in sub-panel (B above C)
          if (this.resizeFactors['B-C']) {
            const ratio = this.resizeFactors['B-C'];
            this.subPanelHeightPerc.B = ratio;
            this.subPanelHeightPerc.C = 1 - ratio;
          }
          this.subPanelWidthPerc.B = baseSubWidth;
          this.subPanelWidthPerc.C = baseSubWidth;
        }
        else {
          // Vertical split in sub-panel (B above C)
          if (this.resizeFactors['B-C']) {
            const ratio = this.resizeFactors['B-C'];
            this.subPanelWidthPerc.B = ratio;
            this.subPanelWidthPerc.C = 1 - ratio;
          }
          this.subPanelHeightPerc.B = baseSubWidth;
          this.subPanelHeightPerc.C = baseSubWidth;
        }
        break;

      case 'D':
        // Three vertical panels in sub-panel
        // This is more complex - we need to handle B-C and C-D ratios
        let heightB = 1/3, heightC = 1/3, heightD = 1/3;

        if (this.resizeFactors['B-C'] && this.resizeFactors['C-D']) {
          const ratioBc = this.resizeFactors['B-C'];
          const ratioCd = this.resizeFactors['C-D'];

          // Distribute heights based on both ratios
          // This is a simplified approach - you might want a more sophisticated algorithm
          const totalBC = ratioBc + (1 - ratioBc);
          const totalCD = ratioCd + (1 - ratioCd);

          heightB = ratioBc * (2/3);
          heightC = (1 - ratioBc) * (2/3) * ratioCd;
          heightD = (1 - ratioBc) * (2/3) * (1 - ratioCd) + (1/3);
        }

        if (!this.isVertical()) {
          this.subPanelHeightPerc.B = heightB;
          this.subPanelHeightPerc.C = heightC;
          this.subPanelHeightPerc.D = heightD;
          this.subPanelWidthPerc.B = baseSubWidth;
          this.subPanelWidthPerc.C = baseSubWidth;
          this.subPanelWidthPerc.D = baseSubWidth;
        }
        else {
          this.subPanelWidthPerc.B = heightB;
          this.subPanelWidthPerc.C = heightC;
          this.subPanelWidthPerc.D = heightD;
          this.subPanelHeightPerc.B = baseSubWidth;
          this.subPanelHeightPerc.C = baseSubWidth;
          this.subPanelHeightPerc.D = baseSubWidth;
        }
        break;

      case 'E1':
        // Two columns in sub-panel, each with two rows
        colRatio = this.resizeFactors['BD-CE'] || 0.5;
        leftColWidth = baseSubWidth * colRatio;
        rightColWidth = baseSubWidth * (1 - colRatio);

        if (!this.isVertical()) {
          this.subPanelWidthPerc.B = leftColWidth;
          this.subPanelWidthPerc.D = leftColWidth;
          this.subPanelWidthPerc.C = rightColWidth;
          this.subPanelWidthPerc.E = rightColWidth;

          // Handle vertical ratios within each column
          if (this.resizeFactors['B-D']) {
            const bdRatio = this.resizeFactors['B-D'];
            this.subPanelHeightPerc.B = bdRatio;
            this.subPanelHeightPerc.D = 1 - bdRatio;
          }
          if (this.resizeFactors['C-E']) {
            const ceRatio = this.resizeFactors['C-E'];
            this.subPanelHeightPerc.C = ceRatio;
            this.subPanelHeightPerc.E = 1 - ceRatio;
          }
        }
        else {
          this.subPanelHeightPerc.B = leftColWidth;
          this.subPanelHeightPerc.D = leftColWidth;
          this.subPanelHeightPerc.C = rightColWidth;
          this.subPanelHeightPerc.E = rightColWidth;

          // Handle vertical ratios within each column
          if (this.resizeFactors['B-D']) {
            const bdRatio = this.resizeFactors['B-D'];
            this.subPanelWidthPerc.B = bdRatio;
            this.subPanelWidthPerc.D = 1 - bdRatio;
          }
          if (this.resizeFactors['C-E']) {
            const ceRatio = this.resizeFactors['C-E'];
            this.subPanelWidthPerc.C = ceRatio;
            this.subPanelWidthPerc.E = 1 - ceRatio;
          }
        }
        break;

      case 'E2':
        // Two rows in sub-panel, each with two columns
        rowRatio = this.resizeFactors['BC-DE'] || 0.5;
        topRowHeight = rowRatio;
        bottomRowHeight = 1 - rowRatio;

        if (!this.isVertical()) {
          this.subPanelHeightPerc.B = topRowHeight;
          this.subPanelHeightPerc.C = topRowHeight;
          this.subPanelHeightPerc.D = bottomRowHeight;
          this.subPanelHeightPerc.E = bottomRowHeight;

          // Handle horizontal ratios within each row
          if (this.resizeFactors['B-C']) {
            const bcRatio = this.resizeFactors['B-C'];
            this.subPanelWidthPerc.B = baseSubWidth * bcRatio;
            this.subPanelWidthPerc.C = baseSubWidth * (1 - bcRatio);
          }
          if (this.resizeFactors['D-E']) {
            const deRatio = this.resizeFactors['D-E'];
            this.subPanelWidthPerc.D = baseSubWidth * deRatio;
            this.subPanelWidthPerc.E = baseSubWidth * (1 - deRatio);
          }
        }
        else {
          this.subPanelWidthPerc.B = topRowHeight;
          this.subPanelWidthPerc.C = topRowHeight;
          this.subPanelWidthPerc.D = bottomRowHeight;
          this.subPanelWidthPerc.E = bottomRowHeight;

          // Handle horizontal ratios within each row
          if (this.resizeFactors['B-C']) {
            const bcRatio = this.resizeFactors['B-C'];
            this.subPanelHeightPerc.B = baseSubWidth * bcRatio;
            this.subPanelHeightPerc.C = baseSubWidth * (1 - bcRatio);
          }
          if (this.resizeFactors['D-E']) {
            const deRatio = this.resizeFactors['D-E'];
            this.subPanelHeightPerc.D = baseSubWidth * deRatio;
            this.subPanelHeightPerc.E = baseSubWidth * (1 - deRatio);
          }
        }
        break;

      case 'F1':
        // B on top, C and D side by side on bottom
        const f1RowRatio = this.resizeFactors['B-CD'] || 0.5;

        if (!this.isVertical()) {
          this.subPanelHeightPerc.B = f1RowRatio;
          this.subPanelHeightPerc.C = 1 - f1RowRatio;
          this.subPanelHeightPerc.D = 1 - f1RowRatio;
          this.subPanelWidthPerc.B = baseSubWidth;

          if (this.resizeFactors['C-D']) {
            const cdRatio = this.resizeFactors['C-D'];
            this.subPanelWidthPerc.C = baseSubWidth * cdRatio;
            this.subPanelWidthPerc.D = baseSubWidth * (1 - cdRatio);
          }
        }
        else {
          this.subPanelWidthPerc.B = f1RowRatio;
          this.subPanelWidthPerc.C = 1 - f1RowRatio;
          this.subPanelWidthPerc.D = 1 - f1RowRatio;
          this.subPanelHeightPerc.B = baseSubWidth;

          if (this.resizeFactors['C-D']) {
            const cdRatio = this.resizeFactors['C-D'];
            this.subPanelHeightPerc.C = baseSubWidth * cdRatio;
            this.subPanelHeightPerc.D = baseSubWidth * (1 - cdRatio);
          }
        }
        break;

      case 'F2':
        // B and C side by side on top, D on bottom
        const f2RowRatio = this.resizeFactors['BC-D'] || 0.5;

        if (!this.isVertical()) {
          this.subPanelHeightPerc.B = f2RowRatio;
          this.subPanelHeightPerc.C = f2RowRatio;
          this.subPanelHeightPerc.D = 1 - f2RowRatio;
          this.subPanelWidthPerc.D = baseSubWidth;

          if (this.resizeFactors['B-C']) {
            const bcRatio = this.resizeFactors['B-C'];
            this.subPanelWidthPerc.B = baseSubWidth * bcRatio;
            this.subPanelWidthPerc.C = baseSubWidth * (1 - bcRatio);
          }
        }
        else {
          this.subPanelWidthPerc.B = f2RowRatio;
          this.subPanelWidthPerc.C = f2RowRatio;
          this.subPanelWidthPerc.D = 1 - f2RowRatio;
          this.subPanelHeightPerc.D = baseSubWidth;

          if (this.resizeFactors['B-C']) {
            const bcRatio = this.resizeFactors['B-C'];
            this.subPanelHeightPerc.B = baseSubWidth * bcRatio;
            this.subPanelHeightPerc.C = baseSubWidth * (1 - bcRatio);
          }
        }
        break;

      case 'G':
        // B and D in left column, C in right column
        const gColRatio = this.resizeFactors['BD-C'] || 0.5;
        leftColWidth = baseSubWidth * gColRatio;
        rightColWidth = baseSubWidth * (1 - gColRatio);

        if (!this.isVertical()) {
          this.subPanelWidthPerc.B = leftColWidth;
          this.subPanelWidthPerc.D = leftColWidth;
          this.subPanelWidthPerc.C = rightColWidth;
          this.subPanelHeightPerc.C = 1.0;

          if (this.resizeFactors['B-D']) {
            const bdRatio = this.resizeFactors['B-D'];
            this.subPanelHeightPerc.B = bdRatio;
            this.subPanelHeightPerc.D = 1 - bdRatio;
          }
        }
        else {
          this.subPanelHeightPerc.B = leftColWidth;
          this.subPanelHeightPerc.D = leftColWidth;
          this.subPanelHeightPerc.C = rightColWidth;
          this.subPanelWidthPerc.C = 1.0;

          if (this.resizeFactors['B-D']) {
            const bdRatio = this.resizeFactors['B-D'];
            this.subPanelWidthPerc.B = bdRatio;
            this.subPanelWidthPerc.D = 1 - bdRatio;
          }
        }
        break;

      case 'I':
        // Two horizontal panels
        if (!this.isVertical()) {
          if (this.resizeFactors['B-C']) {
            const ratio = this.resizeFactors['B-C'];
            this.subPanelWidthPerc.B = baseSubWidth * ratio;
            this.subPanelWidthPerc.C = baseSubWidth * (1 - ratio);
          }
          this.subPanelHeightPerc.B = 1.0;
          this.subPanelHeightPerc.C = 1.0;
        }
        else {
          if (this.resizeFactors['B-C']) {
            const ratio = this.resizeFactors['B-C'];
            this.subPanelHeightPerc.B = baseSubWidth * ratio;
            this.subPanelHeightPerc.C = baseSubWidth * (1 - ratio);
          }
          this.subPanelWidthPerc.B = 1.0;
          this.subPanelWidthPerc.C = 1.0;
        }
        break;
    }
  }

  #addPicturePanel(panel, letter) {
    this.picturePanels.push(panel)
    this.panelLetters.push(letter)
  }

  isVertical() {
    return mustBeVertical(COLUMNS, this.ord)
  }

  constructor(prefix, rule, ord) {
    this.ord = ord
    this.prefix = prefix
    setColRow(this.mainPanel, 1, 1)
    this.mainPanel.className = 'main leaf'
    this.mainPanel.setAttribute('panel', 'A')
    setColRow(this.subPanel, 1, 1)
    this.subPanel.className = 'sub'
    this.picturePanels.push(this.mainPanel) // index 0
    this.panelLetters.push('A')
    this.resizeHandles['A-B'] = this.#createResizeHandle(this.mainPanel, this.subPanel)
    this.rule = rule

    let panelB, panelC, panelD, panelE, panelBD, panelCD, panelCE, panelBC, panelDE;

    switch(rule) {
      case 'O':
        this.resizeHandles = []
        break;

      case 'A':
        this.#addPicturePanel(this.subPanel, 'B')
        this.subPanel.className = 'sub leaf'
        this.subPanel.setAttribute('panel', 'B')
        break;

      case 'B': case 'C': case 'H':
        this.#isThreeCol = ('H' == rule)
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        setColRow(this.subPanel, 1, 2)
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
        setColRow(this.subPanel, 1, 3)
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
        this.#isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelE = this.#createLeafPanel('E')
        panelBD = this.#createIntermediatePanel(); setColRow(panelBD, 1, 2)
        panelCE = this.#createIntermediatePanel(); setColRow(panelCE, 1, 2)
        setColRow(this.subPanel, 2, 1)
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
        this.#isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelE = this.#createLeafPanel('E')
        panelBC = this.#createIntermediatePanel(); setColRow(panelBC, 2, 1)
        panelDE = this.#createIntermediatePanel(); setColRow(panelDE, 2, 1)
        setColRow(this.subPanel, 1, 2)
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
        this.#isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelCD = this.#createIntermediatePanel(); setColRow(panelCD, 2, 1)
        setColRow(this.subPanel, 1, 2)
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
        this.#isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelBC = this.#createIntermediatePanel(); setColRow(panelBC, 2, 1)
        setColRow(this.subPanel, 1, 2)
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
        this.#isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        panelD = this.#createLeafPanel('D')
        panelBD = this.#createIntermediatePanel(); setColRow(panelBD, 1, 2)
        setColRow(this.subPanel, 2, 1)
        panelBD.appendChild(panelB);panelBD.appendChild(panelD)
        if (mustBeFlipped(COLUMNS, this.ord)) {
          this.subPanel.appendChild(panelC)
          this.subPanel.appendChild(panelBD)
        }
        else {
          this.subPanel.appendChild(panelBD)
          this.subPanel.appendChild(panelC)
        }
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.#addPicturePanel(panelD, 'D')
        this.resizeHandles['B-D'] = this.#createResizeHandle(panelB, panelD)
        this.resizeHandles['BD-C'] = this.#createResizeHandle(panelBD, panelC)
        break;

      case 'I':
        this.#isThreeCol = true
        panelB = this.#createLeafPanel('B')
        panelC = this.#createLeafPanel('C')
        setColRow(this.subPanel, 2, 1)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.#addPicturePanel(panelB, 'B')
        this.#addPicturePanel(panelC, 'C')
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        break;
    }

    if (!this.isVertical()) {
      // fill in subPanelHeightPerc if horizontal
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
    }
    else {
      // fill in subPanelWidthPerc if vertical
      switch (this.rule) {
        case 'A': case 'B': case 'C': case 'D': case 'H':
          this.subPanelWidthPerc.B = INT_WIDTH_VERT
          this.subPanelWidthPerc.C = this.subPanelWidthPerc.B
          this.subPanelWidthPerc.D = this.subPanelWidthPerc.B
          break;
        case 'E1': case 'E2': case 'G': case 'I':
          this.subPanelWidthPerc.B = INT_WIDTH_VERT / 2
          this.subPanelWidthPerc.C = this.subPanelWidthPerc.B
          this.subPanelWidthPerc.D = this.subPanelWidthPerc.B
          this.subPanelWidthPerc.E = this.subPanelWidthPerc.B
          break;
        case 'F1':
          this.subPanelWidthPerc.B = INT_WIDTH_VERT
          this.subPanelWidthPerc.C = this.subPanelWidthPerc.B / 2
          this.subPanelWidthPerc.D = this.subPanelWidthPerc.B / 2
          break;
        case 'F2':
          this.subPanelWidthPerc.D = INT_WIDTH_VERT
          this.subPanelWidthPerc.B = this.subPanelWidthPerc.D / 2
          this.subPanelWidthPerc.C = this.subPanelWidthPerc.D / 2
          break;
      }
    }

  }

  putImages(imgs) {
    //console.log("putImages", imgs)
    this.picturePanels.forEach((panel, i) => {
      if (imgs[i]) {
        let ord = imgs[i].ord
        let imgURL = `https://cdn.taimuworld.com/${this.prefix}_thumbs/${ord}.webp`
        panel.style.backgroundImage = `url(${imgURL})` // adjust to fit the actual data structure
        let isImageNSFW = (10 < ord && ord % 10 != 0) || (10000 <= ord && ord < 100000) || (200000 <= ord && ord <= 400000)

        panel.setAttribute("nsfw", isImageNSFW|0)
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
    if ('O' == this.rule) {
      this.#updateStoredPanelDimensions()
      return
    }
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

    // Update the stored panel dimensions after optimization
    this.#updateStoredPanelDimensions();

    return bestError;
  }

  #heightfun(imgRatio) {
    const MAX = 0.5 * (4/3) * INTERNAL_WIDTH
    const MIN = 0.5 / (4/3) * INTERNAL_WIDTH
    return coerceIn(1 / (2*imgRatio) * INTERNAL_WIDTH, MIN, MAX)
  }

  adjustBandPartitioning() {
    let mainImageRatio = this.#images[0].ratio

    if ('O' == this.rule) {
      this.height = Math.round(INTERNAL_WIDTH / mainImageRatio)|0
    }
    else {
      this.height = Math.round(this.#heightfun(mainImageRatio))|0
    }

    let widthPx = ('O' == this.rule) ? INTERNAL_WIDTH : this.height * mainImageRatio
    this.mainPanelWidth = widthPx

    if (!this.isVertical()) {
      // set main panel width
      this.mainPanelWidthPerc = widthPx / INTERNAL_WIDTH * 100

      // fill in subPanelWidthPerc if horizontal
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
    else {
      // set main panel height
      let heightPx = ('O' == this.rule) ? INTERNAL_WIDTH : INT_WIDTH_VERT / mainImageRatio
      this.mainPanelWidthPerc = heightPx / INTERNAL_WIDTH * 100 // using mainPanelWidthPerc as a height percentage

      // fill in subPanelHeightPerc if vertical
      switch (this.rule) {
        case 'A': case 'I':
          this.subPanelHeightPerc.B = 1.0 - (heightPx / INTERNAL_WIDTH)
          this.subPanelHeightPerc.C = this.subPanelHeightPerc.B
          break;
        case 'B': case 'C': case 'E1': case 'E2': case 'F1': case 'F2': case 'H':
          this.subPanelHeightPerc.B = 1.0 - (heightPx / INTERNAL_WIDTH) / 2
          this.subPanelHeightPerc.C = this.subPanelHeightPerc.B
          this.subPanelHeightPerc.D = this.subPanelHeightPerc.B
          this.subPanelHeightPerc.E = this.subPanelHeightPerc.B
          break;
        case 'D':
          this.subPanelHeightPerc.B = 1.0 - (heightPx / INTERNAL_WIDTH) / 3
          this.subPanelHeightPerc.C = this.subPanelHeightPerc.B
          this.subPanelHeightPerc.D = this.subPanelHeightPerc.B
          break;
        case 'G':
          this.subPanelHeightPerc.B = 1.0 - (heightPx / INTERNAL_WIDTH) / 2
          this.subPanelHeightPerc.C = this.subPanelHeightPerc.B * 2
          this.subPanelHeightPerc.D = this.subPanelHeightPerc.B
          break;
      }
    }

    // Apply current resize ratios to the calculated dimensions
    this.#recalculatePanelDimensions();
  }

  makeHTMLelement(debuginfo) {
    const container = document.createElement('band');

    container.setAttribute('dir', (mustBeVertical(COLUMNS, this.ord)) ? 'v' : 'h')


    if (this.DEBUG && debuginfo !== undefined) {
      for (const [k, v] of Object.entries(debuginfo)) {
        container.setAttribute(`D${k}`, v)
      }
    }
    if (this.ord !== undefined) {
      container.setAttribute('ord', this.ord)
    }
    if ('O' == this.rule) {
      container.appendChild(this.mainPanel)
      container.style.height = `${this.height}px`
      container.setAttribute('rule', this.rule) // this is not a debug symbol
      if (this.isVertical())
        this.mainPanel.style.height = `100%`;
      else
        this.mainPanel.style.width = `100%`;
    }
    else {
      if (!mustBeFlipped(COLUMNS, this.ord)) {
        container.appendChild(this.mainPanel)
        container.appendChild(this.subPanel)
      }
      else {
        container.appendChild(this.subPanel)
        container.appendChild(this.mainPanel)
      }
      container.setAttribute('rule', this.rule) // this is not a debug symbol

      if (!this.isVertical()) {
        container.style.height = `${this.height}px`
        this.mainPanel.style.width = `${this.mainPanelWidthPerc}%`
        this.subPanel.style.width = `${100 - this.mainPanelWidthPerc}%`

        // console.log("H", this.ord, this.rule, this.mainPanel, this.subPanel)
      }
      else {
        this.mainPanel.style.height = `${this.mainPanelWidthPerc}%`
        this.subPanel.style.height = `${100 - this.mainPanelWidthPerc}%`

        // console.log("V", this.ord, this.rule, this.mainPanel, this.subPanel)
      }
    }

    return container
  }

}

function makeBandClass(prefix, rule, columns) {
  const vertical = mustBeVertical(columns, BAND_COUNT)
  const bandClass = new PartitionedBand(prefix, rule, BAND_COUNT)
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

function renderGallery(elemID, prefix, images, columns) {
  const gallery = document.getElementById(elemID);
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => (img.epic|0) >= 10);
  let lesser = shuffled.filter(img => (img.epic|0) < 10);

  let vert = mustBeVertical(COLUMNS, BAND_COUNT)

  while (important.length > 0) {
    let fillers = []
    let rule = ''

    // If we're running low on filler images, sort remaining important images
    // to process narrow/square ones first, leaving wide ones for the end
    let main;
    if (lesser.length == 0 && important.length > 1) {
      // Sort remaining important images by aspect ratio (narrow first)
      if (this.DEBUG) console.log("Ran out of lesser images, putting important images starting from narrowest");
      important.sort((a, b) => a.ratio - b.ratio);
      main = important.shift();
    } else {
      // Normal case: just pop from the shuffled array
      main = important.pop();
    }

    // Check if we have enough lesser images for complex layouts
    //// temporarily disabling rule E1 and E2
    const hasEnoughFillers = lesser.length >= 3; // Need at most 4 for E1/E2

    const isHighlyEpic = main.epic >= 80

    let ruleSet;
    if (isHighlyEpic) {
      let checkRatio = (vert) ? (1.0 / main.ratio) : main.ratio

      if (vert) {
        if (checkRatio >= 1.5)
          ruleSet = ['O'];
        else if (checkRatio >= 1.3)
          ruleSet = shuffle(['A', 'I']);
        else if (checkRatio <= 0.75)
          ruleSet = shuffle(['F1', 'F2']);
        else
          ruleSet = shuffle(['F1', 'F2', 'I']);
      }
      else {
        if (checkRatio >= 1.5)
          ruleSet = ['O'];
        else if (checkRatio >= 1.3)
          ruleSet = shuffle(['A', 'I']);
        else if (checkRatio <= 0.75)
          ruleSet = shuffle(['F1', 'F2', 'B', 'C']);
        else
          ruleSet = shuffle(['F1', 'F2', 'B', 'I']);
      }

      // append E1 and E2 at the last, if the main image is squarish
      if (9/10 <= main.ratio && main.ratio <= 10/9) {
        if (Math.random() >= 0.5) {
          ruleSet.push('E2'); ruleSet.push('E1')
        }
        else {
          ruleSet.push('E1'); ruleSet.push('E2')
        }
      }
    }
    else {
      if (hasEnoughFillers) {
        // Normal case: try all rules
        //// temporarily disabling rule E1 and E2
        ruleSet = shuffle(['A', 'B', /*'D', 'E1', 'E2',*/ 'F1', 'F2', 'G', 'I']);

        // append E1 and E2 at the last
        if (Math.random() >= 0.5) {
          ruleSet.push('E2'); ruleSet.push('E1')
        }
        else {
          ruleSet.push('E1'); ruleSet.push('E2')
        }
      }
      else {
        // Limited fillers: prioritize simpler rules, but allow some complex ones if we have enough
        if (lesser.length >= 3) {
          ruleSet = shuffle(['A', 'B', /*'D'*/, 'F1', 'F2', 'G', 'I']);
        } else if (lesser.length >= 2) {
          ruleSet = shuffle(['A', 'B', 'I']);
        } else {
          // Only 0-1 lesser images left: use Rule A only
          ruleSet = ['A'];
        }
      }
    }

    // pre-calculated band dimensions
    let adjustedHeight = INTERNAL_WIDTH / main.ratio

    let band = undefined;
    let ruleFound = false;

    // Keep trying rules until we find one that works or run out of rules
    while (!ruleFound && ruleSet.length > 0) {
      rule = ruleSet.pop()
      if (this.DEBUG) console.log(`Band #${BAND_COUNT}, trying rule ${rule}`);
      let needed;
      switch (rule) {
        case 'O': needed = 0; break;
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
      if (needed > lesser.length) {
        if (this.DEBUG) console.log(`Skipping rule ${rule}: needs ${needed} images but only have ${lesser.length} lesser images`);
        continue;
      }

      band = makeBandClass(prefix, rule, columns)
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
                 let chosen = imgBin.filter(it => (4/5) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (5/4)).randomPick();
        if (!chosen) chosen = imgBin.filter(it => (3/4) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (4/3)).randomPick();
        if (!chosen) chosen = imgBin.filter(it => (2/3) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (3/2)).randomPick();

        // if 66% to 150% is not enough, bail out
        if (!chosen) break;


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
      if (this.DEBUG) console.log("No viable layout found for:", main.title || main.ord, "; remaining lesser images:", [...lesser], "; remaining important images:", [...important]);

      // Fallback to Rule A and try both main and sub image
      rule = 'A'
      band = makeBandClass(prefix, rule)

      // if we still have at least one important image, put it on panel B
      let subs = [...important].concat([...lesser])
      // selection time!
            let sub = subs.filter(it => (4/5) <= it.ratio && it.ratio <= (5/4)).randomPick();
      if (!sub) sub = subs.filter(it => (3/4) <= it.ratio && it.ratio <= (4/3)).randomPick();
      if (!sub) sub = subs.filter(it => (2/3) <= it.ratio && it.ratio <= (3/2)).randomPick();


      if (sub) {
        // either of the two remove attempt will succeed as two list are mutually exclusive
        important.removeElem(sub)
        lesser.removeElem(sub)
        // use the chosen image to construct the band
        band.putImages([main, sub])
      }
      else {
        band.putImages([main])
      }

      band.adjustBandPartitioning()

      if (this.DEBUG) {
        if (sub)
          console.log(`Fallback: Using Rule A for image ${main.title || main.ord} AND ${sub.title || sub.ord}`);
        else
          console.log(`Fallback: Using Rule A for image ${main.title || main.ord}`);
      }
    }

    band.adjustForEvenFit()
    gallery.appendChild(band.makeHTMLelement({"band-num": BAND_COUNT}))
    BAND_COUNT++


    if (important.length == 0 && lesser.length > 0) {
      let img = lesser.randomPop()
      if (this.DEBUG) {
        console.log("Ran out of important images but lesser images are available, using random lesser image as an important image")
        console.log("The image:", img)
      }
      important.push(img)
    }
  }

  //if (this.DEBUG) {
    if (lesser.length > 0) {
      throw Error(`Too much lesser images:`, lesser)
    }
  //}
}

function swapPenultAwithLastO(gallery, bands) {
  let ret = false
  if (bands.length >= 2) {
    const [last, penult] = [bands[bands.length - 1], bands[bands.length - 2]]

    // check the rule of the last
    const lastRule = last.getAttribute('rule')
    const lastIsO = (lastRule !== null && lastRule === 'O')

    // check the rule of penult
    const penultRule = penult.getAttribute('rule')
    const penultIsNotO = (penultRule !== null && penultRule !== 'O')
    const penultPanelsWithImage = Array.from(penult.children).filter(child =>
      child.style.backgroundImage && child.style.backgroundImage !== ''
    )

    // Check if the penult has exactly one child element
    const penultHasOneChild = (penultPanelsWithImage.length === 1)


    if (lastIsO && penultIsNotO && penultHasOneChild) {
      last.after(penult)
      ret = true

      // console.log("Swapping A-O to O-A:", penult, last)
    }
  }
  return ret
}

function mergeTwoUnderfilledAs(gallery, bands, imgObjs) {
  let ret = false
  if (bands.length >= 2) {
    const [last, penult] = [bands[bands.length - 1], bands[bands.length - 2]]

    // check the rule of the last
    const lastRule = last.getAttribute('rule')
    const lastIsA = (lastRule !== null && lastRule === 'A')
    const lastPanelsWithImage = Array.from(last.children).filter(child =>
      child.style.backgroundImage && child.style.backgroundImage !== ''
    )

    // check the rule of the penult
    const penultRule = penult.getAttribute('rule')
    const penultIsA = (lastRule !== null && lastRule === 'A')
    const penultPanelsWithImage = Array.from(penult.children).filter(child =>
      child.style.backgroundImage && child.style.backgroundImage !== ''
    )

    if (penultIsA && lastIsA && lastPanelsWithImage.length === 1 && penultPanelsWithImage.length === 1) {
      let lastPicturePanel = last.querySelector(".main.leaf")
      let penultMainPanel = penult.querySelector(".main.leaf")
      let penultEmptyPanel = penult.querySelector(".sub.leaf")
      if (lastPicturePanel !== null && penultEmptyPanel !== null) {
        // console.log("Merging two images into one band:", penultMainPanel.style.backgroundImage, lastPicturePanel.style.backgroundImage)

        // copy image of the last to the empty panel of the penult
        penultEmptyPanel.style.backgroundImage = lastPicturePanel.style.backgroundImage

        // resize the band
        let img1Ord = getImageOrdFromURL(penultMainPanel.style.backgroundImage)
        let img2Ord = getImageOrdFromURL(penultEmptyPanel.style.backgroundImage)
        let img1RatioRaw = imgObjs.filter(it => it.ord == img1Ord)[0].ratio
        let img2RatioRaw = imgObjs.filter(it => it.ord == img2Ord)[0].ratio
        let img1Ratio = img1RatioRaw / (img1RatioRaw + img2RatioRaw)
        let img2Ratio = img2RatioRaw / (img1RatioRaw + img2RatioRaw)
        penultMainPanel.style.width = `${img1Ratio * 100}%`
        penultEmptyPanel.style.width = `${img2Ratio * 100}%`

        // copy over necessary flags (e.g. NSFW) into penultEmptyPanel
        penultEmptyPanel.setAttribute('nsfw', lastPicturePanel.getAttribute('nsfw'))

        // remove the last band from the gallery
        gallery.removeChild(last)

        ret = true
      }
    }
  }
  return ret
}

function putUnderfilledAtoLast(gallery, bands) {
  let ret = false
  if (bands.length >= 2) {
    let underfilled = Array.from(bands).slice(0, -1).filter(it => {
      const panelsWithImage = Array.from(it.children).filter(child =>
        child.style.backgroundImage && child.style.backgroundImage !== ''
      )
      return (it.getAttribute('rule') === 'A' && panelsWithImage.length === 1)
    })

    underfilled.forEach(it => {
      ret = true
      // console.log("Moving underfilled band to the last:", it)
      gallery.appendChild(it) // apparently it will only move if the element already exists in the DOM
    })
  }
  return ret
}

function turnTrailingAintoO(gallery, bands, imgObjs) {
  let ret = false

  const last = bands[bands.length - 1]
  const lastRule = last.getAttribute('rule')

  if (lastRule !== null && lastRule === 'A') {

    // extract the image from the last
    const lastPanelWithImage = Array.from(last.children).filter(child =>
      child.style.backgroundImage && child.style.backgroundImage !== ''
    )

    // of course, only do it when there is no image on the other side
    if (lastPanelWithImage.length == 1) {
      // console.log("Underfilled A-band found. Will convert it to O-band. Image:", lastPanelWithImage[0].style.backgroundImage, "; band:", last)

      const imageOrd = getImageOrdFromURL(lastPanelWithImage[0].style.backgroundImage)
      const imageRatio = imgObjs.filter(it => it.ord == imageOrd)[0].ratio

      // turn A-panel into O-panel
      last.setAttribute('rule', 'O')
      last.querySelector('.main.leaf').style.width = '100%'
      last.querySelector('.sub.leaf').remove() // nuke it
    }
  }

  return ret
}

function postProcessGallery(elemID, prefix, imgObjs, columns) {
  // if the last band is type 'O' and the penultimate band is underfilled (type != 'O' and has only one child), swap them

  const gallery = document.getElementById(elemID)
  const bands = gallery.children

  while (1) {
    let somethingHappened = (columns % 2 == 0) ? [
      putUnderfilledAtoLast(gallery, bands, imgObjs),
      mergeTwoUnderfilledAs(gallery, bands, imgObjs),
      swapPenultAwithLastO(gallery, bands, imgObjs)
    ] : [
      // putUnderfilledAtoLast(gallery, bands, imgObjs),
      // mergeTwoUnderfilledAs(gallery, bands, imgObjs),
      // swapPenultAwithLastO(gallery, bands, imgObjs)
    ]
    if (somethingHappened.length == 0 || !somethingHappened.some(Boolean)) break; // if nothing changed, break
  }

  turnTrailingAintoO(gallery, bands, imgObjs)
}

function precalculateDim(imgObjs) {
  Object.keys(imgObjs).forEach(i => {
    let [num, denom] = imgObjs[i].dim.split('/')
    imgObjs[i].ratio0 = num / denom
    imgObjs[i].ratio = clippedImageDim(imgObjs[i].ratio0)
  })
}

function getImageOrdFromURL(cssURL) {
  return (cssURL.match(/(\d+)\.webp/)[1])|0
}

let showNSFW = false

function toggleNSFW() {
  if (showNSFW) {
    lockNSFW()
  }
  else {
    unlockNSFW()
  }
}

function unlockNSFW() {
  showNSFW = true
  document.documentElement.style.setProperty('--nsfw-blur-enabled', '0')
}

function lockNSFW() {
  showNSFW = false
  document.documentElement.style.setProperty('--nsfw-blur-enabled', '1')
}

function geomean(numbers) {
  const logSum = numbers.reduce((acc, num) => acc + Math.log(num), 0)
  return Math.exp(logSum / numbers.length)
}

function adjustBandHeightMultiColumn(elemID, prefix, imgObjs, columns0) {
  if (columns0 == 1) return;

  const gallery = document.getElementById(elemID)
  const bands = gallery.children
  const gap = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gaps'))

  // even number of columns?
  if (columns0 % 2 == 0) {
    let columns = columns0 / 2
    for (let i = 0; i < bands.length; i += columns) {
      let sameRowBands = [...Array(columns).keys()].map(it => bands[i + it] ).filter(it => it !== undefined)

      let bandHeights = sameRowBands.map(it => parseInt(it.style.height)) // '123px' -> 123
      let bandGeomean = Math.round(geomean(bandHeights))|0
      sameRowBands.forEach(it => it.style.height = `${bandGeomean}px`)
    }
  }
  // odd number of columns?
  else {
    let columns = columns0
    let hcols = (columns / 2)|0 // 1 for columns=3, 2 for columns=5, ...

    // single cluster is arranged like 'h1 h1 v h2 h2'
    // 1. set heights for h1s
    // 2. set heights for h2s
    // 3. set height of v as (h1s.height + h2s.height + var(--gaps))

    // when columns is odd, number of bands in each "cluster" is conveniently equal to the columns count
    for (let i = 0; i < bands.length; i += columns) {
      let sameRowBandsHi = [...Array((columns/2)|0).keys()].map(it => bands[i + it] ).filter(it => it !== undefined)
      let sameRowBandsLo = [...Array((columns/2)|0).keys()].map(it => bands[i + hcols + 1 + it] ).filter(it => it !== undefined)

      let bandHeightsHi = sameRowBandsHi.map(it => parseInt(it.style.height)) // '123px' -> 123
      let bandGeomeanHi = Math.round(geomean(bandHeightsHi))|0
      sameRowBandsHi.forEach(it => it.style.height = `${bandGeomeanHi}px`)

      let bandHeightsLo = sameRowBandsLo.map(it => parseInt(it.style.height)) // '123px' -> 123
      let bandGeomeanLo = Math.round(geomean(bandHeightsLo))|0
      sameRowBandsLo.forEach(it => it.style.height = `${bandGeomeanLo}px`)

      if (bands[i + hcols] !== undefined)
        bands[i + hcols].style.height = `${bandGeomeanHi + bandGeomeanLo + gap}px`;
    }
  }
}

function pack(elemID, prefix) {
  loadJson(`${prefix}.json`, str => {
    let imgObjs0 = JSON.parse(str).arts; precalculateDim(imgObjs0)
    let imgObjs = imgObjs0.filter(it => it.ord % 10 == 0 || it.ord < 10)

    let gallery = document.getElementById(elemID)

    COLUMNS = Math.round(gallery.clientWidth / (INTERNAL_WIDTH / 2))

    console.log("columns", COLUMNS)

    if (COLUMNS % 2 == 0) {
      gallery.style.setProperty('grid-template-columns', `repeat(${(COLUMNS/2)|0}, 1fr)`)
      gallery.style.setProperty('grid-template-rows', 'unset')
    }
    else {
      gallery.style.setProperty('grid-template-columns', `repeat(${(COLUMNS/2)|0}, 2fr) 1fr`)
      gallery.style.setProperty('grid-template-rows', 'repeat(auto-fit, 1fr 1fr)')
    }

    precalculateDim(imgObjs)
    renderGallery(elemID, prefix, imgObjs, COLUMNS)
    postProcessGallery(elemID, prefix, imgObjs, COLUMNS)
    adjustBandHeightMultiColumn(elemID, prefix, imgObjs, COLUMNS)
  })
}

let COLUMNS = 0
let BAND_COUNT = 0
const INTERNAL_WIDTH = 768
const INT_WIDTH_VERT = INTERNAL_WIDTH / 2
