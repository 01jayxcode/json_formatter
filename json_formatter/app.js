class JSONFormatter {
    constructor() {
        this.jsonInput = document.getElementById('jsonInput');
        this.jsonOutput = document.getElementById('jsonOutput');
        this.copyInputBtn = document.getElementById('copyInput');
        this.copyOutputBtn = document.getElementById('copyOutput');
        this.inputStatus = document.getElementById('inputStatus');
        this.outputStatus = document.getElementById('outputStatus');
        this.messageContainer = document.getElementById('messageContainer');
        
        this.formattedJSON = '';
        this.init();
    }

    init() {
        // Add event listeners
        this.jsonInput.addEventListener('input', this.handleInputChange.bind(this));
        this.jsonInput.addEventListener('paste', this.handlePaste.bind(this));
        this.copyInputBtn.addEventListener('click', () => this.copyToClipboard('input'));
        this.copyOutputBtn.addEventListener('click', () => this.copyToClipboard('output'));
        
        // Initial setup
        this.updateStatus('input', 'Ready');
        this.updateStatus('output', 'No output');
    }

    handleInputChange() {
        const input = this.jsonInput.value.trim();
        
        if (!input) {
            this.clearOutput();
            this.updateStatus('input', 'Ready');
            this.updateStatus('output', 'No output');
            return;
        }

        this.updateStatus('input', 'Processing...');
        
        // Debounce the formatting to avoid excessive processing
        clearTimeout(this.formatTimeout);
        this.formatTimeout = setTimeout(() => {
            this.formatJSON(input);
        }, 300);
    }

    handlePaste() {
        // Handle paste event with a slight delay to ensure content is pasted
        setTimeout(() => {
            this.handleInputChange();
        }, 10);
    }

    formatJSON(input) {
        try {
            // Parse the JSON
            const parsed = JSON.parse(input);
            
            // Format with 2-space indentation
            this.formattedJSON = JSON.stringify(parsed, null, 2);
            
            // Apply syntax highlighting
            const highlighted = this.highlightJSON(this.formattedJSON);
            
            // Update output
            this.jsonOutput.innerHTML = `<code class="json-code">${highlighted}</code>`;
            
            // Update status
            this.updateStatus('input', 'Valid JSON', 'success');
            this.updateStatus('output', `Formatted successfully (${this.getJSONStats(parsed)})`, 'success');
            
        } catch (error) {
            this.handleJSONError(error);
        }
    }

    highlightJSON(json) {
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("(?:\\.|[^"\\])*")\s*:/g, '<span class="json-key">$1</span>:')
            .replace(/:\s*("(?:\\.|[^"\\])*")/g, ': <span class="json-string">$1</span>')
            .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
            .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
            .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
            .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>');
    }

    handleJSONError(error) {
        const errorMessage = this.getErrorMessage(error);
        const errorHTML = `
            <div class="json-error">
                <strong>JSON Parse Error:</strong><br>
                ${errorMessage}
            </div>
        `;
        
        this.jsonOutput.innerHTML = errorHTML;
        this.updateStatus('input', 'Invalid JSON', 'error');
        this.updateStatus('output', 'Parse error', 'error');
        this.formattedJSON = '';
    }

    getErrorMessage(error) {
        const message = error.message;
        
        // Try to extract line number and position from error message
        const positionMatch = message.match(/position (\d+)/);
        const lineMatch = message.match(/line (\d+)/);
        
        if (positionMatch) {
            const position = parseInt(positionMatch[1]);
            const input = this.jsonInput.value;
            const lines = input.substring(0, position).split('\n');
            const lineNumber = lines.length;
            const columnNumber = lines[lines.length - 1].length + 1;
            
            return `${message}<br><small>Line ${lineNumber}, Column ${columnNumber}</small>`;
        }
        
        return message;
    }

    getJSONStats(obj) {
        const stats = [];
        
        if (Array.isArray(obj)) {
            stats.push(`${obj.length} items`);
        } else if (typeof obj === 'object' && obj !== null) {
            const keys = Object.keys(obj);
            stats.push(`${keys.length} properties`);
        }
        
        const jsonString = JSON.stringify(obj);
        const size = new Blob([jsonString]).size;
        
        if (size > 1024) {
            stats.push(`${(size / 1024).toFixed(1)} KB`);
        } else {
            stats.push(`${size} bytes`);
        }
        
        return stats.join(', ');
    }

    clearOutput() {
        this.jsonOutput.innerHTML = '<code class="json-code">Enter JSON in the left pane to see formatted output here</code>';
        this.formattedJSON = '';
    }

    updateStatus(type, message, status = '') {
        const statusElement = type === 'input' ? this.inputStatus : this.outputStatus;
        statusElement.textContent = message;
        statusElement.className = `status-text ${status}`;
    }

    async copyToClipboard(type) {
        try {
            let textToCopy = '';
            let buttonElement = null;
            
            if (type === 'input') {
                textToCopy = this.jsonInput.value;
                buttonElement = this.copyInputBtn;
            } else {
                textToCopy = this.formattedJSON || '';
                buttonElement = this.copyOutputBtn;
            }
            
            if (!textToCopy.trim()) {
                this.showMessage('Nothing to copy', 'warning');
                return;
            }
            
            // Use the modern Clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textToCopy);
            } else {
                // Fallback for older browsers
                this.fallbackCopyToClipboard(textToCopy);
            }
            
            // Visual feedback
            this.showCopySuccess(buttonElement, type);
            this.showMessage(`${type === 'input' ? 'Raw' : 'Formatted'} JSON copied to clipboard`, 'success');
            
        } catch (error) {
            console.error('Copy failed:', error);
            this.showMessage('Failed to copy to clipboard', 'error');
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (error) {
            throw new Error('Fallback copy failed');
        } finally {
            document.body.removeChild(textArea);
        }
    }

    showCopySuccess(buttonElement, type) {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Copied!
        `;
        buttonElement.style.backgroundColor = 'var(--vscode-success)';
        buttonElement.style.borderColor = 'var(--vscode-success)';
        buttonElement.style.color = 'white';
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.backgroundColor = '';
            buttonElement.style.borderColor = '';
            buttonElement.style.color = '';
        }, 2000);
    }

    showMessage(text, type = 'info') {
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        
        this.messageContainer.appendChild(message);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => {
                    message.remove();
                }, 300);
            }
        }, 3000);
    }

    // Utility method to validate JSON without formatting
    isValidJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    // Method to minify JSON
    minifyJSON() {
        const input = this.jsonInput.value.trim();
        if (!input || !this.isValidJSON(input)) {
            this.showMessage('Please enter valid JSON first', 'warning');
            return;
        }
        
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            this.jsonOutput.innerHTML = `<code class="json-code">${this.highlightJSON(minified)}</code>`;
            this.formattedJSON = minified;
            this.updateStatus('output', 'JSON minified', 'success');
        } catch (error) {
            this.showMessage('Failed to minify JSON', 'error');
        }
    }
}

// Add slideOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JSONFormatter();
});

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to format
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const formatter = window.jsonFormatter;
        if (formatter) {
            formatter.handleInputChange();
        }
    }
    
    // Ctrl/Cmd + C when focus is on output to copy formatted JSON
    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && e.target.closest('.output-pane')) {
        e.preventDefault();
        const formatter = window.jsonFormatter;
        if (formatter) {
            formatter.copyToClipboard('output');
        }
    }
});

// Make formatter globally accessible for keyboard shortcuts
window.addEventListener('load', () => {
    window.jsonFormatter = new JSONFormatter();
});