import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: () => Promise<ValidationResult>;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface DataValidatorProps {
  rules: ValidationRule[];
  onValidationComplete?: (results: ValidationResult[]) => void;
  autoValidate?: boolean;
  className?: string;
}

export function DataValidator({
  rules,
  onValidationComplete,
  autoValidate = true,
  className
}: DataValidatorProps) {
  const [results, setResults] = useState<Map<string, ValidationResult>>(new Map());
  const [isValidating, setIsValidating] = useState(false);

  const validateAll = async () => {
    setIsValidating(true);
    const newResults = new Map<string, ValidationResult>();

    for (const rule of rules) {
      try {
        const result = await rule.validate();
        newResults.set(rule.id, result);
      } catch (error) {
        newResults.set(rule.id, {
          isValid: false,
          message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        });
      }
    }

    setResults(newResults);
    setIsValidating(false);

    if (onValidationComplete) {
      onValidationComplete(Array.from(newResults.values()));
    }
  };

  useEffect(() => {
    if (autoValidate) {
      validateAll();
    }
  }, [rules, autoValidate]);

  const getSeverityIcon = (severity: ValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: ValidationResult['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'info':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  const allValid = Array.from(results.values()).every(result => result.isValid);
  const hasErrors = Array.from(results.values()).some(result => !result.isValid && result.severity === 'error');

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Data Validation</h3>
        <div className="flex items-center gap-2">
          {isValidating && <Loader2 className="w-4 h-4 animate-spin" />}
          <button
            onClick={validateAll}
            disabled={isValidating}
            className={cn(
              'px-3 py-1 text-sm rounded-md transition-colors',
              isValidating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            )}
          >
            {isValidating ? 'Validating...' : 'Re-validate'}
          </button>
        </div>
      </div>

      {/* Overall status */}
      <div className={cn(
        'p-3 rounded-md border',
        allValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
      )}>
        <div className="flex items-center gap-2">
          {allValid ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <span className={cn(
            'font-medium',
            allValid ? 'text-green-800' : 'text-red-800'
          )}>
            {allValid ? 'All validations passed' : 'Validation errors found'}
          </span>
        </div>
      </div>

      {/* Individual validation results */}
      <div className="space-y-2">
        {rules.map((rule) => {
          const result = results.get(rule.id);

          return (
            <div
              key={rule.id}
              className={cn(
                'p-3 rounded-md border',
                result ? getSeverityColor(result.severity) : 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {result ? getSeverityIcon(result.severity) : <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  {result && (
                    <p className={cn(
                      'text-sm mt-2',
                      result.isValid ? 'text-green-700' : 'text-red-700'
                    )}>
                      {result.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {results.size > 0 && (
        <div className="text-sm text-gray-600">
          {Array.from(results.values()).filter(r => r.isValid).length} of {rules.length} validations passed
        </div>
      )}
    </div>
  );
}

// Predefined validation rules for common use cases
export const createValidationRules = {
  contractConnection: (contractAddress?: string): ValidationRule => ({
    id: 'contract-connection',
    name: 'Contract Connection',
    description: 'Verify connection to the Cipher Scribe contract',
    validate: async () => {
      if (!contractAddress) {
        return {
          isValid: false,
          message: 'Contract address not configured',
          severity: 'error'
        };
      }

      try {
        // In a real implementation, you would test the contract connection
        // For now, we'll just check if it's a valid address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
          return {
            isValid: false,
            message: 'Invalid contract address format',
            severity: 'error'
          };
        }

        return {
          isValid: true,
          message: 'Contract connection validated',
          severity: 'info'
        };
      } catch (error) {
        return {
          isValid: false,
          message: `Contract connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        };
      }
    }
  }),

  networkConnection: (chainId?: number): ValidationRule => ({
    id: 'network-connection',
    name: 'Network Connection',
    description: 'Verify connection to the blockchain network',
    validate: async () => {
      if (!chainId) {
        return {
          isValid: false,
          message: 'Network not configured',
          severity: 'error'
        };
      }

      try {
        // In a real implementation, you would check network connectivity
        const supportedChains = [31337, 11155111, 137];
        if (!supportedChains.includes(chainId)) {
          return {
            isValid: false,
            message: `Unsupported chain ID: ${chainId}`,
            severity: 'warning'
          };
        }

        return {
          isValid: true,
          message: 'Network connection validated',
          severity: 'info'
        };
      } catch (error) {
        return {
          isValid: false,
          message: `Network connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        };
      }
    }
  }),

  fhevmCompatibility: (): ValidationRule => ({
    id: 'fhevm-compatibility',
    name: 'FHEVM Compatibility',
    description: 'Check FHEVM support and version compatibility',
    validate: async () => {
      try {
        // In a real implementation, you would check FHEVM compatibility
        // For now, we'll simulate the check
        const isCompatible = true; // This would be determined by actual compatibility checks

        if (!isCompatible) {
          return {
            isValid: false,
            message: 'FHEVM version not compatible',
            severity: 'warning'
          };
        }

        return {
          isValid: true,
          message: 'FHEVM compatibility confirmed',
          severity: 'info'
        };
      } catch (error) {
        return {
          isValid: false,
          message: `FHEVM compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error'
        };
      }
    }
  })
};
