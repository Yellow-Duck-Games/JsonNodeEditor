// PropertyPanel — edits the fields of the selected node
// Props: node, type, onChange(patch), onClose, onDelete, onDuplicate

function FieldRow({ field, value, onChange }) {
  const label = (
    <label className="field-label">{field.name}</label>
  );

  if (field.type === 'string') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label}
        <input
          className="field"
          type="text"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.name.toLowerCase()}`}
        />
      </div>
    );
  }
  if (field.type === 'number') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label}
        <input
          className="field"
          type="number"
          value={value ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    );
  }
  if (field.type === 'boolean') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 40 }}>
          <button
            role="switch"
            aria-checked={!!value}
            onClick={() => onChange(!value)}
            style={{
              width: 48, height: 24, borderRadius: 12,
              background: value ? 'var(--support-success)' : 'var(--ui-04)',
              border: 'none', position: 'relative', cursor: 'pointer',
              transition: 'background var(--dur-fast)',
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: value ? 27 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff',
              transition: 'left var(--dur-fast)',
            }} />
          </button>
          <span className="t-body-01" style={{ color: 'var(--text-02)' }}>
            {value ? 'On' : 'Off'}
          </span>
        </div>
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label}
        <div style={{ position: 'relative' }}>
          <select
            className="field"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            style={{
              appearance: 'none', paddingRight: 40, cursor: 'pointer',
            }}
          >
            {(field.options || []).map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <Icon
            name="chevronDown" size={16} color="var(--icon-02)"
            style={{ position: 'absolute', right: 12, top: 12, pointerEvents: 'none' }}
          />
        </div>
      </div>
    );
  }
  if (field.type === 'json') {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
    return (
      <div style={{ marginBottom: 16 }}>
        {label}
        <textarea
          value={text}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              onChange(e.target.value);
            }
          }}
          rows={6}
          style={{
            width: '100%',
            background: 'var(--field-01)',
            border: 'none',
            borderBottom: '1px solid var(--border-strong)',
            color: 'var(--text-01)',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: '16px',
            padding: 12,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>
    );
  }
  return null;
}

function PropertyPanel({
  node, type, parentLabel, types, typeById, onChange,
  onClose, onDelete, onDuplicate, onChangeType,
}) {
  if (!node || !type) {
    return (
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-03)', padding: 24, textAlign: 'center',
      }}>
        <div>
          <Icon name="task" size={20} color="var(--icon-03)" />
          <div className="t-body-01" style={{ marginTop: 12 }}>
            Select a node to edit its properties
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 8px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <Icon name={type.icon} size={20} color={type.color} style={{ marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="t-heading-03" style={{ color: 'var(--text-01)' }}>
                {nodeLabel(node, type)}
              </span>
              <span className="t-heading-03" style={{ color: 'var(--text-03)', fontWeight: 300 }}>
                {type.name}
              </span>
            </div>
            <div className="t-label-01" style={{ color: 'var(--text-03)', marginTop: 2 }}>
              {parentLabel || 'root'}
            </div>
          </div>
          <button className="btn-icon" onClick={onDuplicate} title="Duplicate">
            <Icon name="copy" size={16} />
          </button>
          <button className="btn-icon" onClick={onDelete} title="Delete">
            <Icon name="trash" size={16} />
          </button>
          <button className="btn-icon" onClick={onClose} title="Close">
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>
      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <div className="t-label-01" style={{
          color: 'var(--text-02)', textTransform: 'uppercase',
          letterSpacing: 0.5, marginBottom: 12,
        }}>
          Properties
        </div>
        {type.fields.map(f => (
          <FieldRow
            key={f.id}
            field={f}
            value={node.data[f.id]}
            onChange={(v) => onChange({ [f.id]: v })}
          />
        ))}
        {type.fields.length === 0 && (
          <div className="t-body-01" style={{ color: 'var(--text-03)' }}>
            This type has no fields. Add fields in the Schema editor.
          </div>
        )}

        {/* Meta */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <div className="t-label-01" style={{
            color: 'var(--text-02)', textTransform: 'uppercase',
            letterSpacing: 0.5, marginBottom: 12,
          }}>
            Meta
          </div>
          <div className="t-label-01" style={{ color: 'var(--text-03)', marginBottom: 4 }}>
            ID: <span className="t-code-01" style={{ color: 'var(--text-02)' }}>{node.id}</span>
          </div>
          <div className="t-label-01" style={{ color: 'var(--text-03)' }}>
            Children: {node.children.length}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PropertyPanel, FieldRow });
