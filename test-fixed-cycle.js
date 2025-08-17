// Test mejorado para verificar el ciclo completo de conversión con correcciones
// Debe ejecutarse en la consola del browser después de las correcciones

function testTableCycleFixed() {
  console.log('=== TESTING TABLE CONVERSION CYCLE (FIXED) ===');
  
  const originalHTML = `<table>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
    <tr>
      <td>Cell 3 with <strong>bold</strong> text</td>
      <td>Cell 4</td>
    </tr>
  </table>`;
  
  console.log('1. Original HTML:', originalHTML);
  
  try {
    // HTML → Lexical State
    const lexicalState = window.htmlToSerializedState(originalHTML);
    console.log('2. Lexical State:', JSON.stringify(lexicalState, null, 2));
    
    // Verify table structure in Lexical state
    const tableNode = lexicalState.root.children.find(child => child.type === 'table');
    if (tableNode) {
      console.log('3. Table structure found in Lexical state');
      console.log('   - Rows:', tableNode.children.length);
      
      tableNode.children.forEach((row, rowIndex) => {
        if (row.type === 'tablerow') {
          console.log(`   - Row ${rowIndex + 1}: ${row.children.length} cells`);
          row.children.forEach((cell, cellIndex) => {
            if (cell.type === 'tablecell') {
              const textContent = cell.children
                .map(child => child.children?.map(textNode => textNode.text || '').join('') || '')
                .join('');
              console.log(`     - Cell ${cellIndex + 1}: "${textContent}"`);
            }
          });
        }
      });
    } else {
      console.error('❌ No table node found in Lexical state');
      return;
    }
    
    // Lexical State → HTML
    const convertedHTML = window.serializedStateToHtml(lexicalState);
    console.log('4. Converted back to HTML:', convertedHTML);
    
    // Detailed verification
    const hasTable = convertedHTML.includes('<table>');
    const hasHeaders = convertedHTML.includes('<th>');
    const hasCells = convertedHTML.includes('<td>');
    const hasCell1 = convertedHTML.includes('Cell 1');
    const hasCell2 = convertedHTML.includes('Cell 2');
    const hasCell3 = convertedHTML.includes('Cell 3');
    const hasCell4 = convertedHTML.includes('Cell 4');
    const hasBoldText = convertedHTML.includes('<strong>') || convertedHTML.includes('bold');
    
    console.log('5. Detailed Verification:');
    console.log('  - Has table:', hasTable);
    console.log('  - Has headers:', hasHeaders);
    console.log('  - Has cells:', hasCells);
    console.log('  - Has Cell 1:', hasCell1);
    console.log('  - Has Cell 2:', hasCell2);
    console.log('  - Has Cell 3:', hasCell3);
    console.log('  - Has Cell 4:', hasCell4);
    console.log('  - Has bold formatting:', hasBoldText);
    
    if (!hasTable || !hasHeaders || !hasCells || !hasCell1 || !hasCell2 || !hasCell3 || !hasCell4) {
      console.error('❌ TABLE CONVERSION FAILED - Missing content');
      console.error('Missing elements:', {
        table: !hasTable,
        headers: !hasHeaders,
        cells: !hasCells,
        cell1: !hasCell1,
        cell2: !hasCell2,
        cell3: !hasCell3,
        cell4: !hasCell4
      });
    } else {
      console.log('✅ TABLE CONVERSION SUCCESSFUL - All content preserved');
    }
    
  } catch (error) {
    console.error('❌ ERROR during conversion:', error);
  }
}

function testCodeCycleFixed() {
  console.log('\n=== TESTING CODE CONVERSION CYCLE (FIXED) ===');
  
  const originalHTML = `<code>function test() {
  console.log('hello');
  if (true) {
    return 'success';
  }
  return false;
}</code>`;
  
  console.log('1. Original HTML:', originalHTML);
  
  try {
    // HTML → Lexical State
    const lexicalState = window.htmlToSerializedState(originalHTML);
    console.log('2. Lexical State:', JSON.stringify(lexicalState, null, 2));
    
    // Verify code structure in Lexical state
    const codeNode = lexicalState.root.children.find(child => child.type === 'code');
    if (codeNode && codeNode.children && codeNode.children.length > 0) {
      const codeText = codeNode.children[0].text || '';
      console.log('3. Code content found in Lexical state:');
      console.log('   - Text length:', codeText.length);
      console.log('   - Has newlines:', codeText.includes('\n'));
      console.log('   - Line count:', (codeText.match(/\n/g) || []).length + 1);
      console.log('   - Content preview:', codeText.substring(0, 50) + '...');
    } else {
      console.error('❌ No code node found in Lexical state');
      return;
    }
    
    // Lexical State → HTML
    const convertedHTML = window.serializedStateToHtml(lexicalState);
    console.log('4. Converted back to HTML:', convertedHTML);
    
    // Detailed verification
    const hasCode = convertedHTML.includes('<code>');
    const hasFunction = convertedHTML.includes('function');
    const hasConsoleLog = convertedHTML.includes('console.log');
    const hasNewlines = convertedHTML.includes('<br>') || convertedHTML.includes('\n');
    const hasReturn = convertedHTML.includes('return');
    
    console.log('5. Detailed Verification:');
    console.log('  - Has code tag:', hasCode);
    console.log('  - Has function keyword:', hasFunction);
    console.log('  - Has console.log:', hasConsoleLog);
    console.log('  - Has newlines/breaks:', hasNewlines);
    console.log('  - Has return statements:', hasReturn);
    
    if (!hasCode || !hasFunction || !hasConsoleLog || !hasReturn) {
      console.error('❌ CODE CONVERSION FAILED - Missing content');
      console.error('Missing elements:', {
        code: !hasCode,
        function: !hasFunction,
        consoleLog: !hasConsoleLog,
        returns: !hasReturn
      });
    } else {
      console.log('✅ CODE CONVERSION SUCCESSFUL - All content preserved');
      if (!hasNewlines) {
        console.warn('⚠️ WARNING: Line breaks may not be preserved correctly');
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR during conversion:', error);
  }
}

function testMixedContentCycle() {
  console.log('\n=== TESTING MIXED CONTENT CYCLE ===');
  
  const originalHTML = `
    <p>This is a paragraph with <strong>bold text</strong>.</p>
    <table>
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
      <tr>
        <td>Test Item</td>
        <td>42</td>
      </tr>
    </table>
    <code>const value = 42;
console.log(value);</code>
    <p>Another paragraph after the table and code.</p>
  `;
  
  console.log('1. Original HTML:', originalHTML);
  
  try {
    const lexicalState = window.htmlToSerializedState(originalHTML);
    console.log('2. Lexical State:', JSON.stringify(lexicalState, null, 2));
    
    const convertedHTML = window.serializedStateToHtml(lexicalState);
    console.log('3. Converted back to HTML:', convertedHTML);
    
    const hasParagraphs = convertedHTML.includes('<p>');
    const hasTable = convertedHTML.includes('<table>');
    const hasCode = convertedHTML.includes('<code>');
    const hasBold = convertedHTML.includes('<strong>') || convertedHTML.includes('bold');
    const hasTableContent = convertedHTML.includes('Test Item') && convertedHTML.includes('42');
    const hasCodeContent = convertedHTML.includes('const value') && convertedHTML.includes('console.log');
    
    console.log('4. Mixed Content Verification:');
    console.log('  - Has paragraphs:', hasParagraphs);
    console.log('  - Has table:', hasTable);
    console.log('  - Has code:', hasCode);
    console.log('  - Has bold formatting:', hasBold);
    console.log('  - Has table content:', hasTableContent);
    console.log('  - Has code content:', hasCodeContent);
    
    if (hasParagraphs && hasTable && hasCode && hasTableContent && hasCodeContent) {
      console.log('✅ MIXED CONTENT CONVERSION SUCCESSFUL');
    } else {
      console.error('❌ MIXED CONTENT CONVERSION FAILED');
    }
    
  } catch (error) {
    console.error('❌ ERROR during mixed content conversion:', error);
  }
}

// Hacer funciones disponibles globalmente
window.testTableCycleFixed = testTableCycleFixed;
window.testCodeCycleFixed = testCodeCycleFixed;
window.testMixedContentCycle = testMixedContentCycle;

console.log('Enhanced test functions loaded. Use:');
console.log('- window.testTableCycleFixed()');
console.log('- window.testCodeCycleFixed()'); 
console.log('- window.testMixedContentCycle()');
console.log('\nThese tests will verify the fixes for table content preservation and code line breaks.');