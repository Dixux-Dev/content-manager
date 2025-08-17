#!/usr/bin/env node

/**
 * Test script for AI Provider System
 * 
 * This script tests the multi-provider AI system to ensure:
 * 1. Provider switching works correctly
 * 2. Fallback mechanisms function as expected
 * 3. Error handling is appropriate
 * 4. Environment configuration is valid
 */

const { spawn } = require('child_process')
const path = require('path')

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green)
}

function logError(message) {
  log(`❌ ${message}`, colors.red)
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow)
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue)
}

// Test configuration scenarios
const testScenarios = [
  {
    name: 'DeepSeek Primary (Default)',
    env: {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'test-key',
      AI_ENABLE_FALLBACK: 'true'
    }
  },
  {
    name: 'OpenAI Primary',
    env: {
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'test-key',
      AI_ENABLE_FALLBACK: 'true'
    }
  },
  {
    name: 'No Fallback',
    env: {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'test-key',
      AI_ENABLE_FALLBACK: 'false'
    }
  },
  {
    name: 'Both Providers Available',
    env: {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'test-key',
      OPENAI_API_KEY: 'test-key',
      AI_ENABLE_FALLBACK: 'true'
    }
  }
]

async function runNodeScript(script, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['-e', script], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({ code, stdout, stderr })
    })

    child.on('error', (error) => {
      reject(error)
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill()
      reject(new Error('Script timeout'))
    }, 10000)
  })
}

async function testProviderInitialization() {
  logInfo('Testing Provider Initialization...')
  
  const script = `
    try {
      const { AIProviderFactory } = require('./lib/ai-providers/provider-factory.js');
      const factory = AIProviderFactory.fromEnvironment();
      const config = factory.getConfiguration();
      const providers = factory.getAvailableProviders();
      
      console.log(JSON.stringify({
        success: true,
        primary: config.primary,
        fallback: config.fallback,
        enableFallback: config.enableFallback,
        availableProviders: providers
      }));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  `

  for (const scenario of testScenarios) {
    try {
      logInfo(`  Testing: ${scenario.name}`)
      const result = await runNodeScript(script, scenario.env)
      
      if (result.code === 0 && result.stdout) {
        try {
          const output = JSON.parse(result.stdout.trim())
          if (output.success) {
            logSuccess(`    ✓ Primary: ${output.primary}, Fallback: ${output.fallback || 'none'}`)
            logInfo(`      Available providers: ${output.availableProviders.join(', ')}`)
          } else {
            logError(`    ✗ ${output.error}`)
          }
        } catch (parseError) {
          logError(`    ✗ Failed to parse output: ${result.stdout}`)
        }
      } else {
        logError(`    ✗ Script failed (code: ${result.code})`)
        if (result.stderr) {
          logError(`      Error: ${result.stderr}`)
        }
      }
    } catch (error) {
      logError(`    ✗ ${error.message}`)
    }
  }
}

async function testEnvironmentValidation() {
  logInfo('Testing Environment Validation...')
  
  const script = `
    try {
      const { AIProviderFactory } = require('./lib/ai-providers/provider-factory.js');
      const validation = AIProviderFactory.validateEnvironment();
      
      console.log(JSON.stringify({
        success: true,
        valid: validation.valid,
        errors: validation.errors
      }));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  `

  const validationScenarios = [
    {
      name: 'Valid DeepSeek Config',
      env: {
        AI_PROVIDER: 'deepseek',
        DEEPSEEK_API_KEY: 'test-key'
      }
    },
    {
      name: 'Valid OpenAI Config',
      env: {
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'test-key'
      }
    },
    {
      name: 'Missing DeepSeek Key',
      env: {
        AI_PROVIDER: 'deepseek'
      }
    },
    {
      name: 'Missing OpenAI Key',
      env: {
        AI_PROVIDER: 'openai'
      }
    },
    {
      name: 'No Keys at All',
      env: {
        AI_PROVIDER: 'deepseek'
      }
    }
  ]

  for (const scenario of validationScenarios) {
    try {
      logInfo(`  Testing: ${scenario.name}`)
      const result = await runNodeScript(script, scenario.env)
      
      if (result.code === 0 && result.stdout) {
        try {
          const output = JSON.parse(result.stdout.trim())
          if (output.success) {
            if (output.valid) {
              logSuccess(`    ✓ Configuration is valid`)
            } else {
              logWarning(`    ⚠ Configuration is invalid`)
              output.errors.forEach(error => {
                logWarning(`      - ${error}`)
              })
            }
          } else {
            logError(`    ✗ ${output.error}`)
          }
        } catch (parseError) {
          logError(`    ✗ Failed to parse output: ${result.stdout}`)
        }
      } else {
        logError(`    ✗ Script failed (code: ${result.code})`)
      }
    } catch (error) {
      logError(`    ✗ ${error.message}`)
    }
  }
}

async function testBackwardCompatibility() {
  logInfo('Testing Backward Compatibility...')
  
  const script = `
    try {
      const { generateContent, checkAPIHealth, getCurrentProvider } = require('./lib/openai.js');
      
      // Test that legacy functions are available
      const functions = {
        generateContent: typeof generateContent === 'function',
        checkAPIHealth: typeof checkAPIHealth === 'function',
        getCurrentProvider: typeof getCurrentProvider === 'function'
      };
      
      console.log(JSON.stringify({
        success: true,
        functions
      }));
    } catch (error) {
      console.log(JSON.stringify({
        success: false,
        error: error.message
      }));
    }
  `

  try {
    const result = await runNodeScript(script, {
      AI_PROVIDER: 'deepseek',
      DEEPSEEK_API_KEY: 'test-key'
    })
    
    if (result.code === 0 && result.stdout) {
      try {
        const output = JSON.parse(result.stdout.trim())
        if (output.success) {
          logSuccess('  ✓ Legacy functions are available')
          Object.entries(output.functions).forEach(([name, available]) => {
            if (available) {
              logSuccess(`    ✓ ${name}()`)
            } else {
              logError(`    ✗ ${name}()`)
            }
          })
        } else {
          logError(`  ✗ ${output.error}`)
        }
      } catch (parseError) {
        logError(`  ✗ Failed to parse output: ${result.stdout}`)
      }
    } else {
      logError(`  ✗ Script failed (code: ${result.code})`)
      if (result.stderr) {
        logError(`    Error: ${result.stderr}`)
      }
    }
  } catch (error) {
    logError(`  ✗ ${error.message}`)
  }
}

async function runTests() {
  log('\n' + colors.bold + '🧪 AI Provider System Tests' + colors.reset + '\n')
  
  try {
    await testProviderInitialization()
    console.log()
    await testEnvironmentValidation()
    console.log()
    await testBackwardCompatibility()
    
    console.log()
    logInfo('Test completed! Check the results above.')
    logInfo('For actual API testing with real keys, update your .env file and test manually.')
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runTests().catch(error => {
    logError(`Unexpected error: ${error.message}`)
    process.exit(1)
  })
}

module.exports = { runTests }