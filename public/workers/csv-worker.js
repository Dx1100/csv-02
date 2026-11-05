/* CSV Toolbox worker - all processing happens locally in your browser. Nothing is uploaded. */
importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js'
);

function post(type, payload) {
  payload = payload || {};
  payload.type = type;
  self.postMessage(payload);
}
function baseName(name) { return String(name).replace(/\.[^.]+$/, ''); }

self.onmessage = function (e) {
  var d = e.data;
  try {
    switch (d.op) {
      case 'headers': return headers(d.file);
      case 'split-rows': return splitRows(d.file, d.options);
      case 'split-size': return splitSize(d.file, d.options);
      case 'split-column': return splitColumn(d.file, d.options);
      case 'merge': return merge(d.files);
      case 'dedupe': return dedupe(d.file, d.options);
      case 'csv-to-json': return csvToJson(d.file);
      case 'json-to-csv': return jsonToCsv(d.file);
      case 'change-delimiter': return changeDelimiter(d.file, d.options);
      case 'extract-columns': return extractColumns(d.file, d.options);
      case 'csv-view': return csvView(d.file, d.options);
      case 'csv-to-xml': return csvToXml(d.file);
      case 'csv-to-yaml': return csvToYaml(d.file);
      case 'yaml-to-csv': return yamlToCsv(d.file);
      case 'csv-to-markdown': return csvToMarkdown(d.file);
      case 'markdown-to-csv': return markdownToCsv(d.file);
      case 'csv-to-html': return csvToHtml(d.file);
      case 'html-to-csv': return htmlToCsv(d.file, d.content);
    }
  } catch (err) {
    post('error', { message: err.message });
  }
};

function headers(file) {
  Papa.parse(file, {
    preview: 1,
    skipEmptyLines: 'greedy',
    complete: function (res) { post('headers', { headers: res.data[0] || [] }); }
  });
}

function splitRows(file, opt) {
  var header = null, buf = [], part = 0, total = 0;
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    chunk: function (res) {
      var rows = res.data, i = 0;
      if (header === null && opt.hasHeader && rows.length) { header = rows[0]; i = 1; }
      for (; i < rows.length; i++) {
        buf.push(rows[i]); total++;
        if (buf.length >= opt.rowsPerFile) flush();
      }
      post('progress', { rows: total });
    },
    complete: function () { if (buf.length) flush(); post('done', { rows: total, parts: part }); },
    error: function (err) { post('error', { message: err.message }); }
  });
  function flush() {
    part++;
    var data = (header && opt.keepHeader) ? [header].concat(buf) : buf;
    post('file', { name: baseName(file.name) + '-part-' + part + '.csv', content: Papa.unparse(data) });
    buf = [];
  }
}

function splitSize(file, opt) {
  var headerLine = null, lines = [], size = 0, part = 0, total = 0;
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    chunk: function (res) {
      var rows = res.data, i = 0;
      if (headerLine === null && opt.hasHeader && rows.length) { headerLine = Papa.unparse([rows[0]]); i = 1; }
      for (; i < rows.length; i++) {
        var line = Papa.unparse([rows[i]]);
        if (lines.length && size + line.length + 1 > opt.maxBytes) flush();
        lines.push(line); size += line.length + 1; total++;
      }
      post('progress', { rows: total });
    },
    complete: function () { if (lines.length) flush(); post('done', { rows: total, parts: part }); },
    error: function (err) { post('error', { message: err.message }); }
  });
  function flush() {
    part++;
    var content = (headerLine && opt.keepHeader ? headerLine + '\n' : '') + lines.join('\n');
    post('file', { name: baseName(file.name) + '-part-' + part + '.csv', content: content });
    lines = []; size = 0;
  }
}

function splitColumn(file, opt) {
  var header = null, groups = {}, order = [], total = 0;
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    chunk: function (res) {
      var rows = res.data, i = 0, idx;
      if (header === null && rows.length) { header = rows[0]; i = 1; }
      idx = header.indexOf(opt.column);
      for (; i < rows.length; i++) {
        var v = rows[i][idx];
        var key = (v === undefined || v === null || v === '') ? '(empty)' : String(v);
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(rows[i]); total++;
      }
      post('progress', { rows: total });
    },
    complete: function () {
      order.forEach(function (key) {
        var safe = key.replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 40) || 'empty';
        var data = opt.keepHeader ? [header].concat(groups[key]) : groups[key];
        post('file', { name: baseName(file.name) + '-' + safe + '.csv', content: Papa.unparse(data) });
      });
      post('done', { rows: total, parts: order.length });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function merge(files) {
  var fields = [], rows = [], i = 0, total = 0;
  function next() {
    if (i >= files.length) {
      var data = rows.map(function (r) {
        return fields.map(function (f) { return r[f] === undefined ? '' : r[f]; });
      });
      post('file', { name: 'merged.csv', content: Papa.unparse({ fields: fields, data: data }) });
      post('done', { rows: total, parts: 1 });
      return;
    }
    Papa.parse(files[i++], {
      header: true,
      skipEmptyLines: 'greedy',
      chunk: function (res) {
        (res.meta.fields || []).forEach(function (h) { if (fields.indexOf(h) === -1) fields.push(h); });
        for (var k = 0; k < res.data.length; k++) { rows.push(res.data[k]); total++; }
        post('progress', { rows: total });
      },
      complete: next,
      error: function (err) { post('error', { message: err.message }); }
    });
  }
  next();
}

function dedupe(file, opt) {
  var header = null, seen = Object.create(null), kept = [], removed = 0, total = 0;
  var cols = opt.columns || [];
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    chunk: function (res) {
      var rows = res.data, i = 0, idxs = null;
      if (header === null && opt.hasHeader && rows.length) { header = rows[0]; i = 1; }
      if (header && cols.length) {
        idxs = cols.map(function (c) { return header.indexOf(c); }).filter(function (x) { return x >= 0; });
        if (!idxs.length) idxs = null;
      }
      for (; i < rows.length; i++) {
        total++;
        var key = JSON.stringify(idxs ? idxs.map(function (x) { return rows[i][x]; }) : rows[i]);
        if (seen[key]) { removed++; } else { seen[key] = 1; kept.push(rows[i]); }
      }
      post('progress', { rows: total });
    },
    complete: function () {
      var data = header ? [header].concat(kept) : kept;
      post('file', { name: baseName(file.name) + '-deduped.csv', content: Papa.unparse(data) });
      post('done', { rows: total, parts: 1, removed: removed, kept: kept.length });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function csvToJson(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    complete: function (res) {
      post('file', { name: baseName(file.name) + '.json', content: JSON.stringify(res.data, null, 2) });
      post('done', { rows: res.data.length, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function jsonToCsv(file) {
  var text = new FileReaderSync().readAsText(file);
  var data = JSON.parse(text);
  if (!Array.isArray(data)) {
    if (data && Array.isArray(data.data)) data = data.data;
    else throw new Error('JSON must be an array of objects (or contain a "data" array).');
  }
  post('file', { name: baseName(file.name) + '.csv', content: Papa.unparse(data) });
  post('done', { rows: data.length, parts: 1 });
}

function changeDelimiter(file, opt) {
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    complete: function (res) {
      var content = Papa.unparse(res.data, {
        delimiter: opt.targetDelimiter
      });
      post('file', { name: baseName(file.name) + '-converted.csv', content: content });
      post('done', { rows: res.data.length, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function extractColumns(file, opt) {
  var header = null, keptIdxs = [], buf = [], total = 0;
  var cols = opt.columns || [];
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    chunk: function (res) {
      var rows = res.data, i = 0;
      if (header === null && rows.length) {
        header = rows[0];
        i = 1;
        keptIdxs = cols.map(function (c) { return header.indexOf(c); }).filter(function (x) { return x >= 0; });
      }
      for (; i < rows.length; i++) {
        var row = rows[i];
        buf.push(keptIdxs.map(function (idx) { return row[idx] === undefined ? '' : row[idx]; }));
        total++;
      }
      post('progress', { rows: total });
    },
    complete: function () {
      var finalHeader = keptIdxs.map(function (idx) { return header[idx]; });
      var data = opt.keepHeader ? [finalHeader].concat(buf) : buf;
      post('file', { name: baseName(file.name) + '-extracted.csv', content: Papa.unparse(data) });
      post('done', { rows: total, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function csvView(file, opt) {
  var header = null, rows = [], total = 0, matched = 0;
  var q = (opt.query || '').toLowerCase().trim();
  var page = opt.page || 1;
  var size = opt.pageSize || 100;
  var start = (page - 1) * size;
  var end = start + size;
  
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    chunk: function (res) {
      var chunkRows = res.data, i = 0;
      if (header === null && chunkRows.length) {
        header = chunkRows[0];
        i = 1;
      }
      for (; i < chunkRows.length; i++) {
        var row = chunkRows[i];
        total++;
        if (q) {
          var lineStr = row.join(' ').toLowerCase();
          if (lineStr.indexOf(q) !== -1) {
            matched++;
            if (matched > start && matched <= end) {
              rows.push(row);
            }
          }
        } else {
          matched++;
          if (matched > start && matched <= end) {
            rows.push(row);
          }
        }
      }
    },
    complete: function () {
      post('view-data', {
        headers: header || [],
        rows: rows,
        totalRows: total,
        matchedRows: matched,
        page: page,
        totalPages: Math.ceil(matched / size)
      });
      post('done', { rows: total, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function csvToXml(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    complete: function (res) {
      var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n';
      res.data.forEach(function (row) {
        xml += '  <row>\n';
        for (var key in row) {
          if (row.hasOwnProperty(key)) {
            var tag = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
            if (/^[0-9.-]/.test(tag)) tag = '_' + tag;
            var val = escapeXml(row[key]);
            xml += '    <' + tag + '>' + val + '</' + tag + '>\n';
          }
        }
        xml += '  </row>\n';
      });
      xml += '</root>\n';
      post('file', { name: baseName(file.name) + '.xml', content: xml });
      post('done', { rows: res.data.length, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function csvToYaml(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: 'greedy',
    complete: function (res) {
      var yaml = '';
      res.data.forEach(function (row) {
        var first = true;
        for (var key in row) {
          if (row.hasOwnProperty(key)) {
            var val = String(row[key] === undefined || row[key] === null ? '' : row[key]);
            var formattedKey = quoteYamlString(key);
            var formattedVal = quoteYamlString(val);
            if (first) {
              yaml += '- ' + formattedKey + ': ' + formattedVal + '\n';
              first = false;
            } else {
              yaml += '  ' + formattedKey + ': ' + formattedVal + '\n';
            }
          }
        }
      });
      post('file', { name: baseName(file.name) + '.yaml', content: yaml });
      post('done', { rows: res.data.length, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function quoteYamlString(str) {
  if (/[#:\-?[\]{}|>&!%@`]|^[0-9]|^[yY][eE][sS]$|^[nN][oO]$/.test(str) || str.indexOf('\n') !== -1 || str === '') {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }
  return str;
}

function csvToMarkdown(file) {
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    complete: function (res) {
      var rows = res.data;
      if (!rows.length) {
        post('file', { name: baseName(file.name) + '.md', content: '' });
        post('done', { rows: 0, parts: 1 });
        return;
      }
      var headers = rows[0];
      var md = '| ' + headers.map(escapeMarkdownCell).join(' | ') + ' |\n';
      md += '| ' + headers.map(function() { return '---'; }).join(' | ') + ' |\n';
      for (var i = 1; i < rows.length; i++) {
        var row = rows[i];
        var cols = [];
        for (var j = 0; j < headers.length; j++) {
          cols.push(escapeMarkdownCell(row[j]));
        }
        md += '| ' + cols.join(' | ') + ' |\n';
      }
      post('file', { name: baseName(file.name) + '.md', content: md });
      post('done', { rows: rows.length - 1, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function escapeMarkdownCell(val) {
  if (val === undefined || val === null) return '';
  return String(val).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function csvToHtml(file) {
  Papa.parse(file, {
    skipEmptyLines: 'greedy',
    complete: function (res) {
      var rows = res.data;
      if (!rows.length) {
        post('file', { name: baseName(file.name) + '.html', content: '' });
        post('done', { rows: 0, parts: 1 });
        return;
      }
      var headers = rows[0];
      var html = '<table>\n  <thead>\n    <tr>\n';
      headers.forEach(function (h) {
        html += '      <th>' + escapeXml(h) + '</th>\n';
      });
      html += '    </tr>\n  </thead>\n  <tbody>\n';
      for (var i = 1; i < rows.length; i++) {
        html += '    <tr>\n';
        var row = rows[i];
        for (var j = 0; j < headers.length; j++) {
          html += '      <td>' + escapeXml(row[j]) + '</td>\n';
        }
        html += '    </tr>\n';
      }
      html += '  </tbody>\n</table>';
      post('file', { name: baseName(file.name) + '.html', content: html });
      post('done', { rows: rows.length - 1, parts: 1 });
    },
    error: function (err) { post('error', { message: err.message }); }
  });
}

function yamlToCsv(file) {
  var text = new FileReaderSync().readAsText(file);
  var data = jsyaml.load(text);
  if (!data) throw new Error('YAML document is empty or could not be parsed.');
  if (!Array.isArray(data)) {
    if (data && typeof data === 'object') {
      if (Array.isArray(data.items)) data = data.items;
      else if (Array.isArray(data.data)) data = data.data;
      else if (Array.isArray(data.records)) data = data.records;
      else if (Array.isArray(data.rows)) data = data.rows;
      else {
        // Single object record
        data = [data];
      }
    } else {
      throw new Error('YAML must contain a list of records or objects.');
    }
  }
  // Flatten objects if needed
  var flattened = data.map(function (item) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      var flat = {};
      for (var k in item) {
        if (item.hasOwnProperty(k)) {
          var val = item[k];
          flat[k] = (val !== null && typeof val === 'object') ? JSON.stringify(val) : (val === undefined || val === null ? '' : val);
        }
      }
      return flat;
    }
    return { value: item };
  });

  var csvContent = Papa.unparse(flattened);
  post('file', { name: baseName(file.name) + '.csv', content: csvContent });
  post('done', { rows: flattened.length, parts: 1 });
}

function markdownToCsv(file) {
  var text = new FileReaderSync().readAsText(file);
  var lines = text.split(/\r?\n/);
  var tableLines = [];
  var inTable = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (line.indexOf('|') !== -1) {
      // Check if line looks like a markdown table row
      tableLines.push(line);
      inTable = true;
    } else if (inTable) {
      // End of table block
      if (tableLines.length >= 2) break;
      tableLines = [];
      inTable = false;
    }
  }

  if (tableLines.length < 2) {
    throw new Error('No valid Markdown table found (tables must have a header row and separator line with |).');
  }

  function parseMdRow(rowLine) {
    var raw = rowLine;
    if (raw.charAt(0) === '|') raw = raw.slice(1);
    if (raw.charAt(raw.length - 1) === '|') raw = raw.slice(0, -1);
    
    // Split on pipe characters that are NOT preceded by a backslash
    var cells = [];
    var current = '';
    for (var j = 0; j < raw.length; j++) {
      var ch = raw.charAt(j);
      if (ch === '\\' && j + 1 < raw.length && raw.charAt(j + 1) === '|') {
        current += '|';
        j++;
      } else if (ch === '|') {
        cells.push(current.trim().replace(/<br\s*\/?>/gi, '\n'));
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current.trim().replace(/<br\s*\/?>/gi, '\n'));
    return cells;
  }

  var rawHeader = parseMdRow(tableLines[0]);
  // Verify tableLines[1] is a separator line (e.g. ---, :---, etc.)
  var sep = tableLines[1].replace(/[\s|:\-]/g, '');
  var startRow = 2;
  if (sep !== '') {
    // Second line is not standard separator, treat as data row
    startRow = 1;
  }

  var dataRows = [];
  for (var k = startRow; k < tableLines.length; k++) {
    var row = parseMdRow(tableLines[k]);
    if (row.length === 1 && row[0] === '') continue;
    dataRows.push(row);
  }

  var finalData = [rawHeader].concat(dataRows);
  var csv = Papa.unparse(finalData);
  post('file', { name: baseName(file.name) + '.csv', content: csv });
  post('done', { rows: dataRows.length, parts: 1 });
}

function htmlToCsv(file, parsedTableRows) {
  // If parsedTableRows array passed from client DOMParser
  if (parsedTableRows && Array.isArray(parsedTableRows) && parsedTableRows.length > 0) {
    var csv = Papa.unparse(parsedTableRows);
    post('file', { name: baseName(file.name) + '.csv', content: csv });
    post('done', { rows: Math.max(0, parsedTableRows.length - 1), parts: 1 });
    return;
  }

  // Regex fallback parser for HTML tables inside worker
  var text = new FileReaderSync().readAsText(file);
  var tableMatch = text.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    throw new Error('No <table> element found in HTML file.');
  }
  var tableContent = tableMatch[1];
  var trMatches = tableContent.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
  if (!trMatches || !trMatches.length) {
    throw new Error('No <tr> rows found in HTML table.');
  }

  var rows = [];
  for (var i = 0; i < trMatches.length; i++) {
    var tr = trMatches[i];
    var cellMatches = tr.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi);
    if (!cellMatches) continue;
    var rowCells = cellMatches.map(function(c) {
      return c.replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/&nbsp;/g, ' ')
              .trim();
    });
    rows.push(rowCells);
  }

  if (!rows.length) {
    throw new Error('Could not extract any cells from HTML table.');
  }

  var csvOutput = Papa.unparse(rows);
  post('file', { name: baseName(file.name) + '.csv', content: csvOutput });
  post('done', { rows: Math.max(0, rows.length - 1), parts: 1 });
}

