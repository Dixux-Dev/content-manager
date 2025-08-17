// Test the Lexical code block parser in Node.js
const { JSDOM } = require('jsdom');

// Simulate the Lexical structure you provided
const lexicalCodeHTML = `<code class="EditorTheme__code" spellcheck="false" dir="ltr" style="text-align: start;"><span data-lexical-text="true">&lt;div class="content-section"&gt;</span><br><span data-lexical-text="true">  &lt;img alt="Oil Change in Austin" </span><br><span data-lexical-text="true">       src="https://picsum.photos/400/300?auto=oilchange" </span><br><span data-lexical-text="true">       style="float:right; margin:15px; max-width:50%"&gt;</span><br><span data-lexical-text="true">  </span><br><span data-lexical-text="true">  &lt;h2&gt;&lt;strong&gt;Premium Oil Change Services&lt;/strong&gt;&lt;/h2&gt;</span><br><span data-lexical-text="true">  &lt;p&gt;Extend your engine's life with our precision oil changes...&lt;/p&gt;</span><br><span data-lexical-text="true">  &lt;ul&gt;</span><br><span data-lexical-text="true">    &lt;li&gt;&lt;strong&gt;Full synthetic options&lt;/strong&gt;: For extreme temperatures&lt;/li&gt;</span><br><span data-lexical-text="true">    &lt;li&gt;&lt;strong&gt;Quick service&lt;/strong&gt;: Under 30 minutes&lt;/li&gt;</span><br><span data-lexical-text="true">  &lt;/ul&gt;</span><br><span data-lexical-text="true">  </span><br><span data-lexical-text="true">  &lt;div class="subpage-buttons"&gt;</span><br><span data-lexical-text="true">    &lt;a href="/contact"&gt;</span><br><span data-lexical-text="true">      &lt;span class="fa fa-envelope"&gt;&lt;/span&gt; Schedule in [ND:FocusArea1]</span><br><span data-lexical-text="true">    &lt;/a&gt;</span><br><span data-lexical-text="true">  &lt;/div&gt;</span><br><span data-lexical-text="true">&lt;/div&gt;</span></code>`;

console.log('=== TESTING LEXICAL CODE BLOCK STRUCTURE ===');

// Parse with JSDOM
const dom = new JSDOM(`<div>${lexicalCodeHTML}</div>`);
const document = dom.window.document;
const codeElement = document.querySelector('code');

if (codeElement) {
    console.log('✓ Code element found');
    
    // Test our new parsing logic
    const spans = codeElement.querySelectorAll('span[data-lexical-text="true"]');
    console.log(`✓ Found spans with data-lexical-text: ${spans.length}`);
    
    if (spans.length > 0) {
        const textParts = [];
        
        // Simulate our new parsing logic
        Array.from(codeElement.childNodes).forEach((node) => {
            if (node.nodeType === 1) { // Element node
                const element = node;
                if (element.tagName.toLowerCase() === 'span' && element.getAttribute('data-lexical-text') === 'true') {
                    let spanText = element.textContent || '';
                    // Decode HTML entities
                    spanText = spanText
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'");
                    textParts.push(spanText);
                    console.log(`   Span text: "${spanText}"`);
                } else if (element.tagName.toLowerCase() === 'br') {
                    textParts.push('\n');
                    console.log('   Found <br> -> adding newline');
                }
            }
        });
        
        const finalText = textParts.join('');
        console.log('✓ Final extracted text:');
        console.log(JSON.stringify(finalText));
        console.log('✓ Text with visible newlines:');
        console.log(finalText.replace(/\n/g, '\\n'));
        
        // Count lines
        const lineCount = (finalText.match(/\n/g) || []).length + 1;
        console.log(`✓ Line count: ${lineCount}`);
        
        // Test conversion back to HTML with our new CSS approach
        const escapedForSave = finalText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
            // Note: NOT converting newlines to <br> anymore
        
        const codeStyles = `
            background-color: #f6f8fa;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Monaco, 'Courier New', monospace;
            display: block;
            padding: 16px;
            line-height: 1.45;
            font-size: 14px;
            margin: 8px 0;
            overflow-x: auto;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            tab-size: 2;
            white-space: pre-line;
            word-wrap: break-word;
            color: #24292e;
        `.replace(/\s+/g, ' ').trim();
        
        const savedHTML = `<code style="${codeStyles}">${escapedForSave}</code>`;
        console.log('✓ HTML that would be saved:');
        console.log(savedHTML.substring(0, 150) + '...');
        
        // Test reload cycle
        console.log('\n=== TESTING RELOAD CYCLE ===');
        const reloadDom = new JSDOM(`<div>${savedHTML}</div>`);
        const reloadDocument = reloadDom.window.document;
        const reloadCodeElement = reloadDocument.querySelector('code');
        
        if (reloadCodeElement) {
            // Since we're using textContent and white-space: pre-line, 
            // the newlines should be preserved automatically
            const reloadedText = reloadCodeElement.textContent || '';
            console.log('✓ Reloaded text:');
            console.log(JSON.stringify(reloadedText));
            console.log('✓ Reloaded text with visible newlines:');
            console.log(reloadedText.replace(/\n/g, '\\n'));
            
            const reloadedLineCount = (reloadedText.match(/\n/g) || []).length + 1;
            console.log(`✓ Reloaded line count: ${reloadedLineCount}`);
            
            // Compare
            console.log('\n=== COMPARISON ===');
            console.log(`Original line count: ${lineCount}`);
            console.log(`Reloaded line count: ${reloadedLineCount}`);
            console.log(`Are they equal? ${lineCount === reloadedLineCount}`);
            console.log(`Text content equal? ${finalText === reloadedText}`);
            
            if (lineCount === reloadedLineCount && finalText === reloadedText) {
                console.log('✅ SUCCESS: Line breaks preserved through save/reload cycle!');
            } else {
                console.log('❌ FAILED: Line breaks lost during save/reload cycle');
                console.log('Original first 100 chars:', finalText.substring(0, 100));
                console.log('Reloaded first 100 chars:', reloadedText.substring(0, 100));
            }
        }
    }
}