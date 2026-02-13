# Test Suite Documentation

Comprehensive test suite for ElizaOS Agent Orchestrator and Z.ai integration.

## Test Structure

```
tests/
├── agent-orchestrator/          # Agent orchestrator tests
│   ├── test-orchestrator-agents-mcp.ts    # Main test suite (18 tests)
│   ├── test-fixed-agents.ts               # Quick validation (2 tests)
│   └── debug-failing-agents.ts            # Debug utilities
└── integration/                 # Integration tests
    └── test-zai-agent-orchestrator.ts     # Z.ai integration tests
```

## Running Tests

### Prerequisites

```bash
export ANTHROPIC_MODEL=glm-4.5V
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=your_token_here
```

### Main Test Suite

Run comprehensive agent orchestrator tests (18 tests):

```bash
npx tsx tests/agent-orchestrator/test-orchestrator-agents-mcp.ts
```

**Test Coverage:**
- ✅ Project Manager Agent - Requirements breakdown, task planning
- ✅ Research Agent - Solution finding, pattern analysis
- ✅ Architecture Agent - System design, pattern selection
- ✅ Coder Agent - Code generation, best practices
- ✅ Testing Agent - Test generation, validation
- ✅ Debug Agent - Bug identification, error analysis
- ✅ Documentation Agent - Documentation writing
- ✅ DevOps Agent - CI/CD configuration
- ✅ Security Agent - Vulnerability scanning

**Expected Output:**
```
🚀 Testing Agent Orchestrator with Z.ai GLM-4.5V
==================================================
✅ Test 1/18: Project Manager - Break down feature request... PASSED
✅ Test 2/18: Project Manager - Estimate task complexity... PASSED
...
✅ All 18 tests passed! (100% success rate)
📊 Total execution time: ~5.5 minutes
📊 Total tokens used: ~30,362
```

### Quick Validation

Run fast validation tests (2 tests):

```bash
npx tsx tests/agent-orchestrator/test-fixed-agents.ts
```

**Test Coverage:**
- ✅ Project Manager - Feature breakdown validation
- ✅ Architecture Agent - System design validation

**Expected Output:**
```
========== TEST 1: Project Manager ==========
✅ PASSED: Contains "task"
✅ PASSED: Contains "dependencies"
✅ PASSED: Contains "complexity" or "estimate"

========== TEST 2: Architecture Agent ==========
✅ PASSED: Contains "mermaid" or "diagram"
✅ PASSED: Contains "websocket" or "socket"

🎉 All validation tests passed!
```

### Debug Utilities

Debug specific failing agents:

```bash
npx tsx tests/agent-orchestrator/debug-failing-agents.ts
```

**Features:**
- Detailed response logging
- Validation check results
- Error message analysis
- Response pattern detection

### Integration Tests

Test Z.ai integration:

```bash
npx tsx tests/integration/test-zai-agent-orchestrator.ts
```

**Test Coverage:**
- ✅ API connection validation
- ✅ Model response verification
- ✅ Streaming support
- ✅ Multi-agent coordination
- ✅ Progress tracking

## Test Details

### Main Test Suite (test-orchestrator-agents-mcp.ts)

**Tests 18 scenarios across 9 agents:**

1. **Project Manager (2 tests)**
   - Break down feature request into tasks
   - Estimate task complexity and dependencies

2. **Research Agent (2 tests)**
   - Research authentication patterns
   - Find solutions for performance issues

3. **Architecture Agent (2 tests)**
   - Design system architecture
   - Create database schema

4. **Coder Agent (2 tests)**
   - Implement authentication endpoint
   - Write efficient database queries

5. **Testing Agent (2 tests)**
   - Generate comprehensive test suite
   - Test edge cases and error handling

6. **Debug Agent (2 tests)**
   - Identify bug from error message
   - Analyze performance bottleneck

7. **Documentation Agent (2 tests)**
   - Write API documentation
   - Create user guide

8. **DevOps Agent (2 tests)**
   - Configure CI/CD pipeline
   - Set up monitoring

9. **Security Agent (2 tests)**
   - Identify security vulnerabilities
   - Implement security best practices

### Validation Logic

Each test validates agent responses for:

**Project Manager:**
- Contains "task" keyword
- Contains "dependencies" keyword
- Contains "complexity" or "estimate"

**Research Agent:**
- Contains "JWT" or "authentication"
- Contains "implementation" or "approach"

**Architecture Agent:**
- Contains "mermaid" or "diagram"
- Contains "database" or "schema"

**Coder Agent:**
- Contains "function" or "const"
- Contains "express" or "router"

**Testing Agent:**
- Contains "test" or "it("
- Contains "expect" or "assert"

**Debug Agent:**
- Contains "error" or "issue"
- Contains "fix" or "solution"

**Documentation Agent:**
- Contains "API" or "endpoint"
- Contains "parameter" or "response"

**DevOps Agent:**
- Contains "pipeline" or "CI/CD"
- Contains "deploy" or "build"

**Security Agent:**
- Contains "vulnerability" or "security"
- Contains "validate" or "sanitize"

## Performance Metrics

### Current Benchmarks

**Test Execution:**
- Main suite (18 tests): ~5.5 minutes
- Quick validation (2 tests): ~30 seconds
- Integration tests: ~1 minute

**Agent Response Times:**
- Average: 11-15 seconds per agent
- Min: 8 seconds (simple tasks)
- Max: 20 seconds (complex tasks)

**Token Usage:**
- Main suite total: ~30,362 tokens
- Per agent average: ~1,687 tokens
- Peak single response: ~2,500 tokens

**Success Rates:**
- Main suite: 100% (18/18)
- Quick validation: 100% (2/2)
- Integration tests: 100%

## Troubleshooting

### Test Failures

**Error: "Missing API credentials"**
- Verify environment variables are set
- Check token validity
- Ensure no whitespace in credentials

**Error: "Connection timeout"**
- Check network connectivity
- Verify Z.ai service status
- Increase timeout if needed

**Error: "Test validation failed"**
- Review agent response in logs
- Check validation logic for accuracy
- Run debug utilities for details

### Debug Process

1. Run failing test individually
2. Enable verbose logging: `export DEBUG=*`
3. Check response content
4. Verify validation logic
5. Use debug utilities: `npx tsx tests/agent-orchestrator/debug-failing-agents.ts`

### Common Issues

**Slow Tests:**
- Z.ai API rate limits
- Large context sizes
- Network latency
- Solution: Implement caching, reduce context

**Flaky Tests:**
- Non-deterministic responses
- Timeout issues
- Solution: Increase retries, adjust timeouts

**Validation Errors:**
- Response format changes
- Missing keywords
- Solution: Update validation logic

## Test Development

### Adding New Tests

1. Create test file in appropriate directory
2. Import required dependencies
3. Define test scenarios
4. Implement validation logic
5. Run and verify
6. Update documentation

### Test Template

```typescript
#!/usr/bin/env node
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'glm-4.5V';
const BASE_URL = process.env.ANTHROPIC_BASE_URL;
const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;

const client = new Anthropic({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

async function testMyAgent() {
  console.log('Testing My Agent...');
  
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: 'Your agent system prompt',
    messages: [{ role: 'user', content: 'Your test input' }],
  });
  
  const text = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '';
  
  // Validate response
  const hasExpected = text.toLowerCase().includes('expected');
  console.log(`✅ Validation: ${hasExpected ? 'PASSED' : 'FAILED'}`);
}

testMyAgent().catch(console.error);
```

### Best Practices

- ✅ Test one thing at a time
- ✅ Use descriptive test names
- ✅ Include clear validation logic
- ✅ Add helpful error messages
- ✅ Keep tests independent
- ✅ Clean up resources
- ✅ Document expected behavior

## CI/CD Integration

### GitHub Actions

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
        env:
          ANTHROPIC_MODEL: glm-4.5V
          ANTHROPIC_BASE_URL: ${{ secrets.ANTHROPIC_BASE_URL }}
          ANTHROPIC_AUTH_TOKEN: ${{ secrets.ANTHROPIC_AUTH_TOKEN }}
```

### Pre-commit Hooks

```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run test:quick
```

## Maintenance

### Regular Tasks

- [ ] Update test expectations when agents evolve
- [ ] Review and optimize slow tests
- [ ] Add tests for new features
- [ ] Remove obsolete tests
- [ ] Update documentation
- [ ] Monitor test performance
- [ ] Check for flaky tests

### Quarterly Review

- Review test coverage
- Analyze failure patterns
- Update validation logic
- Optimize test execution time
- Document new test patterns

---

**Last Updated:** 2025-10-15
**Test Coverage:** 100% (18/18 passing)
**Maintainer:** @Zeeeepa

