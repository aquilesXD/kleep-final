import { useState, useCallback, useMemo } from 'react';

interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

interface ValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidationRule[];
}

export const useInputValidation = (initialValue: string, config: ValidationConfig) => {
  const [value, setValue] = useState(initialValue);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const validationRules = useMemo(() => {
    const rules: ValidationRule[] = [];

    if (config.required) {
      rules.push({
        test: (value) => value.trim().length > 0,
        message: 'Este campo es requerido'
      });
    }

    if (config.minLength) {
      rules.push({
        test: (value) => value.length >= config.minLength!,
        message: `Mínimo ${config.minLength} caracteres requeridos`
      });
    }

    if (config.maxLength) {
      rules.push({
        test: (value) => value.length <= config.maxLength!,
        message: `Máximo ${config.maxLength} caracteres permitidos`
      });
    }

    if (config.pattern) {
      rules.push({
        test: (value) => config.pattern!.test(value),
        message: 'Formato inválido'
      });
    }

    if (config.custom) {
      rules.push(...config.custom);
    }

    return rules;
  }, [config]);

  const validate = useCallback((valueToValidate: string) => {
    const newErrors = validationRules
      .filter(rule => !rule.test(valueToValidate))
      .map(rule => rule.message);

    setErrors(newErrors);
    return newErrors.length === 0;
  }, [validationRules]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    setIsDirty(true);
    validate(newValue);
  }, [validate]);

  return {
    value,
    setValue: handleChange,
    errors,
    isDirty,
    isValid: errors.length === 0,
    validate: () => validate(value),
    reset: () => {
      setValue(initialValue);
      setErrors([]);
      setIsDirty(false);
    }
  };
}; 