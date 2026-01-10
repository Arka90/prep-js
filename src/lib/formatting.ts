/**
 * Simple JavaScript code formatter to pretty-print execution-style code snippets.
 * Handles basic indentation and line breaks for better readability in quiz questions.
 */
export function formatJavaScript(code: string): string {
  if (!code) return '';

  // First, normalize line endings and whitespace
  let formatted = code
    .replace(/\r\n/g, '\n')
    .replace(/\\n/g, '\n') // Handle escaped newlines
    .trim();

  // If the code is already multi-line, it likely doesn't need heavy reformatting
  // but we should still fix indentation if it's completely messed up.
  if (formatted.split('\n').length > 3) {
      return formatted;
  }

  let output = '';
  let indentLevel = 0;
  const indentSize = 2;
  let inString = false;
  let stringChar = '';
  let lastChar = '';

  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i];
    const nextChar = i + 1 < formatted.length ? formatted[i + 1] : '';

    // Handle strings
    if (inString) {
      output += char;
      if (char === stringChar && lastChar !== '\\') {
        inString = false;
      }
      lastChar = char;
      continue;
    }

    if (char === '"' || char === '\'' || char === '`') {
      inString = true;
      stringChar = char;
      output += char;
      lastChar = char;
      continue;
    }

    // Handle braces and semicolons
    if (char === '{') {
      // Remove previous space if any, then add space + brace + newline
      if (output.endsWith(' ')) {
        output = output.slice(0, -1);
      }
      output += ' {\n';
      indentLevel++;
      output += ' '.repeat(indentLevel * indentSize);
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      output = output.trimEnd(); // Remove trailing spaces from previous line
      output += '\n' + ' '.repeat(indentLevel * indentSize) + '}';
      
      // If the next char suggests a new statement (not ; , ) or } or whitespace), add a newline
      // logic: if next char is whitespace (likely), look ahead.
      // Simpler approach: Just always ensure we are ready for a new line unless it is followed by ;
      // We will handle the "newline after }" logic by checking the CURRENT char being }
      // and let the loop continue. But if we want to force break *after* the brace, we can do it here.
      
    } else if (char === ';') {
      output += ';\n' + ' '.repeat(indentLevel * indentSize);
    } else {
        // Just append the character
        // If the previous char was '}' and this char is NOT a separator, we might want a newline.
        // But checking previous char is tricky with trimming.
        
        // Let's rely on the loop.
        // Issue in previous run: `} var` -> `}` then ` ` then `v`.
        // We need to detect that we are "after a block" and starting something new.
        
        if (lastChar === '}' && char !== ';' && char !== ',' && char !== ')' && char !== '}' && /\S/.test(char)) {
             output += '\n' + ' '.repeat(indentLevel * indentSize);
        }
        
        output += char;
    }
    
    lastChar = char;
  }

  // Cleanup:
  return output
    .replace(/\n\s*\n/g, '\n') // Remove double blank lines
    .replace(/^\s+/gm, (match) => match) // Preserve indentation
    .replace(/\}\s*;/g, '};') // Fix brace semicolon spacing
    .replace(/\}\s*var/g, '}\nvar') // Explicit fix for "} var" pattern (simple heuristic)
    .replace(/\}\s*let/g, '}\nlet')
    .replace(/\}\s*const/g, '}\nconst')
    .replace(/\}\s*function/g, '}\nfunction')
    .replace(/\}\s*return/g, '}\nreturn')
    .replace(/\n\s*;/g, ';') // Fix orphaned semicolons
    .trim();
}
