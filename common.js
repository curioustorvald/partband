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

function selectRuleSet(image, internalWidth) {
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
  prefix = ''
  mainPanel = document.createElement('bandpanel')
  subPanel = document.createElement('bandpanel')
  #images = []
  flipped = false
  picturePanels = []

  resizeHandles = {}

  subPanelWidthPerc = {} // alphabet to number. Remains empty until adjustBandPartitioning is called. 0-1
  subPanelHeightPerc = {} // alphabet to number. Remains empty until adjustBandPartitioning is called. 0-1

  #mainPanelWidthPerc = 0 // percentage. 0-100
  height = 0 // pixels
  #isThreeCol = false

  rule = ''

  #createLeafPanel() {
    let r = document.createElement('bandpanel')
    r.className = 'leaf'
    return r
  }

  #createIntermediatePanel() {
    let r = document.createElement('bandpanel')
    return r
  }

  #createResizeHandle(panelA, panelB) {
    // TODO
  }



  constructor(prefix, rule, flip, images) {
    this.prefix = prefix
    this.mainPanel.setColRow(1, 1)
    this.mainPanel.className = 'main leaf'
    this.subPanel.setColRow(1, 1)
    this.subPanel.className = 'sub'
    this.picturePanels.push(this.mainPanel) // index 0
    this.resizeHandles['A-B'] = this.#createResizeHandle(this.mainPanel, this.subPanel)
    this.flipped = flip
    this.rule = rule

    let panelB, panelC, panelD, panelE, panelBD, panelCD, panelCE, panelBC, panelDE;

    switch(rule) {
      case 'A':
        this.picturePanels.push(this.subPanel) // index 1
          this.subPanel.className = 'sub leaf'
        break;

      case 'B': case 'C': case 'H':
        this.isThreeCol = ('H' == rule)
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        this.subPanel.setColRow(1, 2)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        break;

      case 'D':
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        this.subPanel.setColRow(1, 3)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.subPanel.appendChild(panelD)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.picturePanels.push(panelD)
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        this.resizeHandles['C-D'] = this.#createResizeHandle(panelC, panelD)
        break;

      case 'E1':
        this.isThreeCol = true
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        panelE = this.#createLeafPanel()
        panelBD = this.#createIntermediatePanel(); panelBD.setColRow(1, 2)
        panelCE = this.#createIntermediatePanel(); panelCE.setColRow(1, 2)
        this.subPanel.setColRow(2, 1)
        panelBD.appendChild(panelB);panelBD.appendChild(panelD)
        panelCE.appendChild(panelC);panelCE.appendChild(panelE)
        this.subPanel.appendChild(panelBD)
        this.subPanel.appendChild(panelCE)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.picturePanels.push(panelD)
        this.picturePanels.push(panelE)
        this.resizeHandles['B-D'] = this.#createResizeHandle(panelB, panelD)
        this.resizeHandles['C-E'] = this.#createResizeHandle(panelC, panelE)
        this.resizeHandles['BD-CE'] = this.#createResizeHandle(panelBD, panelCE)
        break;

      case 'E2':
        this.isThreeCol = true
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        panelE = this.#createLeafPanel()
        panelBC = this.#createIntermediatePanel(); panelBC.setColRow(2, 1)
        panelDE = this.#createIntermediatePanel(); panelDE.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelBC.appendChild(panelB);panelBC.appendChild(panelC)
        panelDE.appendChild(panelD);panelDE.appendChild(panelE)
        this.subPanel.appendChild(panelBC)
        this.subPanel.appendChild(panelDE)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.picturePanels.push(panelD)
        this.picturePanels.push(panelE)
        this.resizeHandles['B-C'] = this.#createResizeHandle(panelB, panelC)
        this.resizeHandles['D-E'] = this.#createResizeHandle(panelD, panelE)
        this.resizeHandles['BC-DE'] = this.#createResizeHandle(panelBC, panelDE)
        break;

      case 'F1':
        this.isThreeCol = true
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        panelCD = this.#createIntermediatePanel(); panelCD.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelCD.appendChild(panelC);panelCD.appendChild(panelD)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelCD)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.picturePanels.push(panelD)
        this.resizeHandles['C-D'] = this.#createResizeHandle(panelC, panelD)
        this.resizeHandles['B-CD'] = this.#createResizeHandle(panelB, panelCD)
        break;

      case 'F2':
        this.isThreeCol = true
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        panelCD = this.#createIntermediatePanel(); panelCD.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelCD.appendChild(panelC);panelCD.appendChild(panelD)
        this.subPanel.appendChild(panelCD)
        this.subPanel.appendChild(panelB)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.picturePanels.push(panelD)
        this.resizeHandles['C-D'] = this.#createResizeHandle(panelC, panelD)
        this.resizeHandles['B-CD'] = this.#createResizeHandle(panelB, panelCD)
        break;

      case 'G':
        this.isThreeCol = true
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        panelBD = this.#createIntermediatePanel(); panelBD.setColRow(1, 2)
        this.subPanel.setColRow(2, 1)
        panelBD.appendChild(panelB);panelBD.appendChild(panelD)
        this.subPanel.appendChild(panelBD)
        this.subPanel.appendChild(panelC)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
        this.picturePanels.push(panelD)
        this.resizeHandles['B-D'] = this.#createResizeHandle(panelB, panelD)
        this.resizeHandles['BD-C'] = this.#createResizeHandle(panelBD, panelC)
        break;

      case 'I':
        this.isThreeCol = true
        panelB = this.#createLeafPanel()
        panelC = this.#createLeafPanel()
        this.subPanel.setColRow(2, 1)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelC)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelC)
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
  adjustForEvenFit() {
    // move handles AND the height of the band to achieve lowest root-mean-squared errors of aspect ratio
  }
  #heightfun(internalWidth, imgRatio) {
    const MAX = 0.5 * (4/3) * internalWidth
    const MIN = 0.5 / (4/3) * internalWidth
    return coerceIn(1 / (2*imgRatio) * internalWidth, MIN, MAX)
  }
  adjustBandPartitioning(internalWidth) {
    let mainImageRatio = this.#images[0].ratio
    let targetWidth = (this.#isThreeCol) ?
        (internalWidth * 0.7 * mainImageRatio) :
        (internalWidth * 0.5 * mainImageRatio)

    this.height = Math.round(this.#heightfun(internalWidth, mainImageRatio))|0
    let widthPx = this.height * mainImageRatio
    this.#mainPanelWidthPerc = widthPx / internalWidth * 100

    // fill in subPanelWidthPerc
    switch (this.rule) {
      case 'A': case 'B': case 'C': case 'D': case 'H':
        this.subPanelWidthPerc.B = 1.0 - (widthPx / internalWidth)
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.B
        this.subPanelWidthPerc.D = this.subPanelWidthPerc.B
        break;
      case 'E1': case 'E2': case 'G': case 'I':
        this.subPanelWidthPerc.B = (1.0 - (widthPx / internalWidth)) / 2
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.B
        this.subPanelWidthPerc.D = this.subPanelWidthPerc.B
        this.subPanelWidthPerc.E = this.subPanelWidthPerc.B
      case 'F1':
        this.subPanelWidthPerc.B = 1.0 - (widthPx / internalWidth)
        this.subPanelWidthPerc.C = this.subPanelWidthPerc.B / 2
        this.subPanelWidthPerc.D = this.subPanelWidthPerc.B / 2
        break;
      case 'F2':
        this.subPanelWidthPerc.D = 1.0 - (widthPx / internalWidth)
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
    this.mainPanel.style.width = `${this.#mainPanelWidthPerc}%`
    this.subPanel.style.width = `${100 - this.#mainPanelWidthPerc}%`
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

let bandCount = 0
function makeBandClass(prefix, rule, height) {
  bandCount++;
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
  const internalWidth = 900;//gallery.clientWidth;
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => (img.epic|0) >= 10);
  let lesser = shuffled.filter(img => (img.epic|0) < 10);

  while (important.length > 0) {
    let fillers = []
    let rule = ''
    const main = important.pop();
    //const ruleSet = shuffle(selectRuleSet(main, internalWidth));
    const ruleSet = shuffle(['A', 'B', 'D', 'E1', 'E2', 'F1', 'F2', 'G', 'I']);
    // pre-calculated band dimensions
    let adjustedHeight = internalWidth / main.ratio

    let band = undefined;
    let ruleFound = false;

    // Keep trying rules until we find one that works or run out of rules
    while (!ruleFound && ruleSet.length > 0) {
      rule = ruleSet.pop()
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

      band = makeBandClass(prefix, rule, adjustedHeight)
      band.putImages([main]) // put main image only for adjustBandPartitioning
      band.adjustBandPartitioning(internalWidth) // this calculates band height and sub panel width

      // choose filler images now
      // consider aspect ratio of the remaining panels and pick appropriate images
      for (let i = 0; i < needed; i++) {
        let panel = "BCDE"[i]
        let panelW = internalWidth * band.subPanelWidthPerc[panel] // pixels
        let panelH = band.height * band.subPanelHeightPerc[panel] // pixels
        let panelRatio = panelW / panelH // same format as .json

        // pick images from `lesser` that closely matches the ratio
        let chosen = lesser.filter(it => (4/5) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (5/4)).randomPick()

        // relax the error margin
        if (!chosen) {
          chosen = lesser.filter(it => (3/4) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (4/3)).randomPick()
        }

        // relax the error margin
        if (!chosen) {
          chosen = lesser.filter(it => (2/3) < (it.ratio / panelRatio) && (it.ratio / panelRatio) < (3/2)).randomPick()
        }

        // if 66% to 150% is not enough, bail out
        if (!chosen) {
          break
        }

        fillers.push(chosen)
        lesser.removeElem(chosen)
      }

      if (fillers.length >= needed) { // fillers.length is always same as `needed` if all filler images were found
        // We have enough filler images, we can use this rule
        const allImages = [main, ...fillers]
        // adjust again if needed
        //band.height = computeBandHeight(allImages, rule, internalWidth);
        band.putImages(allImages) // put all the images now
        ruleFound = true;
      }
      else {
        // Not enough filler images, put them back and try next rule
        lesser.unshift(...fillers);
      }
    }

    // If no rule worked with available filler images
    if (!ruleFound) {
      console.log("No viable layout found", main, lesser)
      // if no lesser images are available, use Rule A and put just the main image
      if (lesser.length == 0) {
        rule = 'A'
        band = makeBandClass(prefix, rule, adjustedHeight)
        band.putImages([main])
        band.adjustBandPartitioning(internalWidth)
      }
      else {
        throw Error()
      }
    }

    band.adjustForEvenFit()
    gallery.appendChild(band.makeHTMLelement())
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
