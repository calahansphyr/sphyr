// ARIA utility functions for comprehensive accessibility support

export interface ARIAProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-invalid'?: boolean | 'grammar' | 'spelling';
  'aria-required'?: boolean;
  'aria-readonly'?: boolean;
  'aria-multiselectable'?: boolean;
  'aria-orientation'?: 'horizontal' | 'vertical';
  'aria-sort'?: 'none' | 'ascending' | 'descending' | 'other';
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-level'?: number;
  'aria-posinset'?: number;
  'aria-setsize'?: number;
  'aria-flowto'?: string;
  'aria-activedescendant'?: string;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
  'aria-complete'?: boolean;
  'aria-dropeffect'?: 'none' | 'copy' | 'execute' | 'link' | 'move' | 'popup';
  'aria-grabbed'?: boolean;
  'aria-relevant'?: 'additions' | 'removals' | 'text' | 'all';
  'aria-modal'?: boolean;
  'aria-multiline'?: boolean;
  'aria-placeholder'?: string;
  'aria-pressed'?: boolean | 'mixed';
  'aria-secret'?: boolean;
  'aria-colspan'?: number;
  'aria-rowspan'?: number;
}

// Generate ARIA attributes for common UI patterns
export const ARIAUtils = {
  // Button ARIA attributes
  button: (options: {
    label?: string;
    expanded?: boolean;
    pressed?: boolean;
    disabled?: boolean;
    controls?: string;
    describedby?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-expanded': options.expanded,
    'aria-pressed': options.pressed,
    'aria-disabled': options.disabled,
    'aria-controls': options.controls,
    'aria-describedby': options.describedby
  }),

  // Input ARIA attributes
  input: (options: {
    label?: string;
    required?: boolean;
    invalid?: boolean;
    describedby?: string;
    autocomplete?: 'none' | 'inline' | 'list' | 'both';
    placeholder?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-required': options.required,
    'aria-invalid': options.invalid,
    'aria-describedby': options.describedby,
    'aria-autocomplete': options.autocomplete,
    'aria-placeholder': options.placeholder
  }),

  // List ARIA attributes
  list: (options: {
    label?: string;
    multiselectable?: boolean;
    orientation?: 'horizontal' | 'vertical';
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-multiselectable': options.multiselectable,
    'aria-orientation': options.orientation
  }),

  // List item ARIA attributes
  listItem: (options: {
    selected?: boolean;
    level?: number;
    posinset?: number;
    setsize?: number;
  } = {}): ARIAProps => ({
    'aria-selected': options.selected,
    'aria-level': options.level,
    'aria-posinset': options.posinset,
    'aria-setsize': options.setsize
  }),

  // Dialog ARIA attributes
  dialog: (options: {
    label?: string;
    modal?: boolean;
    describedby?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-modal': options.modal,
    'aria-describedby': options.describedby
  }),

  // Tab ARIA attributes
  tab: (options: {
    selected?: boolean;
    controls?: string;
    describedby?: string;
  } = {}): ARIAProps => ({
    'aria-selected': options.selected,
    'aria-controls': options.controls,
    'aria-describedby': options.describedby
  }),

  // Tab panel ARIA attributes
  tabPanel: (options: {
    labelledby?: string;
    describedby?: string;
  } = {}): ARIAProps => ({
    'aria-labelledby': options.labelledby,
    'aria-describedby': options.describedby
  }),

  // Progress bar ARIA attributes
  progressBar: (options: {
    label?: string;
    valuemin?: number;
    valuemax?: number;
    valuenow?: number;
    valuetext?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-valuemin': options.valuemin,
    'aria-valuemax': options.valuemax,
    'aria-valuenow': options.valuenow,
    'aria-valuetext': options.valuetext
  }),

  // Slider ARIA attributes
  slider: (options: {
    label?: string;
    valuemin?: number;
    valuemax?: number;
    valuenow?: number;
    valuetext?: string;
    orientation?: 'horizontal' | 'vertical';
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-valuemin': options.valuemin,
    'aria-valuemax': options.valuemax,
    'aria-valuenow': options.valuenow,
    'aria-valuetext': options.valuetext,
    'aria-orientation': options.orientation
  }),

  // Checkbox ARIA attributes
  checkbox: (options: {
    label?: string;
    checked?: boolean | 'mixed';
    required?: boolean;
    describedby?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-checked': options.checked,
    'aria-required': options.required,
    'aria-describedby': options.describedby
  }),

  // Radio button ARIA attributes
  radio: (options: {
    label?: string;
    checked?: boolean;
    required?: boolean;
    describedby?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-checked': options.checked,
    'aria-required': options.required,
    'aria-describedby': options.describedby
  }),

  // Live region ARIA attributes
  liveRegion: (options: {
    live?: 'off' | 'polite' | 'assertive';
    atomic?: boolean;
    busy?: boolean;
  } = {}): ARIAProps => ({
    'aria-live': options.live,
    'aria-atomic': options.atomic,
    'aria-busy': options.busy
  }),

  // Menu ARIA attributes
  menu: (options: {
    label?: string;
    orientation?: 'horizontal' | 'vertical';
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-orientation': options.orientation
  }),

  // Menu item ARIA attributes
  menuItem: (options: {
    checked?: boolean | 'mixed';
    disabled?: boolean;
    haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  } = {}): ARIAProps => ({
    'aria-checked': options.checked,
    'aria-disabled': options.disabled,
    'aria-haspopup': options.haspopup
  }),

  // Tree ARIA attributes
  tree: (options: {
    label?: string;
    multiselectable?: boolean;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-multiselectable': options.multiselectable
  }),

  // Tree item ARIA attributes
  treeItem: (options: {
    expanded?: boolean;
    selected?: boolean;
    level?: number;
    posinset?: number;
    setsize?: number;
  } = {}): ARIAProps => ({
    'aria-expanded': options.expanded,
    'aria-selected': options.selected,
    'aria-level': options.level,
    'aria-posinset': options.posinset,
    'aria-setsize': options.setsize
  }),

  // Grid ARIA attributes
  grid: (options: {
    label?: string;
    multiselectable?: boolean;
    activedescendant?: string;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-multiselectable': options.multiselectable,
    'aria-activedescendant': options.activedescendant
  }),

  // Grid cell ARIA attributes
  gridCell: (options: {
    selected?: boolean;
    colspan?: number;
    rowspan?: number;
  } = {}): ARIAProps => ({
    'aria-selected': options.selected,
    'aria-colspan': options.colspan,
    'aria-rowspan': options.rowspan
  }),

  // Combobox ARIA attributes
  combobox: (options: {
    label?: string;
    expanded?: boolean;
    autocomplete?: 'none' | 'inline' | 'list' | 'both';
    activedescendant?: string;
    required?: boolean;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-expanded': options.expanded,
    'aria-autocomplete': options.autocomplete,
    'aria-activedescendant': options.activedescendant,
    'aria-required': options.required
  }),

  // Listbox ARIA attributes
  listbox: (options: {
    label?: string;
    multiselectable?: boolean;
    activedescendant?: string;
    required?: boolean;
  } = {}): ARIAProps => ({
    'aria-label': options.label,
    'aria-multiselectable': options.multiselectable,
    'aria-activedescendant': options.activedescendant,
    'aria-required': options.required
  }),

  // Option ARIA attributes
  option: (options: {
    selected?: boolean;
    disabled?: boolean;
  } = {}): ARIAProps => ({
    'aria-selected': options.selected,
    'aria-disabled': options.disabled
  })
};

// Utility function to merge ARIA props
export function mergeARIAProps(...props: ARIAProps[]): ARIAProps {
  return props.reduce((acc, prop) => ({ ...acc, ...prop }), {});
}

// Utility function to filter out undefined ARIA props
export function filterARIAProps(props: ARIAProps): ARIAProps {
  return Object.entries(props).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof ARIAProps] = value;
    }
    return acc;
  }, {} as ARIAProps);
}

// Utility function to generate unique IDs for ARIA relationships
export function generateARIAId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

// Utility function to create ARIA relationships
export function createARIARelationship(
  elementId: string,
  relatedElementIds: string[]
): { 'aria-labelledby'?: string; 'aria-describedby'?: string; 'aria-controls'?: string } {
  return {
    'aria-labelledby': relatedElementIds.join(' '),
    'aria-describedby': relatedElementIds.join(' '),
    'aria-controls': relatedElementIds.join(' ')
  };
}

export default ARIAUtils;
