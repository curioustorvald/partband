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

///////////////////////////////////////////////////////////

const images = [
  { src: 'https://picsum.photos/id/1015/600/400', width: 600, height: 400, importance: 9 },
  { src: 'https://picsum.photos/id/1016/400/600', width: 400, height: 600, importance: 6 },
  { src: 'https://picsum.photos/id/1018/300/200', width: 300, height: 200, importance: 4 },
  { src: 'https://picsum.photos/id/1020/300/200', width: 300, height: 200, importance: 3 },
  { src: 'https://picsum.photos/id/1021/300/200', width: 300, height: 200, importance: 2 },
  { src: 'https://picsum.photos/id/1022/200/300', width: 200, height: 300, importance: 2 },
  { src: 'https://picsum.photos/id/1024/600/400', width: 600, height: 400, importance: 8 },
  { src: 'https://picsum.photos/id/1025/450/300', width: 450, height: 300, importance: 5 },
  { src: 'https://picsum.photos/id/1027/400/400', width: 400, height: 400, importance: 4 },
  { src: 'https://picsum.photos/id/1028/300/450', width: 300, height: 450, importance: 3 },
  { src: 'https://picsum.photos/id/1029/350/250', width: 350, height: 250, importance: 2 },
  { src: 'https://picsum.photos/id/1030/250/350', width: 250, height: 350, importance: 1 }
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function aspectRatio(image) {
  return image.width / image.height;
}

function selectRule(image) {
  const ratio = aspectRatio(image);
  if (ratio > 1.8) return 'B';
  if (ratio > 1.5) return 'A';
  if (ratio > 1.2) return 'C';
  if (ratio > 1.0) return 'D';
  if (ratio > 0.8) return 'E1';
  if (ratio > 0.6) return 'F';
  if (ratio > 0.5) return 'G';
  return 'H';
}

function computeBandHeight(images) {
  const avgHeight = images.reduce((sum, img) => sum + img.height, 0) / images.length;
  return Math.max(150, Math.min(300, avgHeight));
}

function makeBand(rule, images) {
  const wrapper = document.createElement('div');
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const label = document.createElement('div');
  label.textContent = `Rule: ${rule}`;
  label.style.fontSize = '12px';
  label.style.fontWeight = 'bold';
  label.style.marginBottom = '4px';
  label.style.color = '#555';
  label.style.paddingLeft = '2px';

  const band = document.createElement('div');
  band.className = 'band';
  band.style.height = computeBandHeight(images) + 'px';

  switch (rule) {
    case 'B': // 2x2 with different side image
      band.style.gridTemplateColumns = '2fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      [0, 1].forEach((i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = i === 0 ? '1' : '2';
        div.style.gridRow = '1 / span 2';
        div.style.backgroundImage = `url(${images[i].src})`;
        band.appendChild(div);
      });
      break;

    case 'D': // 3-row with staggered right column
      band.style.gridTemplateColumns = '2fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr 1fr';
      const dMain = document.createElement('div');
      dMain.className = 'panel';
      dMain.style.gridColumn = '1';
      dMain.style.gridRow = '1 / span 3';
      dMain.style.backgroundImage = `url(${images[0].src})`;
      const dFills = [images[1], images[2], images[3]];
      dFills.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = '2';
        div.style.gridRow = `${i + 1}`;
        div.style.backgroundImage = `url(${img.src})`;
        band.appendChild(div);
      });
      band.appendChild(dMain);
      break;

    case 'G': // 3-column with asymmetric right image
      band.style.gridTemplateColumns = '1fr 1fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      [0, 1, 2].forEach((i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = i + 1;
        div.style.gridRow = '1';
        div.style.backgroundImage = `url(${images[i].src})`;
        band.appendChild(div);
      });
      [3, 4].forEach((i, j) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = j + 2;
        div.style.gridRow = '2';
        div.style.backgroundImage = `url(${images[i].src})`;
        band.appendChild(div);
      });
      break;

    case 'H': // 3-column mirrored vertical split
      band.style.gridTemplateColumns = '1fr 1fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      [0, 1, 2].forEach((i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = i + 1;
        div.style.gridRow = '1';
        div.style.backgroundImage = `url(${images[i].src})`;
        band.appendChild(div);
      });
      [3, 4, 5].forEach((i, j) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = j + 1;
        div.style.gridRow = '2';
        div.style.backgroundImage = `url(${images[i].src})`;
        band.appendChild(div);
      });
      break;
    case 'A': // 2-column, 2-row
      band.style.gridTemplateColumns = '2fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      images.slice(0, 2).forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = i === 0 ? '1' : '2';
        div.style.gridRow = '1 / span 2';
        div.style.backgroundImage = `url(${img.src})`;
        band.appendChild(div);
      });
      break;

    case 'C': // 2-column, 3-row
      band.style.gridTemplateColumns = '2fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr 1fr';
      const cMain = document.createElement('div');
      cMain.className = 'panel';
      cMain.style.gridColumn = '1';
      cMain.style.gridRow = '1 / span 3';
      cMain.style.backgroundImage = `url(${images[0].src})`;
      const cFills = [images[1], images[2]];
      cFills.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = '2';
        div.style.gridRow = i < 1 ? '1 / span 2' : '3';
        div.style.backgroundImage = `url(${img.src})`;
        band.appendChild(div);
      });
      band.appendChild(cMain);
      break;

    case 'E1': // 3-column, 2-row
      band.style.gridTemplateColumns = '1fr 1fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      images.slice(0, 6).forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = (i % 3) + 1;
        div.style.gridRow = i < 3 ? 1 : 2;
        div.style.backgroundImage = `url(${img.src})`;
        band.appendChild(div);
      });
      break;

    case 'F': // 3-column mixed
      band.style.gridTemplateColumns = '1fr 1fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      images.slice(0, 5).forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.backgroundImage = `url(${img.src})`;
        div.style.gridColumn = [1, 2, 3, 2, 3][i];
        div.style.gridRow = i < 3 ? 1 : 2;
        band.appendChild(div);
      });
      break;
  }

  wrapper.appendChild(label);
  wrapper.appendChild(band);
  return wrapper;
}

function renderGallery() {
  const gallery = document.getElementById('gallery');
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => img.importance >= 5);
  const lesser = shuffled.filter(img => img.importance < 5);

  while (important.length > 0) {
    const main = important.pop();
    const rule = selectRule(main);
    let needed;
    switch (rule) {
      case 'A': needed = 1; break;
      case 'B': needed = 1; break;
      case 'C': needed = 2; break;
      case 'D': needed = 3; break;
      case 'E1': needed = 5; break;
      case 'F': needed = 4; break;
      case 'G': needed = 4; break;
      case 'H': needed = 5; break;
      default: needed = 2;
    }
    const fillers = lesser.splice(0, needed);
    if (fillers.length < needed) break;
    const band = makeBand(rule, [main, ...fillers]);
    gallery.appendChild(band);
  }
}


function pack() {
  renderGallery();
}
