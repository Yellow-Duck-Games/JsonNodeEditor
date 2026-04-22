// JsonView — syntax-highlighted JSON preview with copy/download/upload actions.
// Highlights the currently selected node's fragment.

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderJsonLine(value, indent, key, isLast, highlightIds, path) {
  // Recursive flat line writer, returns array of { text, kind, nodeId }
  const pad = '  '.repeat(indent);
  const pre = key != null ? `${pad}<span class="jk">"${escapeHtml(key)}"</span>: ` : pad;

  if (value === null) return [{ html: pre + '<span class="jn">null</span>' + (isLast ? '' : ',') }];
  if (typeof value === 'boolean') return [{ html: pre + `<span class="jb">${value}</span>` + (isLast ? '' : ',') }];
  if (typeof value === 'number') return [{ html: pre + `<span class="jnum">${value}</span>` + (isLast ? '' : ',') }];
  if (typeof value === 'string') return [{ html: pre + `<span class="js">"${escapeHtml(value)}"</span>` + (isLast ? '' : ',') }];
  if (Array.isArray(value)) {
    if (value.length === 0) return [{ html: pre + '[]' + (isLast ? '' : ',') }];
    const out = [{ html: pre + '[' }];
    value.forEach((v, i) => {
      renderJsonLine(v, indent + 1, null, i === value.length - 1, highlightIds, path).forEach(l => out.push(l));
    });
    out.push({ html: pad + ']' + (isLast ? '' : ',') });
    return out;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return [{ html: pre + '{}' + (isLast ? '' : ',') }];
    const nodeId = value.__id;
    const highlight = nodeId && highlightIds && highlightIds.has(nodeId);
    const out = [{ html: pre + '{', nodeId, highlight }];
    keys.forEach((k, i) => {
      renderJsonLine(value[k], indent + 1, k, i === keys.length - 1, highlightIds, path + '.' + k).forEach(l => {
        out.push({ ...l, nodeId: l.nodeId || nodeId, highlight: l.highlight || highlight });
      });
    });
    out.push({ html: pad + '}' + (isLast ? '' : ','), nodeId, highlight });
    return out;
  }
  return [{ html: pre + 'null' + (isLast ? '' : ',') }];
}

function JsonView({ tree, types, selectedId, onSelectNode, onImport, onExport }) {
  const [copyLabel, setCopyLabel] = useState('Copy');
  const [format, setFormat] = useState(() => localStorage.getItem('json-format') || 'clean');
  useEffect(() => { localStorage.setItem('json-format', format); }, [format]);
  const json = useMemo(() => treeToJson(tree, types, format), [tree, types, format]);

  // Collect ancestor IDs of selectedId for highlighting
  const highlightIds = useMemo(() => {
    if (!selectedId) return new Set();
    const s = new Set([selectedId]);
    return s;
  }, [selectedId]);

  const lines = useMemo(() => {
    const j = Array.isArray(json) && json.length === 1 ? json[0] : json;
    return renderJsonLine(j, 0, null, true, highlightIds, '');
  }, [json, highlightIds]);

  const jsonText = useMemo(() => JSON.stringify(
    Array.isArray(json) && json.length === 1 ? json[0] : json,
    null, 2
  ), [json]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopyLabel('Copied');
    setTimeout(() => setCopyLabel('Copy'), 1200);
  };
  const handleDownload = () => {
    const blob = new Blob([jsonText], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tree.json';
    a.click();
  };
  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const text = await f.text();
      try {
        const data = JSON.parse(text);
        onImport(data);
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
      }
    };
    input.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 4, padding: '8px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        alignItems: 'center',
      }}>
        <span className="t-heading-01" style={{ color: 'var(--text-01)' }}>
          JSON
        </span>
        <div style={{ display: 'flex', marginLeft: 12, background: 'var(--ui-01)', border: '1px solid var(--border-subtle)' }}>
          {[
            { id: 'clean', label: 'Clean' },
            { id: 'typed', label: 'Typed' },
            { id: 'raw', label: 'Raw' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              style={{
                height: 28, padding: '0 10px', border: 'none',
                background: format === f.id ? 'var(--selected-ui)' : 'transparent',
                color: format === f.id ? 'var(--text-01)' : 'var(--text-02)',
                cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
                letterSpacing: '0.32px',
              }}
            >{f.label}</button>
          ))}
        </div>
        <span className="t-label-01" style={{ color: 'var(--text-03)', marginLeft: 8 }}>
          {jsonText.split('\n').length} lines
        </span>
        <div style={{ flex: 1 }} />
        <button className="btn-icon" onClick={handleUpload} title="Import JSON">
          <Icon name="upload" size={16} />
        </button>
        <button className="btn-icon" onClick={handleDownload} title="Download JSON">
          <Icon name="download" size={16} />
        </button>
        <button
          className="btn btn-secondary"
          style={{ height: 32, minWidth: 100 }}
          onClick={handleCopy}
        >
          {copyLabel} <Icon name="copy" size={16} />
        </button>
      </div>
      {/* Body */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '8px 0',
        fontFamily: 'var(--font-mono)',
        fontSize: 12, lineHeight: '18px',
      }}>
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              padding: '0 16px',
              background: l.highlight ? 'rgba(15,98,254,0.15)' : 'transparent',
              borderLeft: l.highlight ? '2px solid var(--interactive-01)' : '2px solid transparent',
              cursor: l.nodeId ? 'pointer' : 'default',
              whiteSpace: 'pre',
              color: 'var(--text-02)',
            }}
            onClick={() => l.nodeId && onSelectNode(l.nodeId)}
            dangerouslySetInnerHTML={{ __html: l.html }}
          />
        ))}
      </div>
    </div>
  );
}

// Inject JSON color CSS globally
if (!document.getElementById('__json_css__')) {
  const st = document.createElement('style');
  st.id = '__json_css__';
  st.textContent = `
    .jk { color: #78a9ff; }       /* keys — blue-40 */
    .js { color: #f4f4f4; }       /* strings — white */
    .jnum { color: #3192FF; }     /* numbers */
    .jb { color: #E963FF; }       /* booleans */
    .jn { color: #42be65; }       /* null */
  `;
  document.head.appendChild(st);
}

Object.assign(window, { JsonView });
