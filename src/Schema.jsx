// Schema store — node types, nesting matrix, and schema editor state.
// Each node type defines: id, name, icon, color, fields[].
// Nesting matrix: { [parentTypeId]: { [childTypeId]: true|false } }.

const DEFAULT_TYPES = [
  {
    id: 'curriculum',
    name: 'Curriculum',
    icon: 'book',
    color: '#08bdba',
    fields: [
      { id: 'title', name: 'Title', type: 'string', default: '' },
      { id: 'language', name: 'Language', type: 'select', default: 'English',
        options: ['English', 'Spanish', 'German', 'French', 'Russian'] },
      { id: 'version', name: 'Version', type: 'string', default: '1.0' },
      { id: 'published', name: 'Published', type: 'boolean', default: false },
    ],
  },
  {
    id: 'grade',
    name: 'Grade',
    icon: 'layers',
    color: '#ff832b',
    fields: [
      { id: 'name', name: 'Name', type: 'string', default: '' },
      { id: 'level', name: 'Level', type: 'number', default: 1 },
      { id: 'ageRange', name: 'Age Range', type: 'string', default: '' },
    ],
  },
  {
    id: 'lesson',
    name: 'Lesson',
    icon: 'flow',
    color: '#4589ff',
    fields: [
      { id: 'title', name: 'Title', type: 'string', default: '' },
      { id: 'duration', name: 'Duration (min)', type: 'number', default: 30 },
      { id: 'objective', name: 'Objective', type: 'string', default: '' },
      { id: 'status', name: 'Status', type: 'select', default: 'draft',
        options: ['draft', 'review', 'published', 'archived'] },
    ],
  },
  {
    id: 'exercise',
    name: 'Exercise',
    icon: 'task',
    color: '#a56eff',
    fields: [
      { id: 'title', name: 'Title', type: 'string', default: '' },
      { id: 'difficulty', name: 'Difficulty', type: 'select', default: 'easy',
        options: ['easy', 'medium', 'hard'] },
      { id: 'points', name: 'Points', type: 'number', default: 10 },
      { id: 'instructions', name: 'Instructions', type: 'string', default: '' },
    ],
  },
  {
    id: 'interaction',
    name: 'Interaction',
    icon: 'lightning',
    color: '#f1c21b',
    fields: [
      { id: 'prompt', name: 'Prompt', type: 'string', default: '' },
      { id: 'kind', name: 'Kind', type: 'select', default: 'multiple-choice',
        options: ['multiple-choice', 'text-input', 'drag-drop', 'matching', 'ordering'] },
      { id: 'correct', name: 'Correct Answer', type: 'string', default: '' },
      { id: 'config', name: 'Config (JSON)', type: 'json', default: {} },
    ],
  },
];

// Nesting matrix: parent -> children allowed
// Default: Curriculum → Grade → Lesson → Exercise → Interaction
const DEFAULT_NESTING = {
  curriculum: { grade: true, lesson: false, exercise: false, interaction: false },
  grade:      { curriculum: false, lesson: true, exercise: false, interaction: false },
  lesson:     { curriculum: false, grade: false, exercise: true, interaction: false },
  exercise:   { curriculum: false, grade: false, lesson: false, interaction: true },
  interaction:{ curriculum: false, grade: false, lesson: false, exercise: false },
};

// Which types are allowed at the root
const DEFAULT_ROOT_ALLOWED = { curriculum: true };

// Field types for schema editor
const FIELD_TYPES = [
  { id: 'string', name: 'String' },
  { id: 'number', name: 'Number' },
  { id: 'boolean', name: 'Boolean' },
  { id: 'select', name: 'Select' },
  { id: 'json', name: 'JSON' },
];

// Available colors for node type chips (Carbon accent set)
const TYPE_COLORS = [
  { name: 'Teal',    value: '#08bdba' },
  { name: 'Orange',  value: '#ff832b' },
  { name: 'Blue',    value: '#4589ff' },
  { name: 'Purple',  value: '#a56eff' },
  { name: 'Yellow',  value: '#f1c21b' },
  { name: 'Green',   value: '#42be65' },
  { name: 'Magenta', value: '#ee5396' },
  { name: 'Cyan',    value: '#1192e8' },
  { name: 'Red',     value: '#fa4d56' },
  { name: 'Gray',    value: '#8d8d8d' },
];

Object.assign(window, {
  DEFAULT_TYPES, DEFAULT_NESTING, DEFAULT_ROOT_ALLOWED,
  FIELD_TYPES, TYPE_COLORS,
});
