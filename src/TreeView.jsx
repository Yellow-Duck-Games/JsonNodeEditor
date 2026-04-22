// TreeView — the main node tree canvas with drag-and-drop.
// Props: tree, types, nesting, rootAllowed, selectedId, onSelect,
//        onMove(nodeId, destParentId|null, index), onAddChild(parentId, typeId),
//        onDuplicate(id), onDelete(id), onEditorOpen(id), expandedState
const { useState, useRef, useEffect, useMemo, useCallback } = React;

// BranchContainer: flex column that, when nested (depth>0), draws a single
// continuous vertical guide running from top to the elbow (~29px) of the LAST child.
// If pathChildIndex is set, the segment from top to elbow of that child is drawn
// in the focus color (ancestor path highlight).
function BranchContainer({ depth, children, pathChildIndex }) {
  const rootRef = useRef(null);
  const [guideHeight, setGuideHeight] = useState(0);
  const [focusGuideHeight, setFocusGuideHeight] = useState(0);

  useEffect(() => {
    if (depth === 0) return;
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const kids = el.querySelectorAll(':scope > [data-branch-child="true"]');
      if (!kids.length) { setGuideHeight(0); setFocusGuideHeight(0); return; }
      const last = kids[kids.length - 1];
      const rootTop = el.getBoundingClientRect().top;
      const lastTop = last.getBoundingClientRect().top;
      setGuideHeight((lastTop - rootTop) + 29);
      if (pathChildIndex != null && kids[pathChildIndex]) {
        const pTop = kids[pathChildIndex].getBoundingClientRect().top;
        setFocusGuideHeight((pTop - rootTop) + 29);
      } else {
        setFocusGuideHeight(0);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.querySelectorAll(':scope > [data-branch-child="true"]').forEach(k => ro.observe(k));
    return () => ro.disconnect();
  });

  return (
    <div ref={rootRef} style={{
      display: 'flex', flexDirection: 'column', gap: 4,
      position: 'relative',
    }}>
      {depth > 0 && guideHeight > 0 && (
        <div style={{
          position: 'absolute', left: -20, top: 0, width: 1,
          height: guideHeight, background: 'var(--ui-04)',
          pointerEvents: 'none',
        }} />
      )}
      {depth > 0 && focusGuideHeight > 0 && (
        <div style={{
          position: 'absolute', left: -20, top: 0, width: 2,
          height: focusGuideHeight, background: 'var(--path)',
          pointerEvents: 'none', zIndex: 1,
          boxShadow: '0 0 4px var(--path-glow)',
        }} />
      )}
      {children}
    </div>
  );
}

// Connector SVG — horizontal elbow from the parent vertical guide to each child tile.
function TreeConnector() {
  return (
    <div style={{
      position: 'absolute', left: -20, top: 0, width: 20, height: 29,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, width: 1, bottom: 0,
        background: 'var(--ui-04)',
      }} />
      <div style={{
        position: 'absolute', left: 0, top: 28, width: 20, height: 1,
        background: 'var(--ui-04)',
      }} />
    </div>
  );
}

// A single tile (node card)
function NodeTile({
  node, type, depth, isLast, isFirst, parentId,
  selectedId, expandedSet, types, typeById, nesting, rootAllowed,
  dragState, dragHandlers, onSelect, onToggleExpand, onAddChild,
  onOpenMenu, onEditorOpen, testRunning, testMatched,
}) {
  const isSelected = selectedId === node.id;
  const isExpanded = expandedSet.has(node.id);
  const hasChildren = node.children.length > 0;
  const tileRef = useRef(null);

  const isDragging = dragState.dragging && dragState.draggedId === node.id;
  const isDropTarget = dragState.hoverId === node.id && dragState.hoverValid;
  const isInvalidTarget = dragState.hoverId === node.id && dragState.hoverValid === false;

  const showPlus = (isSelected || dragState.dragging === false);

  const baseBg = dragState.dragging && isDragging
    ? 'rgba(38,38,38,0.3)' : 'var(--ui-01)';

  // Left-border accent stripe colored by type
  const accent = type.color;

  const tileStyle = {
    position: 'relative',
    height: 58,
    background: baseBg,
    border: isSelected ? `1px solid ${accent}` : '1px solid transparent',
    boxShadow: isDropTarget ? `inset 0 0 0 2px ${accent}` :
               isInvalidTarget ? 'inset 0 0 0 2px var(--danger)' : 'none',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background var(--dur-fast), border-color var(--dur-fast)',
    opacity: isDragging ? 0.4 : (testRunning && !testMatched ? 0.35 : 1),
    userSelect: 'none',
  };

  return (
    <div
      ref={tileRef}
      data-node-id={node.id}
      className="node-tile"
      style={tileStyle}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
      onDoubleClick={(e) => { e.stopPropagation(); onEditorOpen(node.id); }}
      draggable
      onDragStart={(e) => dragHandlers.onDragStart(e, node.id)}
      onDragEnd={dragHandlers.onDragEnd}
      onDragOver={(e) => dragHandlers.onDragOver(e, node.id, parentId)}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={(e) => dragHandlers.onDrop(e, node.id, parentId)}
    >
      {/* Accent stripe */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: 3, background: accent,
      }} />
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={type.icon} size={16} color={accent} />
        <span className="t-heading-01" style={{
          color: 'var(--text-01)', flex: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {nodeLabel(node, type)}
        </span>
        {testMatched && (
          <Icon name="flash" size={14} color="var(--accent-yellow)" />
        )}
        {/* Action icons */}
        {canHaveChildren(type.id, nesting) && (
          <button
            className="btn-icon" style={{ width: 24, height: 24 }}
            onClick={(e) => { e.stopPropagation(); onOpenMenu(node.id, 'add', tileRef.current); }}
            title="Add child"
          >
            <Icon name="add" size={16} color="var(--icon-02)" />
          </button>
        )}
        <button
          className="btn-icon" style={{ width: 24, height: 24 }}
          onClick={(e) => { e.stopPropagation(); onOpenMenu(node.id, 'overflow', tileRef.current); }}
          title="More"
        >
          <Icon name="overflow" size={16} color="var(--icon-02)" />
        </button>
        {hasChildren && (
          <button
            className="btn-icon" style={{ width: 24, height: 24 }}
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={16} color="var(--icon-02)" />
          </button>
        )}
      </div>
      {/* Meta */}
      <div className="t-label-01" style={{ color: 'var(--text-03)', marginTop: 2 }}>
        {nodeMeta(node, type)}
      </div>
    </div>
  );
}

function nodeLabel(node, type) {
  // Prefer first string field value as label, fallback to type name
  const f = type.fields.find(ff => ff.type === 'string');
  const v = f ? node.data[f.id] : null;
  return (v && String(v).trim()) || `${type.name} ${node.id.slice(-4)}`;
}

function nodeMeta(node, type) {
  const bits = [];
  bits.push(`${node.children.length} children`);
  // Add a second meta field value if exists
  const secondary = type.fields.find(ff => ff.type === 'select' || ff.type === 'number');
  if (secondary) {
    const v = node.data[secondary.id];
    if (v !== undefined && v !== '') bits.push(`${secondary.name}: ${v}`);
  }
  return bits.join(' · ');
}

function canHaveChildren(typeId, nesting) {
  const rules = nesting[typeId] || {};
  return Object.values(rules).some(Boolean);
}

// Recursive renderer
function TreeBranch({
  nodes, depth, parentId, types, typeById, nesting, rootAllowed,
  selectedId, expandedSet, dragState, dragHandlers,
  onSelect, onToggleExpand, onOpenMenu, onEditorOpen,
  onAddChild, testHighlightSet, pathSet,
}) {
  // Index of the child in this branch that's on the selection path (for vertical focus guide)
  const pathChildIndex = pathSet
    ? nodes.findIndex(n => pathSet.has(n.id))
    : -1;

  return (
    <BranchContainer depth={depth} pathChildIndex={pathChildIndex >= 0 ? pathChildIndex : null}>
      {nodes.map((n, i) => {
        const type = typeById[n.typeId] || types[0];
        const isExpanded = expandedSet.has(n.id);
        const isLast = i === nodes.length - 1;
        const isHighlighted = testHighlightSet && testHighlightSet.has(n.id);
        const onPath = pathSet && pathSet.has(n.id);

        return (
          <div key={n.id} style={{ position: 'relative' }} data-branch-child="true">
            {depth > 0 && (
              <div style={{
                position: 'absolute', left: -20, top: 28, width: 20, height: onPath ? 2 : 1,
                background: onPath ? 'var(--path)' : 'var(--ui-04)', pointerEvents: 'none',
                zIndex: onPath ? 1 : 0,
                boxShadow: onPath ? '0 0 4px var(--path-glow)' : 'none',
              }} />
            )}
            <NodeTile
              node={n}
              type={type}
              depth={depth}
              isLast={isLast}
              isFirst={i === 0}
              parentId={parentId}
              selectedId={selectedId}
              expandedSet={expandedSet}
              types={types}
              typeById={typeById}
              nesting={nesting}
              rootAllowed={rootAllowed}
              dragState={dragState}
              dragHandlers={dragHandlers}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onOpenMenu={onOpenMenu}
              onEditorOpen={onEditorOpen}
              testRunning={!!testHighlightSet}
              testMatched={isHighlighted}
            />
            {isExpanded && n.children.length > 0 && (
              <div style={{ marginLeft: 28, marginTop: 4, position: 'relative' }}>
                <TreeBranch
                  nodes={n.children}
                  depth={depth + 1}
                  parentId={n.id}
                  types={types}
                  typeById={typeById}
                  nesting={nesting}
                  rootAllowed={rootAllowed}
                  selectedId={selectedId}
                  expandedSet={expandedSet}
                  dragState={dragState}
                  dragHandlers={dragHandlers}
                  onSelect={onSelect}
                  onToggleExpand={onToggleExpand}
                  onOpenMenu={onOpenMenu}
                  onEditorOpen={onEditorOpen}
                  onAddChild={onAddChild}
                  testHighlightSet={testHighlightSet}
                  pathSet={pathSet}
                />
              </div>
            )}
          </div>
        );
      })}
    </BranchContainer>
  );
}

function TreeView({
  tree, types, nesting, rootAllowed,
  selectedId, expandedSet, dragState, dragHandlers,
  onSelect, onToggleExpand, onOpenMenu, onEditorOpen,
  onAddChild, testHighlightSet,
}) {
  const typeById = useMemo(
    () => Object.fromEntries(types.map(t => [t.id, t])),
    [types]
  );

  // Compute ancestor path set from root to selected node
  const pathSet = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set();
    const walk = (nodes, chain) => {
      for (const n of nodes) {
        const nextChain = [...chain, n.id];
        if (n.id === selectedId) {
          nextChain.forEach(id => set.add(id));
          return true;
        }
        if (n.children && n.children.length && walk(n.children, nextChain)) return true;
      }
      return false;
    };
    walk(tree, []);
    return set.size ? set : null;
  }, [tree, selectedId]);

  return (
    <div
      style={{
        padding: '4px 8px',
        minHeight: '100%',
      }}
      onClick={() => onSelect(null)}
      onDragOver={(e) => dragHandlers.onDragOverRoot(e)}
      onDrop={(e) => dragHandlers.onDropRoot(e)}
    >
      <TreeBranch
        nodes={tree}
        depth={0}
        parentId={null}
        types={types}
        typeById={typeById}
        nesting={nesting}
        rootAllowed={rootAllowed}
        selectedId={selectedId}
        expandedSet={expandedSet}
        dragState={dragState}
        dragHandlers={dragHandlers}
        onSelect={onSelect}
        onToggleExpand={onToggleExpand}
        onOpenMenu={onOpenMenu}
        onEditorOpen={onEditorOpen}
        onAddChild={onAddChild}
        testHighlightSet={testHighlightSet}
        pathSet={pathSet}
      />
    </div>
  );
}

Object.assign(window, { TreeView, NodeTile, nodeLabel, nodeMeta, canHaveChildren });
