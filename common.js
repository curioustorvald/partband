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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

///////////////////////////////////////////////////////////


function aspectRatio(image) {
  return image.width / image.height;
}

function selectRule(image, containerWidth, mainImageHeight) {
  const targetMainWidth = containerWidth * 0.5;
  const targetAspectRatio = targetMainWidth / image.height;
  const actualAspectRatio = image.width / image.height; // larger = wider
  const delta = Math.abs(actualAspectRatio - targetAspectRatio);

  // wide
  if (actualAspectRatio > 1.5) return ['A', 'B'].randomPop()
  // standard
  else if (0.7 <= actualAspectRatio && actualAspectRatio <= 1.5) return ['C', 'D'].randomPop()
  // narrow
  else return ['E1', 'E2', 'F', 'G', 'H', 'I'].randomPop()
}

function computeBandHeight(images, rule, containerWidth) {
  const mainImage = images[0];
  let mainCols = 2, mainRows = 1;
  switch (rule) {
    case 'A': case 'B': mainCols = 2; mainRows = 2; break;
    case 'C': case 'D': mainCols = 2; mainRows = 3; break;
    case 'E1': case 'E2': mainCols = 1; mainRows = 2; break;
    case 'F': case 'H': mainCols = 1; mainRows = 2; break;
    case 'G': mainCols = 1; mainRows = 2; break;
    case 'I': mainCols = 1; mainRows = 2; break;
  }
  const colWidth = containerWidth * (mainCols / 3);
  const height = colWidth / (mainImage.width / mainImage.height) / mainRows;
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
  // #images = {}
  flipped = false
  picturePanels = []

  resizeHandles = {}

  mainPanelWidth = 1.0 // main panel is n fr; subPanel is always 1fr

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

    let panelB, panelC, panelD, panelE, panelBD, panelCE, panelBC, panelDE;

    switch(rule) {
      case 'A':
        this.picturePanels.push(this.subPanel) // index 1
          this.subPanel.className = 'sub leaf'
        break;

      case 'B': case 'C': case 'H':
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

      case 'F':
        panelB = this.#createLeafPanel()
        panelD = this.#createLeafPanel()
        panelE = this.#createLeafPanel()
        panelDE = this.#createIntermediatePanel(); panelDE.setColRow(2, 1)
        this.subPanel.setColRow(1, 2)
        panelDE.appendChild(panelD);panelDE.appendChild(panelE)
        this.subPanel.appendChild(panelB)
        this.subPanel.appendChild(panelDE)
        this.picturePanels.push(panelB)
        this.picturePanels.push(panelD)
        this.picturePanels.push(panelE)
        this.resizeHandles['D-E'] = this.#createResizeHandle(panelD, panelE)
        this.resizeHandles['B-DE'] = this.#createResizeHandle(panelB, panelDE)
        break;

      case 'G':
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

    if (images) {
      this.putImages(images)
    }
  }
  putImages(imgs) {
    //console.log("putImages", imgs)
    this.picturePanels.forEach((panel, i) => {
      //panel.style.backgroundImage = `url(${imgs[i].src})` // adjust to fit the actual data structure
      let imgURL = `https://cdn.taimuworld.com/${this.prefix}_thumbs/${imgs[i].ord}.webp`
      panel.style.backgroundImage = `url(${imgURL})` // adjust to fit the actual data structure
    })
  }
  makeBand() {
    const container = document.createElement('band');
    if (!this.flipped) {
      container.appendChild(this.mainPanel)
      container.appendChild(this.subPanel)
    }
    else {
      container.appendChild(this.subPanel)
      container.appendChild(this.mainPanel)
    }

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
function makeBand(prefix, rule, images, height) {
  bandCount++;
  const flip = bandCount % 2 === 0;
  const bandClass = new PartitionedBand(prefix, rule, flip, images)
  const band = bandClass.makeBand()
  // band.style.height = `${height}px`

  return band;
}

function renderGallery(prefix, images) {
  const gallery = document.getElementById('gallery');
  const containerWidth = 1200;//gallery.clientWidth;
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => (img.epic|0) >= 10);
  const lesser = shuffled.filter(img => (img.epic|0) < 10);

  while (important.length > 0) {
    const main = important.pop();
    const imgHeight = 600;//TODO put image dimension on the JSON
    const rule = selectRule(main, containerWidth, imgHeight);

    let needed;
    switch (rule) {
      case 'A': needed = 1; break;
      case 'B': needed = 2; break;
      case 'C': needed = 2; break;
      case 'D': needed = 3; break;
      case 'E1': needed = 4; break;
      case 'E2': needed = 4; break;
      case 'F': needed = 3; break;
      case 'G': needed = 3; break;
      case 'H': needed = 2; break;
      case 'I': needed = 2; break;
      default: needed = 2;
    }
    const fillers = lesser.splice(0, needed);
    if (fillers.length < needed) break;
    const allImages = [main, ...fillers];
    const height = imgHeight//computeBandHeight(allImages, rule, containerWidth);
    const band = makeBand(prefix, rule, allImages, height);
    gallery.appendChild(band);

    // TODO implement bailout algorithm
  }
}


function pack(prefix) {
  loadJson(`${prefix}.json`, str => {
    let imgObjs = JSON.parse(str).arts.filter(it => it.ord % 10 == 0 || it.ord < 10)
    renderGallery(prefix, imgObjs)
  })
}
