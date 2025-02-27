document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const codeInput = document.getElementById('code-input');
    const errorList = document.getElementById('error-list');
    const analyzeBtn = document.getElementById('analyze-btn');
    const fixBtn = document.getElementById('fix-btn');
    const resultModal = document.getElementById('result-modal');
    const fixedCodeElement = document.getElementById('fixed-code');
    const copyBtn = document.getElementById('copy-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const closeModalX = document.querySelector('.close-modal');
    
    // Common JavaScript errors and their fixes
    const errorPatterns = [
        {
            regex: /(\w+)\s*=\s*([^;]*?)(?!\s*;)$/gm,
            message: "Missing semicolon at the end of statement",
            fix: (match) => `${match};`
        },
        {
            regex: /console\.log\(([^)]*?)(?<!\))$/gm,
            message: "Unclosed console.log parenthesis",
            fix: (match) => `${match})`
        },
        {
            regex: /const\s+(\w+)\s*=\s*([^;]*);(?:[\s\n]*)\1\s*=/,
            message: "Cannot reassign constant variable",
            fix: (match) => match.replace(/const\s+/, 'let ')
        },
        {
            regex: /\b(cosnt|conts|cnost)\b/g,
            message: "Typo in 'const' keyword",
            fix: (match) => "const"
        },
        {
            regex: /\.innerHtml\b/g,
            message: "Did you mean 'innerHTML'?",
            fix: (match) => ".innerHTML"
        },
        {
            regex: /\bdocuemnt\b|\bdocumnet\b/g,
            message: "Typo in 'document' object",
            fix: (match) => "document"
        }
    ];

    // Analyze code for errors
    function analyzeCode() {
        const code = codeInput.value;
        errorList.innerHTML = '';
        let errors = [];
        let lineCount = 1;
        let errorsFound = false;
        
        // First check for JavaScript syntax errors
        try {
            new Function(code);
        } catch (e) {
            errorsFound = true;
            const errorItem = document.createElement('div');
            errorItem.className = 'error-item';
            errorItem.innerHTML = `
                <i class="fas fa-times-circle error-icon"></i>
                <div class="error-message">
                    Syntax Error: ${e.message}
                </div>
            `;
            errorList.appendChild(errorItem);
        }
        
        // Check for common errors using regex patterns
        errorPatterns.forEach(pattern => {
            const regex = pattern.regex;
            regex.lastIndex = 0; // Reset regex
            
            let match;
            while ((match = regex.exec(code)) !== null) {
                errorsFound = true;
                
                // Get line number
                const upToError = code.substring(0, match.index);
                const lineNumber = upToError.split('\n').length;
                
                // Create the error item
                const errorItem = document.createElement('div');
                errorItem.className = 'error-item';
                errorItem.innerHTML = `
                    <i class="fas fa-exclamation-triangle warning-icon"></i>
                    <div class="error-message">
                        ${pattern.message}
                        <span class="error-location">line ${lineNumber}</span>
                    </div>
                `;
                
                errorList.appendChild(errorItem);
                
                // Add to errors array for fixing
                errors.push({
                    pattern: pattern,
                    match: match[0],
                    index: match.index,
                    length: match[0].length
                });
            }
        });
        
        // If no errors found, show success message
        if (!errorsFound) {
            errorList.innerHTML = '<div class="error-item"><i class="fas fa-check-circle" style="color: var(--success-color);"></i> <div class="error-message">No issues found!</div></div>';
        }
        
        return errors;
    }
    
    // Fix the code with detected errors
    function fixCode(errors) {
        let code = codeInput.value;
        let offset = 0;
        
        // Sort errors by their position in the code (from end to start)
        errors.sort((a, b) => b.index - a.index);
        
        // Apply fixes
        errors.forEach(error => {
            if (error.pattern.fix) {
                const originalText = error.match;
                let fixedText = error.pattern.fix(originalText);
                
                const startPos = error.index;
                const endPos = startPos + originalText.length;
                
                code = code.substring(0, startPos) + 
                       fixedText + 
                       code.substring(endPos);
            }
        });
        
        return code;
    }
    
    // Event handlers
    analyzeBtn.addEventListener('click', function() {
        analyzeCode();
    });
    
    fixBtn.addEventListener('click', function() {
        const errors = analyzeCode();
        if (errors.length > 0) {
            const fixedCode = fixCode(errors);
            fixedCodeElement.textContent = fixedCode;
            hljs.highlightElement(fixedCodeElement);
            resultModal.style.display = 'block';
        } else {
            fixedCodeElement.textContent = codeInput.value;
            hljs.highlightElement(fixedCodeElement);
            resultModal.style.display = 'block';
        }
    });
    
    copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(fixedCodeElement.textContent)
            .then(() => {
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Code';
                }, 2000);
            });
    });
    
    closeModalBtn.addEventListener('click', function() {
        resultModal.style.display = 'none';
    });
    
    closeModalX.addEventListener('click', function() {
        resultModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === resultModal) {
            resultModal.style.display = 'none';
        }
    });
    
    // Initialize with some sample code to demonstrate
    codeInput.value = `// Try this code with errors
function sayHello() {
  console.log("Hello world"
  const x = 5
  x = 10
  docuemnt.getElementById("test").innerHtml = "Updated"
}`;
});
