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

    function selectRule(image, containerWidth) {
      const targetMainWidth = containerWidth * 0.66;
      const targetAspectRatio = targetMainWidth / image.height;
      const actualAspectRatio = image.width / image.height;
      const delta = Math.abs(actualAspectRatio - targetAspectRatio);

      if (delta < 0.2 && actualAspectRatio > 1.8) return 'B';
      if (delta < 0.3 && actualAspectRatio > 1.5) return 'A';
      if (delta < 0.4 && actualAspectRatio > 1.2) return 'C';
      if (delta < 0.5 && actualAspectRatio > 1.0) return 'D';
      if (actualAspectRatio > 0.8) return 'E1';
      if (actualAspectRatio > 0.6) return 'F';
      if (actualAspectRatio > 0.5) return 'G';
      return 'H';
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
      return Math.max(100, Math.min(400, height));
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

      bandCount++;
      const band = document.createElement('div');
      const flip = false//bandCount % 2 === 0;
      band.className = 'band';
      band.style.height = computeBandHeight(images) + 'px';

      switch (rule) {
        case 'A': // Type A
          band.style.gridTemplateColumns = '2fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1 / span 2', flip));
          break;

        case 'B': // Type B (adjustable B-C)
          band.style.gridTemplateColumns = '2fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 2, '2', flip));
          break;

        case 'C': // Type C (adjustable B-C)
          band.style.gridTemplateColumns = '2fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 3', flip));
          band.appendChild(panel(images[1], 2, '1 / span 2', flip));
          band.appendChild(panel(images[2], 2, '3', flip));
          break;

        case 'D': // Type D (adjustable B-C, C-D)
          band.style.gridTemplateColumns = '2fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 3', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 2, '2', flip));
          band.appendChild(panel(images[3], 2, '3', flip));
          break;

        case 'E1': // Type E1 (adjustable B-D, C-E)
          band.style.gridTemplateColumns = '1fr 1fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 3, '1', flip));
          band.appendChild(panel(images[3], 2, '2', flip));
          band.appendChild(panel(images[4], 3, '2', flip));
          break;

        case 'E2': // Type E2 (adjustable B-C, D-E)
          band.style.gridTemplateColumns = '1fr 1fr 2fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 3, '1', flip));
          band.appendChild(panel(images[3], 2, '2', flip));
          band.appendChild(panel(images[4], 3, '2', flip));
          break;

        case 'F': // Type F (adjustable D-E)
          band.style.gridTemplateColumns = '1fr 2fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 2, '2', flip));
          band.appendChild(panel(images[3], 3, '2', flip));
          break;

        case 'G': // Type G (adjustable B-D)
          band.style.gridTemplateColumns = '1fr 1fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 3, '1 / span 2', flip));
          band.appendChild(panel(images[3], 2, '2', flip));
          break;

        case 'H': // Type H (adjustable B-D)
          band.style.gridTemplateColumns = '1fr 2fr';
          band.style.gridTemplateRows = '1fr 1fr';
          band.appendChild(panel(images[0], 1, '1 / span 2', flip));
          band.appendChild(panel(images[1], 2, '1', flip));
          band.appendChild(panel(images[2], 2, '2', flip));
          break;

        case 'I': // Type I (adjustable B-C)
          band.style.gridTemplateColumns = '1fr 1fr 1fr';
          band.style.gridTemplateRows = '1fr 1fr';
          for (let i = 0; i < 6; i++) {
            band.appendChild(panel(images[i], (i % 3) + 1, i < 3 ? '1' : '2'), flip);
          }
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
          case 'I': needed = 5; break;
          default: needed = 2;
        }
        const fillers = lesser.splice(0, needed);
        if (fillers.length < needed) break;
        const band = makeBand(rule, [main, ...fillers]);
        gallery.appendChild(band);
      }
    }


function renderGallery() {
  const gallery = document.getElementById('gallery');
  const containerWidth = gallery.clientWidth;
  const shuffled = shuffle([...images]);
  const important = shuffled.filter(img => img.importance >= 5);
  const lesser = shuffled.filter(img => img.importance < 5);

  while (important.length > 0) {
    const main = important.pop();
    const rule = selectRule(main, containerWidth);
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
      case 'I': needed = 5; break;
      default: needed = 2;
    }
    const fillers = lesser.splice(0, needed);
    if (fillers.length < needed) break;
    const allImages = [main, ...fillers];
    const height = computeBandHeight(allImages, rule, containerWidth);
    const band = makeBand(rule, allImages);
    band.querySelector('.band').style.height = `${height}px`;
    gallery.appendChild(band);
  }
}


function pack() {
  renderGallery();
}
