// Tree utilities + seed data
// Tree node: { id, typeId, data: {[fieldId]: value}, children: [] }

function uid() {
  return 'n_' + Math.random().toString(36).slice(2, 10);
}

function makeNode(typeId, types, data = null) {
  const t = types.find(x => x.id === typeId);
  const filled = {};
  if (t) {
    for (const f of t.fields) filled[f.id] = f.default;
  }
  return {
    id: uid(),
    typeId,
    data: { ...filled, ...(data || {}) },
    children: [],
  };
}

function findNode(tree, id) {
  for (const n of tree) {
    if (n.id === id) return n;
    const f = findNode(n.children, id);
    if (f) return f;
  }
  return null;
}

function findParentOf(tree, id, parent = null) {
  for (const n of tree) {
    if (n.id === id) return parent;
    const f = findParentOf(n.children, id, n);
    if (f !== null) return f;
  }
  return null;
}

// Find siblings array that contains id; returns { arr, index, parent }
function locate(tree, id, parent = null) {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === id) return { arr: tree, index: i, parent };
    const f = locate(tree[i].children, id, tree[i]);
    if (f) return f;
  }
  return null;
}

function isDescendant(node, targetId) {
  if (node.id === targetId) return true;
  return node.children.some(c => isDescendant(c, targetId));
}

function countNodes(tree) {
  let n = 0;
  for (const x of tree) n += 1 + countNodes(x.children);
  return n;
}

function countChildren(node) { return node.children.length; }

// Deep clone
function cloneTree(tree) {
  return tree.map(n => ({
    id: n.id, typeId: n.typeId,
    data: { ...n.data },
    children: cloneTree(n.children),
  }));
}

// Seed — Curriculum → Grades → Lessons → Exercises → Interactions
function buildSeedTree(types) {
  const mk = (typeId, data, children = []) => {
    const n = makeNode(typeId, types, data);
    n.children = children;
    return n;
  };

  const interaction = (prompt, kind) => mk('interaction', { prompt, kind, correct: '' });

  const exercise = (title, difficulty, interactions) =>
    mk('exercise', { title, difficulty, points: difficulty === 'hard' ? 30 : 10 }, interactions);

  const lesson = (title, duration, exercises) =>
    mk('lesson', { title, duration, status: 'published', objective: '' }, exercises);

  const grade = (name, level, lessons) =>
    mk('grade', { name, level, ageRange: `${5 + level}–${6 + level}` }, lessons);

  return [
    mk('curriculum', {
      title: 'Early Readers Curriculum',
      language: 'English',
      version: '2.1',
      published: true,
    }, [
      grade('Grade 1', 1, [
        lesson('Phonics: Letter Sounds', 25, [
          exercise('Match letters to sounds', 'easy', [
            interaction('Which letter makes the "buh" sound?', 'multiple-choice'),
            interaction('Drag the letter B to the picture', 'drag-drop'),
            interaction('Type the first letter of "ball"', 'text-input'),
          ]),
          exercise('Sound identification', 'medium', [
            interaction('Listen and tap the matching sound', 'matching'),
            interaction('Order the sounds you hear', 'ordering'),
          ]),
        ]),
        lesson('Sight Words: Set 1', 30, [
          exercise('Read the word', 'easy', [
            interaction('Which word is "the"?', 'multiple-choice'),
            interaction('Type "and"', 'text-input'),
          ]),
        ]),
      ]),
      grade('Grade 2', 2, [
        lesson('Reading Fluency', 40, [
          exercise('Read aloud passage', 'medium', [
            interaction('Record yourself reading', 'text-input'),
          ]),
          exercise('Comprehension questions', 'hard', [
            interaction('What happened first?', 'ordering'),
            interaction('Who is the main character?', 'multiple-choice'),
          ]),
        ]),
      ]),
    ]),
  ];
}

// Pluralize a type name — very simple English rules.
function pluralize(name) {
  if (!name) return 'items';
  const lower = name.toLowerCase();
  if (/[^aeiou]y$/.test(lower)) return lower.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/.test(lower)) return lower + 'es';
  return lower + 's';
}

function typeCollectionKey(t) {
  if (!t) return 'items';
  if (t.collectionKey && t.collectionKey.trim()) return t.collectionKey.trim();
  return pluralize(t.name);
}

function typeSingularKey(t) {
  if (!t) return 'item';
  return (t.name || 'item').toLowerCase().replace(/\s+/g, '_');
}

// Filter out hidden fields
function visibleData(node, type) {
  const out = {};
  if (!type) return { ...node.data };
  for (const f of type.fields) {
    if (f.hidden) continue;
    if (node.data[f.id] !== undefined) out[f.id] = node.data[f.id];
  }
  return out;
}

// Export formats:
// - 'clean':  group children by type under pluralized keys; single-type children stay as clean array
// - 'typed':  __type + __id markers, children in single array
// - 'raw':    fields only, children as nested array
function treeToJson(tree, types, mode = 'clean') {
  const byId = Object.fromEntries(types.map(t => [t.id, t]));

  const groupChildren = (children) => {
    // Group by typeId preserving first-seen order of types
    const groups = new Map();
    for (const c of children) {
      if (!groups.has(c.typeId)) groups.set(c.typeId, []);
      groups.get(c.typeId).push(c);
    }
    return groups;
  };

  const mapTyped = (n) => {
    const t = byId[n.typeId];
    return {
      __type: t ? t.name : n.typeId,
      __id: n.id,
      ...visibleData(n, t),
      ...(n.children.length ? { children: n.children.map(mapTyped) } : {}),
    };
  };

  const mapRaw = (n) => {
    const t = byId[n.typeId];
    return {
      ...visibleData(n, t),
      ...(n.children.length ? { children: n.children.map(mapRaw) } : {}),
    };
  };

  const mapClean = (n) => {
    const t = byId[n.typeId];
    const base = { ...visibleData(n, t) };
    if (n.children.length === 0) return base;
    const groups = groupChildren(n.children);
    // Always place each child-type under its plural key.
    for (const [typeId, kids] of groups) {
      const ct = byId[typeId];
      const key = typeCollectionKey(ct);
      base[key] = kids.map(mapClean);
    }
    return base;
  };

  const mapper = mode === 'typed' ? mapTyped : mode === 'raw' ? mapRaw : mapClean;

  // Root: if clean, wrap each root node under its type's singular key when single root,
  // otherwise group roots by type.
  if (mode === 'clean') {
    if (tree.length === 1) {
      const root = tree[0];
      const t = byId[root.typeId];
      return { [typeSingularKey(t)]: mapper(root) };
    }
    const groups = groupChildren(tree);
    const out = {};
    for (const [typeId, nodes] of groups) {
      const ct = byId[typeId];
      out[typeCollectionKey(ct)] = nodes.map(mapper);
    }
    return out;
  }
  return tree.map(mapper);
}

function jsonToTree(json, types) {
  const byName = Object.fromEntries(types.map(t => [t.name.toLowerCase(), t]));
  const byId = Object.fromEntries(types.map(t => [t.id, t]));
  const byCollection = {};
  const bySingular = {};
  for (const t of types) {
    byCollection[typeCollectionKey(t)] = t;
    bySingular[typeSingularKey(t)] = t;
  }
  const fieldIdsByType = Object.fromEntries(
    types.map(t => [t.id, new Set(t.fields.map(f => f.id))])
  );

  // Parse an entry with an explicitly known type (clean/raw formats)
  const parseAs = (entry, t) => {
    if (!entry || typeof entry !== 'object') return null;
    const data = {};
    const children = [];
    const fids = fieldIdsByType[t.id] || new Set();
    for (const [k, v] of Object.entries(entry)) {
      if (k === '__type' || k === '__id' || k === 'type') continue;
      if (k === 'children' && Array.isArray(v)) {
        for (const c of v) { const p = parseAny(c); if (p) children.push(p); }
        continue;
      }
      // If key matches a known collection plural, treat contents as children of that type.
      const ct = byCollection[k];
      if (ct && Array.isArray(v)) {
        for (const c of v) { const p = parseAs(c, ct); if (p) children.push(p); }
        continue;
      }
      // If key matches a singular type name and value is object, treat as single child
      const st = bySingular[k];
      if (st && v && typeof v === 'object' && !Array.isArray(v) && !fids.has(k)) {
        const p = parseAs(v, st); if (p) children.push(p);
        continue;
      }
      // Otherwise treat as data field
      data[k] = v;
    }
    const n = makeNode(t.id, types, data);
    n.children = children;
    return n;
  };

  const parseAny = (entry) => {
    if (!entry || typeof entry !== 'object') return null;
    const typeKey = entry.__type || entry.type;
    if (typeKey) {
      const t = byName[String(typeKey).toLowerCase()] || byId[typeKey];
      if (t) return parseAs(entry, t);
    }
    // Infer from the first type
    return parseAs(entry, types[0]);
  };

  // Top-level — may be array, a typed entry, or a clean object keyed by collections/singular
  if (Array.isArray(json)) return json.map(parseAny).filter(Boolean);
  if (json && typeof json === 'object') {
    // Check if keys match known collection/singular names (clean format)
    const keys = Object.keys(json);
    const isCleanRoot = keys.length > 0 && keys.every(k =>
      byCollection[k] || bySingular[k] || k === '__type' || k === '__id'
    );
    if (isCleanRoot && !(json.__type)) {
      const roots = [];
      for (const k of keys) {
        const ct = byCollection[k];
        const st = bySingular[k];
        if (ct && Array.isArray(json[k])) {
          for (const c of json[k]) { const p = parseAs(c, ct); if (p) roots.push(p); }
        } else if (st && json[k] && typeof json[k] === 'object') {
          const p = parseAs(json[k], st); if (p) roots.push(p);
        }
      }
      return roots;
    }
    const one = parseAny(json);
    return one ? [one] : [];
  }
  return [];
}

Object.assign(window, {
  uid, makeNode, findNode, findParentOf, locate,
  isDescendant, countNodes, countChildren, cloneTree,
  buildSeedTree, treeToJson, jsonToTree,
  pluralize, typeCollectionKey, typeSingularKey, visibleData,
});
