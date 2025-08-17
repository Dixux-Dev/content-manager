// Test para verificar el ciclo completo de conversión
// Debe ejecutarse en la consola del browser

function testTableCycle() {
  console.log('=== TESTING TABLE CONVERSION CYCLE ===');
  
  const originalHTML = `<table>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
  </table>`;
  
  console.log('1. Original HTML:', originalHTML);
  
  // Simular el ciclo completo
  try {
    // HTML → Lexical State (esto pasa cuando el editor recibe initialValue)
    const lexicalState = window.htmlToSerializedState(originalHTML);
    console.log('2. Lexical State:', JSON.stringify(lexicalState, null, 2));
    
    // Lexical State → HTML (esto pasa cuando se guarda)
    const convertedHTML = window.serializedStateToHtml(lexicalState);
    console.log('3. Converted back to HTML:', convertedHTML);
    
    // Verificar si hay pérdida de información
    const hasTable = convertedHTML.includes('<table>');
    const hasHeaders = convertedHTML.includes('<th>');
    const hasCells = convertedHTML.includes('<td>');
    
    console.log('4. Verification:');
    console.log('  - Has table:', hasTable);
    console.log('  - Has headers:', hasHeaders);
    console.log('  - Has cells:', hasCells);
    
    if (!hasTable || !hasHeaders || !hasCells) {
      console.error('❌ CONVERSION FAILED - Missing table elements');
    } else {
      console.log('✅ CONVERSION SUCCESSFUL');
    }
    
  } catch (error) {
    console.error('❌ ERROR during conversion:', error);
  }
}

function testCodeCycle() {
  console.log('\n=== TESTING CODE CONVERSION CYCLE ===');
  
  const originalHTML = `<code>function test() {
  console.log('hello');
  return true;
}</code>`;
  
  console.log('1. Original HTML:', originalHTML);
  
  try {
    const lexicalState = window.htmlToSerializedState(originalHTML);
    console.log('2. Lexical State:', JSON.stringify(lexicalState, null, 2));
    
    const convertedHTML = window.serializedStateToHtml(lexicalState);
    console.log('3. Converted back to HTML:', convertedHTML);
    
    const hasCode = convertedHTML.includes('<code>');
    const hasNewlines = convertedHTML.includes('\\n') || convertedHTML.includes('<br>');
    
    console.log('4. Verification:');
    console.log('  - Has code:', hasCode);
    console.log('  - Has newlines:', hasNewlines);
    
    if (!hasCode) {
      console.error('❌ CODE CONVERSION FAILED');
    } else {
      console.log('✅ CODE CONVERSION SUCCESSFUL');
    }
    
  } catch (error) {
    console.error('❌ ERROR during conversion:', error);
  }
}

// Hacer funciones disponibles globalmente
window.testTableCycle = testTableCycle;
window.testCodeCycle = testCodeCycle;

console.log('Test functions loaded. Use:');
console.log('- window.testTableCycle()');
console.log('- window.testCodeCycle()');