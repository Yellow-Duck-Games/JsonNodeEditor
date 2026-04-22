// SchemaEditor — edit node types, their fields, colors/icons, and nesting matrix.
// Props: types, nesting, rootAllowed, onChange(patch)

function TypeListItem({ type, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        background: selected ? 'var(--selected-ui)' : 'transparent',
        border: 'none',
        borderLeft: selected ? `3px solid ${type.color}` : '3px solid transparent',
        width: '100%',
        cursor: 'pointer',
        color: 'var(--text-01)',
        textAlign: 'left',
        transition: 'background var(--dur-fast)',
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = 'var(--hover-ui)';
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon name={type.icon} size={16} color={type.color} />
      <span className="t-body-01" style={{ flex: 1 }}>{type.name}</span>
      <span className="t-label-01" style={{ color: 'var(--text-03)' }}>
        {type.fields.length} fields
      </span>
    </button>
  );
}

function TypeEditor({ type, types, nesting, rootAllowed, onChangeType, onDelete }) {
  const [newFieldName, setNewFieldName] = useState('');
  const updateField = (fieldId, patch) => {
    const fields = type.fields.map(f => f.id === fieldId ? { ...f, ...patch } : f);
    onChangeType({ ...type, fields });
  };
  const addField = () => {
    if (!newFieldName.trim()) return;
    const id = newFieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const fields = [...type.fields, { id, name: newFieldName.trim(), type: 'string', default: '' }];
    onChangeType({ ...type, fields });
    setNewFieldName('');
  };
  const removeField = (id) => {
    onChangeType({ ...type, fields: type.fields.filter(f => f.id !== id) });
  };
  const moveField = (idx, dir) => {
    const fields = [...type.fields];
    const j = idx + dir;
    if (j < 0 || j >= fields.length) return;
    [fields[idx], fields[j]] = [fields[j], fields[idx]];
    onChangeType({ ...type, fields });
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
      {/* Identity row */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
        <div style={{ flex: 1 }}>
          <label className="field-label">Name</label>
          <input
            className="field"
            value={type.name}
            onChange={(e) => onChangeType({ ...type, name: e.target.value })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-label">Collection key (plural)</label>
          <input
            className="field"
            value={type.collectionKey || ''}
            placeholder={pluralize(type.name)}
            onChange={(e) => onChangeType({ ...type, collectionKey: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Color</label>
          <div style={{ display: 'flex', gap: 6, height: 40, alignItems: 'center' }}>
            {TYPE_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => onChangeType({ ...type, color: c.value })}
                title={c.name}
                style={{
                  width: 24, height: 24, border: 'none', padding: 0,
                  background: c.value, cursor: 'pointer',
                  outline: type.color === c.value ? '2px solid var(--focus)' : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <label className="field-label">Icon</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 40px)',
          gap: 4,
        }}>
          {NODE_ICONS.map(name => (
            <button
              key={name}
              onClick={() => onChangeType({ ...type, icon: name })}
              style={{
                width: 40, height: 40, border: 'none',
                background: type.icon === name ? 'var(--selected-ui)' : 'var(--ui-01)',
                cursor: 'pointer',
                outline: type.icon === name ? `2px solid ${type.color}` : 'none',
                outlineOffset: -2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name={name} size={16} color={type.icon === name ? type.color : 'var(--icon-02)'} />
            </button>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="t-label-01" style={{
        color: 'var(--text-02)', textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 12,
      }}>
        Fields ({type.fields.length})
      </div>
      <div style={{ border: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 1fr 70px 120px',
          background: 'var(--ui-01)',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <span className="t-label-01" style={{ color: 'var(--text-02)' }}>Name</span>
          <span className="t-label-01" style={{ color: 'var(--text-02)' }}>Type</span>
          <span className="t-label-01" style={{ color: 'var(--text-02)' }}>Default / Options</span>
          <span className="t-label-01" style={{ color: 'var(--text-02)' }}>Export</span>
          <span className="t-label-01" style={{ color: 'var(--text-02)' }}>Actions</span>
        </div>
        {type.fields.map((f, idx) => (
          <div key={f.id} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 120px 1fr 70px 120px',
            padding: 8,
            gap: 8,
            borderBottom: '1px solid var(--border-subtle)',
            alignItems: 'center',
          }}>
            <input
              className="field"
              style={{ height: 32 }}
              value={f.name}
              onChange={(e) => updateField(f.id, { name: e.target.value })}
            />
            <select
              className="field"
              style={{ height: 32, padding: '0 8px' }}
              value={f.type}
              onChange={(e) => updateField(f.id, {
                type: e.target.value,
                default: defaultFor(e.target.value),
                options: e.target.value === 'select' ? (f.options || ['option1', 'option2']) : undefined,
              })}
            >
              {FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {f.type === 'select' ? (
              <input
                className="field"
                style={{ height: 32 }}
                value={(f.options || []).join(', ')}
                onChange={(e) => updateField(f.id, {
                  options: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                })}
                placeholder="option1, option2"
              />
            ) : f.type === 'boolean' ? (
              <select
                className="field"
                style={{ height: 32, padding: '0 8px' }}
                value={String(!!f.default)}
                onChange={(e) => updateField(f.id, { default: e.target.value === 'true' })}
              >
                <option value="false">false</option>
                <option value="true">true</option>
              </select>
            ) : f.type === 'json' ? (
              <input
                className="field"
                style={{ height: 32, fontFamily: 'var(--font-mono)', fontSize: 12 }}
                value={typeof f.default === 'string' ? f.default : JSON.stringify(f.default)}
                onChange={(e) => {
                  try { updateField(f.id, { default: JSON.parse(e.target.value) }); }
                  catch { updateField(f.id, { default: e.target.value }); }
                }}
              />
            ) : (
              <input
                className="field"
                style={{ height: 32 }}
                value={f.default ?? ''}
                onChange={(e) => updateField(f.id, {
                  default: f.type === 'number' ? Number(e.target.value) : e.target.value,
                })}
              />
            )}
            <label
              title="Include in JSON export"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, cursor: 'pointer',
                color: f.hidden ? 'var(--text-03)' : 'var(--text-01)',
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={!f.hidden}
                onChange={(e) => updateField(f.id, { hidden: !e.target.checked })}
                style={{ cursor: 'pointer' }}
              />
              {f.hidden ? 'hidden' : 'export'}
            </label>
            <div style={{ display: 'flex', gap: 2 }}>
              <button className="btn-icon" style={{ width: 28, height: 28 }}
                onClick={() => moveField(idx, -1)} title="Move up"
                disabled={idx === 0}>
                <Icon name="chevronUp" size={16} />
              </button>
              <button className="btn-icon" style={{ width: 28, height: 28 }}
                onClick={() => moveField(idx, 1)} title="Move down"
                disabled={idx === type.fields.length - 1}>
                <Icon name="chevronDown" size={16} />
              </button>
              <button className="btn-icon" style={{ width: 28, height: 28 }}
                onClick={() => removeField(f.id)} title="Delete">
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        ))}
        {/* Add row */}
        <div style={{ display: 'flex', gap: 8, padding: 8, alignItems: 'center' }}>
          <input
            className="field"
            style={{ height: 32, flex: 1 }}
            placeholder="New field name"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addField()}
          />
          <button className="btn btn-secondary" style={{ height: 32, minWidth: 100 }} onClick={addField}>
            Add field <Icon name="add" size={16} />
          </button>
        </div>
      </div>

      <div className="t-label-01" style={{ color: 'var(--text-03)', marginTop: 12 }}>
        Tip: uncheck "export" to keep a field internal (not emitted in Clean/Raw JSON output).
      </div>

      {/* Danger */}
      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        <button className="btn btn-danger" style={{ minWidth: 160 }} onClick={() => onDelete(type.id)}>
          Delete type <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}

function defaultFor(type) {
  if (type === 'number') return 0;
  if (type === 'boolean') return false;
  if (type === 'json') return {};
  return '';
}

function NestingMatrix({ types, nesting, rootAllowed, onChange }) {
  // Rows = parent, Cols = child, plus "Root" row
  const toggle = (parentId, childId) => {
    if (parentId === '__root__') {
      onChange({
        rootAllowed: { ...rootAllowed, [childId]: !rootAllowed[childId] },
      });
      return;
    }
    const row = nesting[parentId] || {};
    onChange({
      nesting: { ...nesting, [parentId]: { ...row, [childId]: !row[childId] } },
    });
  };

  return (
    <div style={{ padding: 24, overflow: 'auto', flex: 1 }}>
      <div className="t-heading-03" style={{ color: 'var(--text-01)', marginBottom: 8 }}>
        Nesting rules
      </div>
      <div className="t-body-01" style={{ color: 'var(--text-02)', marginBottom: 24, maxWidth: 640 }}>
        Each cell defines whether the row type can be nested inside the column type.
        Drag-and-drop in the tree editor validates against this matrix.
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `180px repeat(${types.length}, 72px)`,
        background: 'var(--ui-01)',
        border: '1px solid var(--border-subtle)',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)' }}>
          <span className="t-label-01" style={{ color: 'var(--text-02)' }}>Parent ＼ Child</span>
        </div>
        {types.map(t => (
          <div key={t.id} style={{
            padding: '12px 8px',
            borderBottom: '1px solid var(--border-subtle)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            textAlign: 'center',
          }}>
            <Icon name={t.icon} size={16} color={t.color} />
            <span className="t-label-01" style={{ color: 'var(--text-02)', fontSize: 11 }}>{t.name}</span>
          </div>
        ))}

        {/* Root row */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="target" size={14} color="var(--icon-02)" />
          <span className="t-body-01" style={{ color: 'var(--text-01)' }}>Root</span>
        </div>
        {types.map(c => (
          <MatrixCell
            key={'root_' + c.id}
            checked={!!rootAllowed[c.id]}
            accent={c.color}
            onClick={() => toggle('__root__', c.id)}
          />
        ))}

        {/* Type rows */}
        {types.map(p => (
          <React.Fragment key={p.id}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Icon name={p.icon} size={14} color={p.color} />
              <span className="t-body-01" style={{ color: 'var(--text-01)' }}>{p.name}</span>
            </div>
            {types.map(c => (
              <MatrixCell
                key={p.id + '_' + c.id}
                checked={!!(nesting[p.id] && nesting[p.id][c.id])}
                accent={c.color}
                onClick={() => toggle(p.id, c.id)}
                sameType={p.id === c.id}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button
          className="btn btn-secondary"
          style={{ minWidth: 180 }}
          onClick={() => {
            // Apply linear chain: type[i] -> type[i+1]
            const ns = {};
            types.forEach((t, i) => {
              ns[t.id] = {};
              types.forEach((c, j) => {
                ns[t.id][c.id] = (j === i + 1);
              });
            });
            onChange({
              nesting: ns,
              rootAllowed: Object.fromEntries(types.map((t, i) => [t.id, i === 0])),
            });
          }}
        >
          Linear chain <Icon name="flow" size={16} />
        </button>
        <button
          className="btn btn-secondary"
          style={{ minWidth: 160 }}
          onClick={() => {
            // Allow any-any
            const ns = {};
            types.forEach(t => {
              ns[t.id] = Object.fromEntries(types.map(c => [c.id, true]));
            });
            onChange({
              nesting: ns,
              rootAllowed: Object.fromEntries(types.map(t => [t.id, true])),
            });
          }}
        >
          Allow all <Icon name="grid" size={16} />
        </button>
      </div>
    </div>
  );
}

function MatrixCell({ checked, accent, onClick, sameType }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: 'none',
        borderBottom: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        background: checked ? accent + '22' : 'transparent',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 48, padding: 0,
        transition: 'background var(--dur-fast)',
      }}
      onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = 'var(--hover-ui)'; }}
      onMouseLeave={(e) => { if (!checked) e.currentTarget.style.background = 'transparent'; }}
    >
      {checked ? (
        <div style={{
          width: 18, height: 18, background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="check" size={14} color="#161616" />
        </div>
      ) : (
        <div style={{
          width: 18, height: 18, border: '1px solid var(--border-strong)',
          opacity: sameType ? 0.3 : 0.6,
        }} />
      )}
    </button>
  );
}

function SchemaEditor({ types, nesting, rootAllowed, onChange }) {
  const [selectedTypeId, setSelectedTypeId] = useState(types[0]?.id);
  const [view, setView] = useState('types'); // 'types' | 'nesting'
  const selectedType = types.find(t => t.id === selectedTypeId) || types[0];

  const addType = () => {
    const id = 'type_' + Math.random().toString(36).slice(2, 7);
    const newType = {
      id,
      name: 'New Type',
      icon: 'box',
      color: TYPE_COLORS[types.length % TYPE_COLORS.length].value,
      fields: [{ id: 'name', name: 'Name', type: 'string', default: '' }],
    };
    onChange({ types: [...types, newType] });
    setSelectedTypeId(id);
  };

  const changeType = (newType) => {
    onChange({ types: types.map(t => t.id === newType.id ? newType : t) });
  };

  const deleteType = (id) => {
    if (types.length <= 1) return;
    const { [id]: _, ...restRoot } = rootAllowed;
    const restNesting = { ...nesting };
    delete restNesting[id];
    for (const k of Object.keys(restNesting)) {
      const { [id]: _c, ...rest } = restNesting[k];
      restNesting[k] = rest;
    }
    onChange({
      types: types.filter(t => t.id !== id),
      nesting: restNesting,
      rootAllowed: restRoot,
    });
    setSelectedTypeId(types[0]?.id);
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Left rail — tabs + type list */}
      <div style={{
        width: 280, borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        background: 'var(--ui-bg)',
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setView('types')}
            style={{
              flex: 1, height: 48, background: 'transparent', border: 'none',
              color: view === 'types' ? 'var(--text-01)' : 'var(--text-03)',
              cursor: 'pointer',
              borderBottom: view === 'types' ? '2px solid var(--focus)' : '2px solid transparent',
              fontSize: 14, fontFamily: 'inherit',
            }}
          >
            Types
          </button>
          <button
            onClick={() => setView('nesting')}
            style={{
              flex: 1, height: 48, background: 'transparent', border: 'none',
              color: view === 'nesting' ? 'var(--text-01)' : 'var(--text-03)',
              cursor: 'pointer',
              borderBottom: view === 'nesting' ? '2px solid var(--focus)' : '2px solid transparent',
              fontSize: 14, fontFamily: 'inherit',
            }}
          >
            Nesting
          </button>
        </div>

        {view === 'types' && (
          <>
            <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
              {types.map(t => (
                <TypeListItem
                  key={t.id}
                  type={t}
                  selected={selectedTypeId === t.id}
                  onClick={() => setSelectedTypeId(t.id)}
                />
              ))}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={addType}>
                New type <Icon name="add" size={16} />
              </button>
            </div>
          </>
        )}

        {view === 'nesting' && (
          <div style={{ padding: 16 }}>
            <div className="t-body-01" style={{ color: 'var(--text-02)' }}>
              Rules describe which types can be children of which.
            </div>
          </div>
        )}
      </div>

      {/* Right content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {view === 'types' && selectedType && (
          <TypeEditor
            type={selectedType}
            types={types}
            nesting={nesting}
            rootAllowed={rootAllowed}
            onChangeType={changeType}
            onDelete={deleteType}
          />
        )}
        {view === 'nesting' && (
          <NestingMatrix
            types={types}
            nesting={nesting}
            rootAllowed={rootAllowed}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SchemaEditor, NestingMatrix, TypeEditor });
