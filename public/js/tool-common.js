/* Shared helpers for CSV Toolbox tools. All processing is local - nothing is uploaded. */
window.CSVTB = (function () {
  function setupDropzone(zoneId, inputId, onFiles) {
    var zone = document.getElementById(zoneId);
    var input = document.getElementById(inputId);
    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function () {
      if (input.files.length) { onFiles(Array.prototype.slice.call(input.files)); input.value = ''; }
    });
    ['dragover', 'dragenter'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('dragover'); });
    });
    zone.addEventListener('drop', function (e) {
      var fs = Array.prototype.slice.call(e.dataTransfer.files);
      if (fs.length) onFiles(fs);
    });
  }
  function formatBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
    return (b / 1073741824).toFixed(2) + ' GB';
  }
  function download(name, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: 'application/octet-stream' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function parseCSVLine(line) {
    var cells = [];
    var cell = '';
    var inQuote = false;
    for (var i = 0; i < line.length; i++) {
      var c = line.charAt(i);
      if (c === '"') {
        inQuote = !inQuote;
      } else if (c === ',' && !inQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells.map(function (c) {
      if (c.charAt(0) === '"' && c.slice(-1) === '"') {
        return c.slice(1, -1).replace(/""/g, '"');
      }
      return c;
    });
  }
  function previewCSV(file, el, maxRows) {
    file.slice(0, 65536).text().then(function (text) {
      var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); }).slice(0, maxRows || 6);
      var html = '<table>';
      lines.forEach(function (l, i) {
        var tag = i === 0 ? 'th' : 'td';
        var cells = parseCSVLine(l).slice(0, 8);
        html += '<tr>' + cells.map(function (c) {
          return '<' + tag + '>' + esc(c) + '</' + tag + '>';
        }).join('') + '</tr>';
      });
      el.innerHTML = html + '</table>';
      el.hidden = false;
    });
  }
  function previewText(file, el, maxLines) {
    file.slice(0, 32768).text().then(function (text) {
      var lines = text.split(/\r?\n/).slice(0, maxLines || 8);
      var pre = document.createElement('pre');
      pre.style.margin = '0';
      pre.style.fontSize = '0.85rem';
      pre.style.maxHeight = '180px';
      pre.style.overflow = 'auto';
      pre.style.background = '#fff';
      pre.style.padding = '0.75rem';
      pre.style.border = '1px solid var(--border)';
      pre.style.borderRadius = '8px';
      pre.textContent = lines.join('\n');
      el.innerHTML = '';
      el.appendChild(pre);
      el.hidden = false;
    });
  }
  function addResult(listEl, d) {
    var li = document.createElement('li');
    var span = document.createElement('span');
    span.textContent = d.name + ' (' + formatBytes(d.content.length) + ')';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-small';
    btn.textContent = 'Download';
    btn.addEventListener('click', function () { download(d.name, d.content); });
    li.appendChild(span);
    li.appendChild(btn);
    listEl.appendChild(li);
  }
  function setupDirectionButtons(selectId) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    var container = sel.closest('.direction-container');
    if (!container) return;
    var btns = container.querySelectorAll('.direction-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-dir');
        if (sel.value !== val) {
          sel.value = val;
          sel.dispatchEvent(new Event('change'));
        }
      });
    });
    sel.addEventListener('change', function () {
      btns.forEach(function (btn) {
        var isMatch = btn.getAttribute('data-dir') === sel.value;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });
    });
  }
  return { setupDropzone: setupDropzone, formatBytes: formatBytes, download: download, esc: esc, previewCSV: previewCSV, previewText: previewText, addResult: addResult, setupDirectionButtons: setupDirectionButtons };
})();

