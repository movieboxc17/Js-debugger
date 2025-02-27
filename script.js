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
            pattern: /(\w+)\s*=(?!=)\s*([^;]*)/g,
            check: (match) => !match.includes(';'),
            fix: (match) => `${match};`,
            message: "Missing semicolon"
        },
        {
            pattern: /const\s+(\w+)\s*=\s*([^;]*?)\s*;\s*\1\s*=\s*/g,
            message: "Cannot reassign constant variable",
            fix: (match) => match.replace(/const\s+/, 'let ')
        },
        {
            pattern: /(\w+)\(/g,
            check: (match, code) => {
                const funcName = match.replace('(', '');
                // Check if function exists in global scope or user code
                return !(funcName in window) && 
                       !new RegExp(`function\\s+${funcName}\\s*\\(`).test(code) &&
                       !new RegExp(`const\\s+${funcName}\\s*=\\s*function`).test(code) &&
                       !new RegExp(`let\\s+${funcName}\\s*=\\s*function`).test(code) &&
                       !new RegExp(`var\\s+${funcName}\\s*=\\s*function`).test(code) &&
                       !new RegExp(`const\\s+${funcName}\\s*=\\s*\\(`).test(code) &&
                       !new RegExp(`let\\s+${funcName}\\s*=\\s*\\(`).test(code) &&
                       !new RegExp(`var\\s+${funcName}\\s*=\\s*\\(`).test(code);
            },
            message: "Function not defined",
            fix: null // Cannot automatically fix undefined functions
        },
        {
            pattern: /if\s*\([^)]*\)\s*\{[^}]*\}\s*else/g,
            message: "Check if-else syntax",
            fix: null
        },
        {
            pattern: /console\.log\([^)]*(?<!\))(;?)$/gm,
            check: (match) => !match.endsWith(
