// App shell with DnD, context menus, history, and localStorage persistence.

const { useState, useRef, useEffect, useMemo, useCallback } = React;

// Storage
const STORAGE_KEY = 'json-node-editor-v1';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

// Hook: DnD state + handlers
function useDragDrop({ tree, nesting, rootAllowed, typeById, onMove }) {
  const [dragState, setDragState] = useState({
    dragging: false,
    draggedId: null,
    draggedTypeId: null,
    hoverId: null,
    hoverValid: null,
    hoverOnRoot: false,
  });

  const resetHover = () => setDragState(s => ({ ...s, hoverId: null, hoverValid: null, hoverOnRoot: false }));

  const validateDrop = (draggedId, targetId, asChild) => {
    if (!draggedId) return false;
    if (draggedId === targetId) return false;
    const draggedNode = findNode(tree, draggedId);
    if (!draggedNode) return false;
    if (targetId) {
      // Prevent dropping into own descendant
      if (isDescendant(draggedNode, targetId)) return false;
      const targetNode = findNode(tree, targetId);
      if (!targetNode) return false;
      const parentTypeId = targetNode.typeId;
      const rule = nesting[parentTypeId] || {};
      return !!rule[draggedNode.typeId];
    }
    // root
    return !!rootAllowed[draggedNode.typeId];
  };

  const dragHandlers = {
    onDragStart: (e, id) => {
      const n = findNode(tree, id);
      setDragState({
        dragging: true,
        draggedId: id,
        draggedTypeId: n?.typeId,
        hoverId: null,
        hoverValid: null,
        hoverOnRoot: false,
      });
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', id); } catch {}
    },
    onDragEnd: () => {
      setDragState({ dragging: false, draggedId: null, draggedTypeId: null, hoverId: null, hoverValid: null, hoverOnRoot: false });
    },
    onDragOver: (e, targetId, parentIdOfTarget) => {
      e.preventDefault();
      e.stopPropagation();
      if (!dragState.draggedId) return;
      const valid = validateDrop(dragState.draggedId, targetId, true);
      e.dataTransfer.dropEffect = valid ? 'move' : 'none';
      if (dragState.hoverId !== targetId || dragState.hoverValid !== valid) {
        setDragState(s => ({ ...s, hoverId: targetId, hoverValid: valid, hoverOnRoot: false }));
      }
    },
    onDragLeave: () => {
      // ignore — handled by next onDragOver
    },
    onDrop: (e, targetId, parentIdOfTarget) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = dragState.draggedId;
      if (!draggedId) return;
      if (validateDrop(draggedId, targetId, true)) {
        onMove(draggedId, targetId, -1);
      }
      dragHandlers.onDragEnd();
    },
    onDragOverRoot: (e) => {
      e.preventDefault();
      if (!dragState.draggedId) return;
      const valid = validateDrop(dragState.draggedId, null, true);
      if (!dragState.hoverOnRoot || dragState.hoverValid !== valid) {
        setDragState(s => ({ ...s, hoverId: null, hoverValid: valid, hoverOnRoot: true }));
      }
    },
    onDropRoot: (e) => {
      e.preventDefault();
      const draggedId = dragState.draggedId;
      if (!draggedId) return;
      if (validateDrop(draggedId, null, true)) {
        onMove(draggedId, null, -1);
      }
      dragHandlers.onDragEnd();
    },
  };

  return { dragState, dragHandlers };
}

// Context menu popover
function ContextMenu({ open, anchor, items, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onEsc = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', onDoc), 0);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, onClose]);
  if (!open || !anchor) return null;
  const rect = anchor.getBoundingClientRect();
  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: Math.min(rect.right - 160, window.innerWidth - 180),
        top: Math.min(rect.bottom + 4, window.innerHeight - 300),
        width: 160,
        background: 'var(--ui-02)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
        zIndex: 1000,
        padding: '4px 0',
      }}
    >
      {items.map((item, i) => (
        item.divider ? (
          <div key={i} style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
        ) : (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            disabled={item.disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', border: 'none', background: 'transparent',
              color: item.danger ? 'var(--text-error)' : 'var(--text-01)',
              padding: '8px 16px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.3 : 1,
              textAlign: 'left',
              fontSize: 14,
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => !item.disabled && (e.currentTarget.style.background = 'var(--hover-ui)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            {item.icon && <Icon name={item.icon} size={16} />}
            {item.label}
          </button>
        )
      ))}
    </div>
  );
}

// Primary App
function App() {
  const initial = loadState();
  const [types, setTypes] = useState(() => initial?.types || DEFAULT_TYPES);
  const [nesting, setNesting] = useState(() => initial?.nesting || DEFAULT_NESTING);
  const [rootAllowed, setRootAllowed] = useState(() => initial?.rootAllowed || DEFAULT_ROOT_ALLOWED);
  const [tree, setTree] = useState(() => initial?.tree || buildSeedTree(initial?.types || DEFAULT_TYPES));
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set(initial?.expanded || getDefaultExpanded(initial?.tree || buildSeedTree(DEFAULT_TYPES))));
  const [mode, setMode] = useState(initial?.mode || 'tree'); // 'tree' | 'schema'
  const [rightPane, setRightPane] = useState(initial?.rightPane || 'properties'); // 'properties' | 'json'
  const [rightOpen, setRightOpen] = useState(true);
  const [menu, setMenu] = useState({ open: false, nodeId: null, anchor: null, kind: null });
  const [tweaks, setTweaks] = useState({
    density: 'default', // default | compact
    connectors: true,
    showAccent: true,
  });

  // History (undo/redo)
  const history = useRef({ past: [], future: [] });
  const pushHistory = () => {
    history.current.past.push({
      tree: cloneTree(tree),
      types: JSON.parse(JSON.stringify(types)),
      nesting: JSON.parse(JSON.stringify(nesting)),
      rootAllowed: JSON.parse(JSON.stringify(rootAllowed)),
    });
    if (history.current.past.length > 50) history.current.past.shift();
    history.current.future = [];
  };
  const undo = () => {
    const p = history.current.past.pop();
    if (!p) return;
    history.current.future.push({ tree: cloneTree(tree), types, nesting, rootAllowed });
    setTree(p.tree); setTypes(p.types); setNesting(p.nesting); setRootAllowed(p.rootAllowed);
  };
  const redo = () => {
    const f = history.current.future.pop();
    if (!f) return;
    history.current.past.push({ tree: cloneTree(tree), types, nesting, rootAllowed });
    setTree(f.tree); setTypes(f.types); setNesting(f.nesting); setRootAllowed(f.rootAllowed);
  };

  // Persist
  useEffect(() => {
    saveState({ types, nesting, rootAllowed, tree, expanded: Array.from(expanded), mode, rightPane });
  }, [types, nesting, rootAllowed, tree, expanded, mode, rightPane]);

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); }
      else if (e.key === 'Delete' && selectedId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        deleteNode(selectedId);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const typeById = useMemo(() => Object.fromEntries(types.map(t => [t.id, t])), [types]);

  // Tree mutations
  const moveNode = (id, destParentId, index) => {
    pushHistory();
    setTree(prev => {
      const next = cloneTree(prev);
      const loc = locate(next, id);
      if (!loc) return prev;
      const [node] = loc.arr.splice(loc.index, 1);
      if (destParentId == null) {
        if (index < 0 || index > next.length) next.push(node); else next.splice(index, 0, node);
      } else {
        const dest = findNode(next, destParentId);
        if (!dest) return prev;
        if (index < 0 || index > dest.children.length) dest.children.push(node); else dest.children.splice(index, 0, node);
        setExpanded(s => { const n = new Set(s); n.add(destParentId); return n; });
      }
      return next;
    });
  };

  const addChild = (parentId, typeId) => {
    pushHistory();
    const newNode = makeNode(typeId, types);
    setTree(prev => {
      const next = cloneTree(prev);
      if (parentId == null) {
        next.push(newNode);
      } else {
        const p = findNode(next, parentId);
        if (p) p.children.push(newNode);
      }
      return next;
    });
    if (parentId) setExpanded(s => { const n = new Set(s); n.add(parentId); return n; });
    setSelectedId(newNode.id);
  };

  const duplicateNode = (id) => {
    pushHistory();
    setTree(prev => {
      const next = cloneTree(prev);
      const loc = locate(next, id);
      if (!loc) return prev;
      const clone = cloneTree([loc.arr[loc.index]])[0];
      reassignIds(clone);
      loc.arr.splice(loc.index + 1, 0, clone);
      return next;
    });
  };

  const deleteNode = (id) => {
    pushHistory();
    setTree(prev => {
      const next = cloneTree(prev);
      const loc = locate(next, id);
      if (!loc) return prev;
      loc.arr.splice(loc.index, 1);
      return next;
    });
    if (selectedId === id) setSelectedId(null);
  };

  const updateNodeData = (id, patch) => {
    setTree(prev => {
      const next = cloneTree(prev);
      const n = findNode(next, id);
      if (n) n.data = { ...n.data, ...patch };
      return next;
    });
  };

  const toggleExpand = (id) => {
    setExpanded(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const expandAll = () => {
    const s = new Set();
    const walk = (arr) => arr.forEach(n => { s.add(n.id); walk(n.children); });
    walk(tree);
    setExpanded(s);
  };
  const collapseAll = () => setExpanded(new Set());

  // DnD
  const { dragState, dragHandlers } = useDragDrop({
    tree, nesting, rootAllowed, typeById, onMove: moveNode,
  });

  // Context menu
  const openMenu = (nodeId, kind, anchor) => {
    setMenu({ open: true, nodeId, kind, anchor });
  };
  const closeMenu = () => setMenu({ open: false, nodeId: null, anchor: null, kind: null });

  const menuItems = useMemo(() => {
    if (!menu.open || !menu.nodeId) return [];
    const node = findNode(tree, menu.nodeId);
    if (!node) return [];
    const type = typeById[node.typeId];
    if (!type) return [];

    if (menu.kind === 'add') {
      const allowed = types.filter(t => nesting[type.id]?.[t.id]);
      if (allowed.length === 0) return [{ label: 'No child types allowed', disabled: true }];
      return allowed.map(t => ({
        label: `Add ${t.name}`,
        icon: t.icon,
        onClick: () => addChild(menu.nodeId, t.id),
      }));
    }
    const items = [];
    // Add sub-items for quick-add
    const allowed = types.filter(t => nesting[type.id]?.[t.id]);
    if (allowed.length > 0) {
      allowed.slice(0, 3).forEach(t => {
        items.push({
          label: `Add ${t.name}`, icon: 'add',
          onClick: () => addChild(menu.nodeId, t.id),
        });
      });
      items.push({ divider: true });
    }
    items.push({ label: 'Edit', icon: 'edit', onClick: () => setSelectedId(menu.nodeId) });
    items.push({ label: 'Duplicate', icon: 'copy', onClick: () => duplicateNode(menu.nodeId) });
    items.push({ divider: true });
    items.push({ label: 'Delete', icon: 'trash', danger: true, onClick: () => deleteNode(menu.nodeId) });
    return items;
  }, [menu, tree, types, nesting, typeById]);

  // Selected node info
  const selectedNode = selectedId ? findNode(tree, selectedId) : null;
  const selectedType = selectedNode ? typeById[selectedNode.typeId] : null;
  const selectedParent = selectedId ? findParentOf(tree, selectedId) : null;
  const parentLabel = selectedParent ? `${nodeLabel(selectedParent, typeById[selectedParent.typeId])}` : 'root';

  // Schema change
  const applySchemaChange = (patch) => {
    pushHistory();
    if (patch.types) setTypes(patch.types);
    if (patch.nesting) setNesting(patch.nesting);
    if (patch.rootAllowed) setRootAllowed(patch.rootAllowed);
  };

  // Import
  const importJson = (data) => {
    pushHistory();
    const next = jsonToTree(data, types);
    setTree(next);
    setSelectedId(null);
  };

  // Derived counts
  const totalNodes = useMemo(() => countNodes(tree), [tree]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--ui-bg)' }}>
      {/* Top header */}
      <div style={{
        height: 48, borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', padding: '0 16px',
        flexShrink: 0, background: 'var(--ui-bg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon name="flow" size={20} color="var(--icon-01)" />
          <span className="t-heading-02" style={{ color: 'var(--text-01)', marginLeft: 8 }}>
            JSON Node Editor
          </span>
          <span className="t-body-01" style={{ color: 'var(--text-03)', marginLeft: 8 }}>
            {totalNodes} {totalNodes === 1 ? 'node' : 'nodes'}
          </span>
        </div>

        <div style={{ display: 'flex', marginLeft: 32 }}>
          <button
            onClick={() => setMode('tree')}
            style={{
              height: 48, padding: '0 16px',
              background: mode === 'tree' ? 'var(--selected-ui)' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: mode === 'tree' ? 'var(--text-01)' : 'var(--text-02)',
              fontSize: 14, fontFamily: 'inherit',
              borderBottom: mode === 'tree' ? '2px solid var(--focus)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name="flow" size={16} /> Tree Editor
          </button>
          <button
            onClick={() => setMode('schema')}
            style={{
              height: 48, padding: '0 16px',
              background: mode === 'schema' ? 'var(--selected-ui)' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: mode === 'schema' ? 'var(--text-01)' : 'var(--text-02)',
              fontSize: 14, fontFamily: 'inherit',
              borderBottom: mode === 'schema' ? '2px solid var(--focus)' : '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <Icon name="settings" size={16} /> Schema
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right-side actions */}
        <button className="btn-icon" onClick={undo} title="Undo (⌘Z)"><Icon name="undo" size={16} /></button>
        <button className="btn-icon" onClick={redo} title="Redo"><Icon name="redo" size={16} /></button>
        <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 8px' }} />
        {mode === 'tree' && (
          <>
            <button className="btn-icon" onClick={expandAll} title="Expand all"><Icon name="chevronDown" size={16} /></button>
            <button className="btn-icon" onClick={collapseAll} title="Collapse all"><Icon name="chevronUp" size={16} /></button>
            <div style={{ width: 1, height: 24, background: 'var(--border-subtle)', margin: '0 8px' }} />
            <button
              className="btn-icon"
              onClick={() => setRightPane('properties')}
              title="Properties"
              style={{ background: rightPane === 'properties' ? 'var(--selected-ui)' : undefined }}
            >
              <Icon name="settings" size={16} />
            </button>
            <button
              className="btn-icon"
              onClick={() => setRightPane('json')}
              title="JSON"
              style={{ background: rightPane === 'json' ? 'var(--selected-ui)' : undefined }}
            >
              <Icon name="code" size={16} />
            </button>
            {rightOpen ? (
              <button className="btn-icon" onClick={() => setRightOpen(false)} title="Close panel">
                <Icon name="close" size={16} />
              </button>
            ) : (
              <button className="btn-icon" onClick={() => setRightOpen(true)} title="Open panel">
                <Icon name="view" size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {mode === 'tree' ? (
          <>
            {/* Center — tree */}
            <div style={{
              flex: 1, overflow: 'auto',
              padding: '16px 24px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                marginBottom: 16, gap: 12,
              }}>
                <span className="t-heading-04" style={{ color: 'var(--text-01)', fontWeight: 400 }}>
                  Processing Tree
                </span>
                <span className="t-heading-04" style={{ color: 'var(--text-03)', fontWeight: 300 }}>
                  Live
                </span>
                <div style={{ flex: 1 }} />
                <AddRootButton types={types} rootAllowed={rootAllowed} onAdd={(tid) => addChild(null, tid)} />
              </div>

              <TreeView
                tree={tree}
                types={types}
                nesting={nesting}
                rootAllowed={rootAllowed}
                selectedId={selectedId}
                expandedSet={expanded}
                dragState={dragState}
                dragHandlers={dragHandlers}
                onSelect={(id) => { setSelectedId(id); if (id) setRightOpen(true); }}
                onToggleExpand={toggleExpand}
                onOpenMenu={openMenu}
                onEditorOpen={(id) => { setSelectedId(id); setRightPane('properties'); setRightOpen(true); }}
                onAddChild={addChild}
              />

              {tree.length === 0 && (
                <div style={{
                  padding: 48, textAlign: 'center',
                  color: 'var(--text-03)',
                  border: '1px dashed var(--border-subtle)',
                }}>
                  <div className="t-heading-03" style={{ color: 'var(--text-02)', marginBottom: 8 }}>
                    Empty tree
                  </div>
                  <div className="t-body-01">
                    Click "Add" above to create a root node.
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            {rightOpen && (
              <div style={{
                width: 620, borderLeft: '1px solid var(--border-subtle)',
                background: 'var(--ui-bg)',
                display: 'flex', flexDirection: 'column',
                flexShrink: 0,
              }}>
                {rightPane === 'properties' ? (
                  <PropertyPanel
                    node={selectedNode}
                    type={selectedType}
                    parentLabel={parentLabel}
                    types={types}
                    typeById={typeById}
                    onChange={(patch) => updateNodeData(selectedId, patch)}
                    onClose={() => { setSelectedId(null); setRightOpen(false); }}
                    onDelete={() => deleteNode(selectedId)}
                    onDuplicate={() => duplicateNode(selectedId)}
                  />
                ) : (
                  <JsonView
                    tree={tree}
                    types={types}
                    selectedId={selectedId}
                    onSelectNode={setSelectedId}
                    onImport={importJson}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <SchemaEditor
            types={types}
            nesting={nesting}
            rootAllowed={rootAllowed}
            onChange={applySchemaChange}
          />
        )}
      </div>

      {/* DnD invalid banner */}
      {dragState.dragging && dragState.hoverId && dragState.hoverValid === false && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--danger)', color: '#fff',
          padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8,
          zIndex: 100, pointerEvents: 'none',
        }}>
          <Icon name="warning" size={16} />
          <span className="t-body-01">Invalid drop — nesting rule blocks this</span>
        </div>
      )}

      <ContextMenu open={menu.open} anchor={menu.anchor} items={menuItems} onClose={closeMenu} />
    </div>
  );
}

function getDefaultExpanded(tree) {
  const s = [];
  const walk = (arr, depth) => arr.forEach(n => {
    if (depth < 2) s.push(n.id);
    walk(n.children, depth + 1);
  });
  walk(tree, 0);
  return s;
}

function reassignIds(n) {
  n.id = uid();
  n.children.forEach(reassignIds);
}

function AddRootButton({ types, rootAllowed, onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const allowed = types.filter(t => rootAllowed[t.id]);
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="btn btn-primary"
        style={{ minWidth: 100 }}
        onClick={() => setOpen(v => !v)}
      >
        Add <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: 'var(--ui-02)', border: '1px solid var(--border-subtle)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          zIndex: 100, minWidth: 200,
        }}>
          {allowed.length === 0 ? (
            <div style={{ padding: 12, color: 'var(--text-03)' }} className="t-body-01">
              No root types allowed. Edit Schema → Nesting.
            </div>
          ) : allowed.map(t => (
            <button
              key={t.id}
              onClick={() => { onAdd(t.id); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', border: 'none', background: 'transparent',
                color: 'var(--text-01)', padding: '10px 16px',
                cursor: 'pointer', textAlign: 'left',
                fontSize: 14, fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-ui)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Icon name={t.icon} size={16} color={t.color} />
              Add {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { App, AddRootButton, ContextMenu, useDragDrop });
