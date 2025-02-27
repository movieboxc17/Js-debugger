document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const codeInput = document.getElementById('code-input');
    const errorList = document.getElementById('error-list');
    const analyzeBtn = document.getElementById('analyze-btn');
    const fixBtn = document.getElementById('fix-btn');
    const resultModal = document.getElementById('result-modal');
    const fixedCode = document.getElementById('fixed-code');
    const copyBtn = document.getElementById('copy-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalX = document.querySelector('.close-modal');
    
    // Common JavaScript errors and their fixes
    const commonErrors = [
        {
            pattern: /(\w+)\s*=(?!=)\s*([^;]*?)(?!\s*;)$/gm,
            message: "Missing semicolon at the end of statement",
            fix: (match) => `${match};`
        },
        {
            pattern: /if\s*\((.+?)\)\s*(.+?);(?!\s*\{)/g,
            message: "If statement without curly braces",
            fix: (match, condition, statement) => `if (${condition}) { ${statement}; }`
        },
        {
            pattern: /(\w+)\s*=\s*(.+)(?<!\);)$/gm,
            message: "Missing semicolon after assignment",
            fix: (match) => match.endsWith(';') ? match : `${match};`
        },
        {
            pattern: /const\s+(\w+)\s*=\s*([^;]*?)\s*;\s*\1\s*=\s*/g,
            message: "Cannot reassign constant variable",
            fix: (match) => match.replace(/const\s+/, 'let ')
        },
        {
            pattern: /\b(cosnt|conts|cnost)\b/g,
            message: "Typo in 'const' keyword",
            fix: (match) => "const"
        },
        {
            pattern: /\b(functoin|fucntion|funtion)\b/g,
            message: "Typo in 'function' keyword",
            fix: (match) => "function"
        },
        {
            pattern: /\b(docuemnt|documnet)\b/g,
            message: "Typo in 'document' object",
            fix: (match) => "document"
        },
        {
            pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*\s*)\(\s*\)\s*{(?!\s*return)/g,
            message: "Function missing return statement",
            severity: "warning"
        },
        {
            pattern: /(["'])(?:(?=(\\?))\2.)*?\1/g,
            check: (match, code) => {
                // Check for string quotes mismatch
                return (match.startsWith('"') && !match.endsWith('"')) || 
                       (match.startsWith("'") && !match.endsWith("'"));
            },
            message: "Unclosed string literal",
            severity: "error"
        },
        {
            pattern: /console\.log\(([^)]*)(?<!\))(;?)$/gm,
            message: "Unclosed console.log parenthesis",
            fix: (match, content) => `console.log(${content})`
        },
        {
            pattern: /{[^{}]*$/gm,
            message: "Unclosed curly brace",
            severity: "error"
        },
        {
            pattern: /\([^()]*$/gm,
            message: "Unclosed parenthesis",
            severity: "error"
        }
    ];

    // Function to analyze code for errors
    function analyzeCode() {
        const code = codeInput.value;
        errorList.innerHTML = '';
        let errors = [];

        // Try to eval the code to catch syntax errors
        try {
            new Function(code);
        } catch (e) {
            errors.push({
                message: e.message,
                severity: 'error',
                line: getErrorLine(e),
                fix: null
            });
        }

        // Check for common errors using regex patterns
        commonErrors.forEach(errorType => {
            let match;
            const pattern = errorType.pattern;
            
            while ((match = pattern.exec(code)) !== null) {
                const matchText = match[0];
                const lineNumber = getLineNumber(code, match.index);
                
                // If there's a check function, use it to confirm this is an error
                if (!errorType.check || errorType.check(matchText, code)) {
                    errors.push({
                        match: matchText,
                        index: match.index,
                        message: errorType.message,
                        severity: errorType.severity || 'error',
                        line: lineNumber,
                        fix: errorType.fix,
                        pattern: pattern
                    });
                }
            }
        });

        // Display errors in the UI
        displayErrors(errors);
        
        return errors;
    }

    // Function to fix code based on detected errors
    function fixCode(errors) {
        let fixedText = codeInput.value;
        let offset = 0;
        
        // Sort errors by their position in the code (from end to start)
        // This prevents offsets from changing as we make replacements
        errors.sort((a, b) => b.index - a.index);
        
        // Apply fixes
        errors.forEach(error => {
            if (error.fix) {
                const originalText = error.match;
                let replacement;
                
                if (typeof error.fix === 'function') {
                    replacement = error.fix(originalText);
                } else {
                    replacement = error.fix;
                }
                
                if (replacement && replacement !== originalText) {
                    const startPos = error.index;
                    const endPos = startPos + originalText.length;
                    fixedText = fixedText.substring(0, startPos) + 
                                replacement + 
                                fixedText.substring(endPos);
                }
            }
        });
        
        return fixedText;
    }

    // Helper function to get line number from character index
    function getLineNumber(text, index) {
        const lines = text.substring(0, index).split('\n');
        return lines.length;
    }

    // Try to extract line number from error message
    function getErrorLine(error) {
        const lineMatch = error.stack.match(/line\s+(\d+)/i);
        return lineMatch ? parseInt(lineMatch[1]) : null;
    }

    // Display errors in the UI
    function displayErrors(errors) {
        if (errors.length === 0) {
            errorList.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> No errors found!</div>';
            return;
        }
        
        errors.forEach(error => {
            const errorItem = document.createElement('div');
            errorItem.className = 'error-item';
            
            const iconClass = error.severity === 'warning' ? 'fas fa-exclamation-triangle warning-icon' : 'fas fa-times-circle error-icon';
            
            errorItem.innerHTML = `
                <i class="${iconClass}"></i>
                <div class="error-message">
                    ${error.message}
                    ${error.line ? `<span class="error-location">line ${error.line}</span>` : ''}
                </div>
            `;
            
            errorList.appendChild(errorItem);
        });
    }

    // Show the fixed code in the modal
    function showFixedCode(code) {
        fixedCode.textContent = code;
        hljs.highlightElement(fixedCode);
        resultModal.style.display = 'block';
    }

    // Event listeners
    analyzeBtn.addEventListener('click', () => {
        analyzeCode();
    });

    fixBtn.addEventListener('click', () => {
        const errors = analyzeCode();
        if (errors.length > 0) {
            const fixedCode = fixCode(errors);
            showFixedCode(fixedCode);
        } else {
            showFixedCode(codeInput.value);
        }
    });

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(fixedCode.textContent)
            .then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Code';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    });

    closeModalBtn.addEventListener('click', () => {
        resultModal.style.display = 'none';
    });

    closeModalX.addEventListener('click', () => {
        resultModal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === resultModal) {
            resultModal.style.display = 'none';
        }
    });
});
