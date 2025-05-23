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
  if (ratio > 1.3) return 'A'; // Wide or standard landscape
  if (ratio < 0.8) return 'E1'; // Tall
  return 'C'; // Standard
}

function makeBand(rule, images) {
  const band = document.createElement('div');
  band.className = 'band';

  switch (rule) {
    case 'A': // Type A
      band.style.gridTemplateColumns = '2fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      band.append(...['A', 'B'].map((_, i) => {
        const img = images[i];
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.gridColumn = i === 0 ? '1' : '2';
        div.style.gridRow = '1 / span 2';
        div.style.backgroundImage = `url(${img.src})`;
        return div;
      }));
      break;

    case 'C': // Type C
      band.style.gridTemplateColumns = '2fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr 1fr';
      const cMain = document.createElement('div');
      cMain.className = 'panel';
      cMain.style.gridColumn = '1';
      cMain.style.gridRow = '1 / span 3';
      cMain.style.backgroundImage = `url(${images[0].src})`;
      const cFill1 = document.createElement('div');
      cFill1.className = 'panel';
      cFill1.style.gridColumn = '2';
      cFill1.style.gridRow = '1 / span 2';
      cFill1.style.backgroundImage = `url(${images[1].src})`;
      const cFill2 = document.createElement('div');
      cFill2.className = 'panel';
      cFill2.style.gridColumn = '2';
      cFill2.style.gridRow = '3';
      cFill2.style.backgroundImage = `url(${images[2].src})`;
      band.append(cMain, cFill1, cFill2);
      break;

    case 'E1': // Type E1
      band.style.gridTemplateColumns = '1fr 1fr 1fr';
      band.style.gridTemplateRows = '1fr 1fr';
      images.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'panel';
        div.style.backgroundImage = `url(${img.src})`;
        div.style.gridColumn = (i % 3) + 1;
        div.style.gridRow = i < 3 ? 1 : 2;
        band.appendChild(div);
      });
      break;
  }

  return band;
}

function renderGallery() {
  const gallery = document.getElementById('gallery');
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => img.importance >= 5);
  const lesser = shuffled.filter(img => img.importance < 5);

  while (important.length > 0) {
    const main = important.pop();
    const rule = selectRule(main);
    let needed = rule === 'A' ? 1 : rule === 'C' ? 2 : 5;
    const fillers = lesser.splice(0, needed);
    if (fillers.length < needed) break;
    const band = makeBand(rule, [main, ...fillers]);
    gallery.appendChild(band);
  }
}


function pack() {
  renderGallery();
}
