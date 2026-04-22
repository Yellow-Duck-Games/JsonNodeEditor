// Carbon-style 16/20px SVG icons used in the app.
// Exposed on window for cross-script access.

const IconPaths = {
  // 16×16 Carbon glyphs
  chevronDown: 'M8 11L3 6l0.7-0.7L8 9.6l4.3-4.3L13 6z',
  chevronRight: 'M6 3l5 5-5 5-0.7-0.7L9.6 8 5.3 3.7z',
  chevronUp: 'M8 5l5 5-0.7 0.7L8 6.4l-4.3 4.3L3 10z',
  add: 'M8.5 7.5V3h-1v4.5H3v1h4.5V13h1V8.5H13v-1z',
  close: 'M12 4.7L11.3 4 8 7.3 4.7 4 4 4.7 7.3 8 4 11.3l0.7 0.7L8 8.7l3.3 3.3 0.7-0.7L8.7 8z',
  overflow: 'M9 13a1 1 0 11-2 0 1 1 0 012 0zm0-5a1 1 0 11-2 0 1 1 0 012 0zm0-5a1 1 0 11-2 0 1 1 0 012 0z',
  search: 'M14.7 13.3l-3.1-3.1a5.5 5.5 0 10-.7.7l3.1 3.1zM3 6.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z',
  trash: 'M12 4h-2V3a1 1 0 00-1-1H7a1 1 0 00-1 1v1H4v1h1v8a1 1 0 001 1h4a1 1 0 001-1V5h1zM7 3h2v1H7zM10 13H6V5h4zM7 6h1v6H7zm2 0h1v6H9z',
  copy: 'M12 2H5a1 1 0 00-1 1v1H3a1 1 0 00-1 1v8a1 1 0 001 1h7a1 1 0 001-1v-1h1a1 1 0 001-1V3a1 1 0 00-1-1zm-2 11H3V5h7zm2-2h-1V5a1 1 0 00-1-1H5V3h7z',
  edit: 'M10.3 4l1.4 1.4-7 7H3.3v-1.4l7-7M10.3 2a.5.5 0 00-.4.2L2.5 9.6v3.9h3.9l7.4-7.4a.5.5 0 000-.7L11 2.2a.5.5 0 00-.7-.2z',
  save: 'M13.3 2H2.7A.7.7 0 002 2.7v10.6a.7.7 0 00.7.7h10.6a.7.7 0 00.7-.7V2.7a.7.7 0 00-.7-.7zM5 3h6v3H5zm8 10H3V3h1v4h8V3h1z',
  check: 'M6.5 11.4L3.6 8.5l0.7-0.7L6.5 10l5.2-5.2 0.7 0.7z',
  checkCircle: 'M8 1a7 7 0 100 14A7 7 0 008 1zM7 11.4L3.6 8l0.7-0.7L7 10l5.2-5.2 0.7 0.7z',
  flash: 'M10 1H9L3.5 8.5H7L6 15h1l5.5-7.5H9z',
  undo: 'M12.5 6h-7V3L2 6.5 5.5 10V7h7a1 1 0 010 2H9v1h3.5a2 2 0 000-4z',
  redo: 'M3.5 6h7V3L14 6.5 10.5 10V7h-7a1 1 0 000 2H7v1H3.5a2 2 0 010-4z',
  view: 'M8 3C4.5 3 1.6 5.5 1 8c0.6 2.5 3.5 5 7 5s6.4-2.5 7-5c-0.6-2.5-3.5-5-7-5zm0 8a3 3 0 110-6 3 3 0 010 6zm0-5a2 2 0 100 4 2 2 0 000-4z',
  viewOff: 'M2 3.3L2.7 2.6 13.4 13.3 12.7 14 10.9 12.2A8 8 0 018 13c-3.5 0-6.4-2.5-7-5A8 8 0 013.6 4.9zM8 5a3 3 0 012.6 4.5L9.3 8.2a2 2 0 00-2.5-2.5L5.5 4.4A8 8 0 018 3c3.5 0 6.4 2.5 7 5-0.2 0.7-0.5 1.3-0.9 1.9',
  upload: 'M8 1L3 6h3v5h4V6h3zM3 13v2h10v-2h-1v1H4v-1z',
  download: 'M13 9v4H3V9H2v5h12V9zm-5 3L5 8h2V3h2v5h2z',
  drag: 'M6 3a1 1 0 112 0 1 1 0 01-2 0zm0 5a1 1 0 112 0 1 1 0 01-2 0zm0 5a1 1 0 112 0 1 1 0 01-2 0zm4-10a1 1 0 112 0 1 1 0 01-2 0zm0 5a1 1 0 112 0 1 1 0 01-2 0zm0 5a1 1 0 112 0 1 1 0 01-2 0z',
  settings: 'M13.6 6.7l1.3-0.9-1.5-2.6-1.5 0.5a5.5 5.5 0 00-0.9-0.5L10.5 1.5h-3l-0.5 1.7a5.5 5.5 0 00-0.9 0.5L3.6 3.2 2.1 5.8l1.3 0.9a5.5 5.5 0 000 1l-1.3 0.9 1.5 2.6 1.5-0.5a5.5 5.5 0 00.9.5l0.5 1.7h3l0.5-1.7a5.5 5.5 0 00.9-0.5l1.5 0.5 1.5-2.6-1.3-0.9a5.5 5.5 0 000-1zM9 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z',
  code: 'M5.5 11.5L2 8l3.5-3.5 0.7 0.7L3.4 8l2.8 2.8zm5 0l-0.7-0.7L12.6 8l-2.8-2.8 0.7-0.7L14 8z',
  warning: 'M8 1l7 13H1zm0 4v5h1V5zm0 7h1v-1H8z',
  // Node-type icons
  book: 'M12 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V2a1 1 0 00-1-1zM4 2h7v11H5a1 1 0 00-1 0.3V2zm1 12a1 1 0 01-1-1 1 1 0 011-1h7v2z',
  layers: 'M8 1L1 4.5 8 8l7-3.5zM1 8l7 3.5L15 8l-1.5-0.75L8 9.75 2.5 7.25zM1 11.5L8 15l7-3.5-1.5-0.75L8 13.25 2.5 10.75z',
  flow: 'M11 8a2 2 0 00-1.7 1H7V7a1 1 0 00-1-1H5a2 2 0 100 2h1v2h3.3a2 2 0 104-1zm-8-1a1 1 0 110-2 1 1 0 010 2zm8 4a1 1 0 110-2 1 1 0 010 2z',
  task: 'M13 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1zm0 11H3V3h10zM6.5 8.5L5 7l0.7-0.7L6.5 7l3.3-3.3 0.7 0.7z',
  user: 'M8 1a4 4 0 100 8 4 4 0 000-8zm0 7a3 3 0 110-6 3 3 0 010 6zm6 7v-2a3 3 0 00-3-3H5a3 3 0 00-3 3v2h1v-2a2 2 0 012-2h6a2 2 0 012 2v2z',
  target: 'M8 1a7 7 0 100 14A7 7 0 008 1zm0 13a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6zm0 5a2 2 0 110-4 2 2 0 010 4z',
  grid: 'M2 2h5v5H2zm0 7h5v5H2zm7-7h5v5H9zm0 7h5v5H9z',
  box: 'M14 4.3L8 1 2 4.3v7.4L8 15l6-3.3zM8 2.1l4.8 2.6L8 7.3 3.2 4.7zM3 5.6l4.5 2.5V13.7L3 11.2zm5.5 8.1V8.1L13 5.6v5.6z',
  play: 'M5 3v10l8-5z',
  puzzle: 'M13 7h-1V5a1 1 0 00-1-1H9V3a2 2 0 10-4 0v1H3a1 1 0 00-1 1v2h1a2 2 0 110 4H2v2a1 1 0 001 1h2v-1a2 2 0 114 0v1h2a1 1 0 001-1v-2h1a2 2 0 100-4z',
  filter: 'M2 3v1l5 6v4l2 1V10l5-6V3z',
  shield: 'M8 1L2 3v4c0 4 3 7 6 8 3-1 6-4 6-8V3zm5 6c0 3.3-2.3 5.9-5 6.9-2.7-1-5-3.6-5-6.9V3.7L8 2.1l5 1.6z',
  lightning: 'M10 1H5L3 9h3l-1 6 6-9H8z',
  circle: 'M8 2a6 6 0 100 12A6 6 0 008 2z',
  square: 'M3 3h10v10H3z',
  diamond: 'M8 1l7 7-7 7-7-7z',
  star: 'M8 1l2.2 4.5L15 6l-3.5 3.4L12.3 15 8 12.5 3.7 15l0.8-5L1 6l4.8-0.5z',
};

function Icon({ name, size = 16, className = '', style = {}, color = 'currentColor' }) {
  const path = IconPaths[name];
  if (!path) return null;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={color}
      className={className}
      style={{ flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}

// Map of selectable icons for node types (name, label)
const NODE_ICONS = [
  'book', 'layers', 'flow', 'task', 'user', 'target',
  'grid', 'box', 'play', 'puzzle', 'filter', 'shield',
  'lightning', 'circle', 'square', 'diamond', 'star', 'code',
];

Object.assign(window, { Icon, IconPaths, NODE_ICONS });
