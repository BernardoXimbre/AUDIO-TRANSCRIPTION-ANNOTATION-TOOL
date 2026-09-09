/* eslint-disable @typescript-eslint/no-explicit-any */
export type AnnotationType = 'CRUD' | 'NUMBER' | 'FORMATTING_COMMAND' | 'SPELLED_OUT' | 'NAMED_ENTITY' | 'MEDICAL_TERM' | 'MEASUREMENT';

interface ValidateResult {
  valid: boolean;
  error?: string;
}

// Helper functions (not private since we're using an object literal)
function validateCRUD(_attributes: any): ValidateResult {
  // CRUD has no required attributes
  return { valid: true };
}

function validateNUMBER(attributes: any): ValidateResult {
  if (!attributes || typeof attributes !== 'object') {
    return { valid: false, error: 'NUMBER attributes must be an object' };
  }

  const { rendering, value } = attributes;

  if (!rendering || !['digits', 'words'].includes(rendering)) {
    return { valid: false, error: 'NUMBER.rendering must be \'digits\' or \'words\'' };
  }

  if (value === undefined || value === null) {
    return { valid: false, error: 'NUMBER.value is required' };
  }

  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return { valid: false, error: 'NUMBER.value must be an integer' };
  }

  return { valid: true };
}

function validateFORMATTING_COMMAND(attributes: any): ValidateResult {
  if (!attributes || typeof attributes !== 'object') {
    return { valid: false, error: 'FORMATTING_COMMAND attributes must be an object' };
  }

  const { command, isLiteral } = attributes;

  const validCommands = ['newline', 'paragraph', 'period', 'comma', 'colon', 'dash', 'bracket_open', 'bracket_close'];
  if (!command || !validCommands.includes(command)) {
    return { valid: false, error: `FORMATTING_COMMAND.command must be one of: ${validCommands.join(', ')}` };
  }

  if (isLiteral === undefined || typeof isLiteral !== 'boolean') {
    return { valid: false, error: 'FORMATTING_COMMAND.isLiteral must be a boolean' };
  }

  return { valid: true };
}

function validateSPELLED_OUT(attributes: any): ValidateResult {
  if (!attributes || typeof attributes !== 'object') {
    return { valid: false, error: 'SPELLED_OUT attributes must be an object' };
  }

  const { resolved } = attributes;

  // resolved is optional, but if provided must be non-empty string
  if (resolved !== undefined && (typeof resolved !== 'string' || resolved.trim() === '')) {
    return { valid: false, error: 'SPELLED_OUT.resolved must be a non-empty string' };
  }

  return { valid: true };
}

function validateNAMED_ENTITY(attributes: any): ValidateResult {
  if (!attributes || typeof attributes !== 'object') {
    return { valid: false, error: 'NAMED_ENTITY attributes must be an object' };
  }

  const { category } = attributes;

  const validCategories = ['person', 'organization', 'place', 'date'];
  if (!category || !validCategories.includes(category)) {
    return { valid: false, error: `NAMED_ENTITY.category must be one of: ${validCategories.join(', ')}` };
  }

  return { valid: true };
}

function validateMEDICAL_TERM(attributes: any): ValidateResult {
  if (!attributes || typeof attributes !== 'object') {
    return { valid: false, error: 'MEDICAL_TERM attributes must be an object' };
  }

  const { category, note } = attributes;

  const validCategories = ['anatomy', 'procedure', 'diagnosis', 'drug', 'device'];
  if (!category || !validCategories.includes(category)) {
    return { valid: false, error: `MEDICAL_TERM.category must be one of: ${validCategories.join(', ')}` };
  }

  if (note !== undefined && typeof note !== 'string') {
    return { valid: false, error: 'MEDICAL_TERM.note must be a string if provided' };
  }

  return { valid: true };
}

function validateMEASUREMENT(attributes: any): ValidateResult {
  if (!attributes || typeof attributes !== 'object') {
    return { valid: false, error: 'MEASUREMENT attributes must be an object' };
  }

  const { value, unit, normalized } = attributes;

  if (value === undefined || value === null || typeof value !== 'number') {
    return { valid: false, error: 'MEASUREMENT.value must be a number' };
  }

  const validUnits = ['g', 'mg', 'ug', 'kg', 'ml', 'l', 'mmHg', 'IE', 'mm', 'cm', 'Ch'];
  if (!unit || !validUnits.includes(unit)) {
    return { valid: false, error: `MEASUREMENT.unit must be one of: ${validUnits.join(', ')}` };
  }

  if (normalized === undefined || normalized === null || typeof normalized !== 'number') {
    return { valid: false, error: 'MEASUREMENT.normalized must be a number (base unit value)' };
  }

  return { valid: true };
}

export const annotationService = {
  /**
   * Validate offset range is within transcript bounds
   */
  validateOffsetRange(startOffset: number, endOffset: number, textLength: number): ValidateResult {
    if (startOffset < 0 || endOffset < 0) {
      return { valid: false, error: 'Offsets cannot be negative' };
    }
    if (startOffset >= endOffset) {
      return { valid: false, error: 'startOffset must be less than endOffset' };
    }
    if (endOffset > textLength) {
      return { valid: false, error: `endOffset exceeds text length (${textLength})` };
    }
    return { valid: true };
  },

  /**
   * Validate annotation attributes based on type
   */
  validateAttributes(type: string, attributes: any): ValidateResult {
    // Normalize type
    const normalizedType = (type || '').toUpperCase();

    if (!this.isValidType(normalizedType)) {
      return { valid: false, error: `Unknown annotation type: ${type}` };
    }

    switch (normalizedType) {
    case 'CRUD':
      return validateCRUD(attributes);
    case 'NUMBER':
      return validateNUMBER(attributes);
    case 'FORMATTING_COMMAND':
      return validateFORMATTING_COMMAND(attributes);
    case 'SPELLED_OUT':
      return validateSPELLED_OUT(attributes);
    case 'NAMED_ENTITY':
      return validateNAMED_ENTITY(attributes);
    case 'MEDICAL_TERM':
      return validateMEDICAL_TERM(attributes);
    case 'MEASUREMENT':
      return validateMEASUREMENT(attributes);
    default:
      return { valid: false, error: `Unhandled type: ${normalizedType}` };
    }
  },

  isValidType(type: string): boolean {
    const validTypes: AnnotationType[] = ['CRUD', 'NUMBER', 'FORMATTING_COMMAND', 'SPELLED_OUT', 'NAMED_ENTITY', 'MEDICAL_TERM', 'MEASUREMENT'];
    return validTypes.includes(type as AnnotationType);
  }
};

