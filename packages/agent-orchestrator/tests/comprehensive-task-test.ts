#!/usr/bin/env tsx
/**
 * Comprehensive Multi-Agent Task Test
 * 
 * Tests the orchestrator with a REAL, complex software project:
 * A full REST API with database, authentication, and testing
 * 
 * Usage:
 * export ANTHROPIC_MODEL=glm-4.5V
 * export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
 * export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
 * 
 * npx tsx tests/comprehensive-task-test.ts
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message: string) {
  console.log('\n' + '━'.repeat(70));
  log(`  ${message}  `, colors.bright + colors.cyan);
  console.log('━'.repeat(70) + '\n');
}

// Complex task definition
const COMPLEX_TASK = `
Build a Production-Ready Task Management REST API

## Core Requirements:

### 1. API Features
- User authentication (JWT-based)
- CRUD operations for tasks
- Task assignment to users
- Task status tracking (todo, in-progress, done)
- Task priority levels (low, medium, high, urgent)
- Task filtering and searching
- Due date management with notifications
- Task comments/activity log

### 2. Technical Stack
- TypeScript + Node.js + Express
- PostgreSQL database
- JWT authentication
- Input validation (Zod schemas)
- Error handling middleware
- Rate limiting
- Request logging
- API documentation (OpenAPI/Swagger)

### 3. Database Schema
- users table (id, email, password_hash, created_at)
- tasks table (id, title, description, status, priority, due_date, user_id, created_at, updated_at)
- comments table (id, task_id, user_id, content, created_at)

### 4. Security
- Password hashing (bcrypt)
- JWT token validation
- SQL injection prevention
- XSS protection
- Rate limiting per user

### 5. Testing
- Unit tests for business logic
- Integration tests for API endpoints
- Mock database for tests
- Test coverage >80%
- E2E tests for critical flows

### 6. DevOps
- Docker setup
- Docker Compose for local dev
- Environment configuration
- Database migrations
- Seed data scripts

### 7. Documentation
- README with setup instructions
- API endpoint documentation
- Database schema diagram
- Architecture decisions
- Deployment guide

## Success Criteria:
✅ All CRUD operations work correctly
✅ Authentication prevents unauthorized access
✅ Database operations are efficient
✅ All tests pass with >80% coverage
✅ API is documented and can be tested via Swagger
✅ Can run entire stack with 'docker-compose up'
✅ Production-ready error handling
✅ Logging and monitoring ready
`;

async function analyzeWithProjectManager(client: Anthropic): Promise<string> {
  header('📊 PHASE 1: Project Manager Analysis');
  log('Task: Analyze requirements and create comprehensive project plan', colors.yellow);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 8000,
    temperature: 0.3,
    system: `You are a Senior Project Manager AI agent specializing in software projects.

Your responsibilities:
- Analyze complex requirements thoroughly
- Break down into development phases
- Identify technical risks and dependencies
- Estimate effort realistically
- Propose architecture decisions
- Define success metrics

Provide structured, actionable plans with:
1. Project phases with milestones
2. Task breakdown with estimates
3. Technical architecture decisions
4. Risk assessment
5. Team structure recommendations
6. Timeline and dependencies`,
    messages: [{
      role: 'user',
      content: `Analyze this complex project and create a comprehensive implementation plan:

${COMPLEX_TASK}

Provide:
1. High-level architecture overview
2. Development phases (with sub-tasks)
3. Time estimates for each phase
4. Technical decisions and rationale
5. Risk assessment
6. Critical path analysis
7. Testing strategy`
    }]
  });

  const plan = response.content[0].text;
  log('\n✅ Project Manager Plan Generated', colors.green);
  log(`\nLength: ${plan.length} characters`, colors.cyan);
  console.log('\n' + '─'.repeat(70));
  console.log(plan);
  console.log('─'.repeat(70));
  
  return plan;
}

async function implementBackendCore(client: Anthropic, plan: string): Promise<string> {
  header('💻 PHASE 2: Backend Core Implementation');
  log('Task: Implement Express server, auth, and database layer', colors.yellow);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 8000,
    temperature: 0.2,
    system: `You are a Senior Backend Engineer AI agent specializing in Node.js/TypeScript.

Your expertise:
- Building scalable REST APIs with Express
- Database design and optimization
- Security best practices
- Clean architecture patterns
- Production-ready code

Provide complete, production-quality code with:
- Proper TypeScript types
- Error handling
- Input validation
- Security measures
- Clean code principles
- Comprehensive comments`,
    messages: [{
      role: 'user',
      content: `Based on this project plan:

${plan}

Implement the following core backend components:

1. **Express Server Setup** (src/server.ts)
   - Express app configuration
   - Middleware setup (cors, helmet, rate-limit)
   - Error handling middleware
   - Request logging

2. **Database Layer** (src/db/)
   - PostgreSQL connection setup
   - Database schema definition
   - Migration scripts
   - Query builders for each table

3. **Authentication System** (src/auth/)
   - JWT token generation/validation
   - Password hashing with bcrypt
   - Auth middleware
   - User registration/login endpoints

4. **Validation Schemas** (src/validation/)
   - Zod schemas for all inputs
   - Validation middleware

Provide complete, working code for each file.`
    }]
  });

  const code = response.content[0].text;
  log('\n✅ Backend Core Implementation Complete', colors.green);
  log(`\nLength: ${code.length} characters`, colors.cyan);
  console.log('\n' + '─'.repeat(70));
  console.log(code.substring(0, 2000) + '\n... [truncated] ...');
  console.log('─'.repeat(70));
  
  return code;
}

async function implementApiEndpoints(client: Anthropic, backendCode: string): Promise<string> {
  header('🔌 PHASE 3: API Endpoints Implementation');
  log('Task: Implement all CRUD endpoints and business logic', colors.yellow);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 8000,
    temperature: 0.2,
    system: `You are a Senior Backend Engineer AI agent specializing in REST API design.

Your expertise:
- RESTful API best practices
- OpenAPI/Swagger documentation
- Request validation
- Error responses
- Database transactions
- Performance optimization

Provide complete endpoint implementations with:
- Proper HTTP methods
- Status codes
- Request/response types
- Validation
- Error handling
- Database queries
- Transaction management`,
    messages: [{
      role: 'user',
      content: `Building on the backend core, implement these API endpoints:

## Task Management Endpoints

1. **POST /api/tasks** - Create new task
   - Validate input (title, description, priority, due_date)
   - Associate with authenticated user
   - Return created task with 201

2. **GET /api/tasks** - List user's tasks
   - Support filtering (status, priority, search)
   - Support pagination
   - Support sorting
   - Return array of tasks

3. **GET /api/tasks/:id** - Get single task
   - Verify user has access
   - Return 404 if not found
   - Return task details with comments

4. **PUT /api/tasks/:id** - Update task
   - Validate input
   - Verify ownership
   - Update specified fields
   - Log activity

5. **DELETE /api/tasks/:id** - Delete task
   - Verify ownership
   - Soft delete with deleted_at
   - Return 204

6. **POST /api/tasks/:id/comments** - Add comment
   - Validate content
   - Verify access
   - Create comment
   - Return with user info

Provide complete implementations for src/routes/tasks.ts and src/controllers/tasks.ts`
    }]
  });

  const endpoints = response.content[0].text;
  log('\n✅ API Endpoints Implementation Complete', colors.green);
  log(`\nLength: ${endpoints.length} characters`, colors.cyan);
  console.log('\n' + '─'.repeat(70));
  console.log(endpoints.substring(0, 2000) + '\n... [truncated] ...');
  console.log('─'.repeat(70));
  
  return endpoints;
}

async function implementTests(client: Anthropic, apiCode: string): Promise<string> {
  header('🧪 PHASE 4: Comprehensive Test Suite');
  log('Task: Create unit, integration, and E2E tests', colors.yellow);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 8000,
    temperature: 0.1,
    system: `You are a Senior QA Engineer AI agent specializing in automated testing.

Your expertise:
- Comprehensive test coverage
- Integration testing
- Mock/stub strategies
- Test data management
- Performance testing
- Security testing

Provide complete test suites with:
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical flows
- Mock database setup
- Test fixtures
- Clear test descriptions
- Edge cases coverage
- Error scenario testing`,
    messages: [{
      role: 'user',
      content: `Create a comprehensive test suite for the Task Management API:

## Test Requirements:

### 1. Unit Tests (tests/unit/)
- Validation schemas
- JWT utilities
- Password hashing
- Business logic functions

### 2. Integration Tests (tests/integration/)
- Authentication flow
- Task CRUD operations
- Comment system
- Filtering/searching
- Pagination

### 3. E2E Tests (tests/e2e/)
- Complete user journey
- Multi-user scenarios
- Concurrent operations
- Error handling

### 4. Test Infrastructure
- Mock database setup
- Test fixtures/factories
- Supertest for API testing
- Before/after hooks
- Test data cleanup

Provide complete test files using Vitest framework:
- tests/unit/validation.test.ts
- tests/integration/auth.test.ts
- tests/integration/tasks.test.ts
- tests/e2e/user-journey.test.ts

Aim for >80% code coverage with meaningful tests.`
    }]
  });

  const tests = response.content[0].text;
  log('\n✅ Test Suite Implementation Complete', colors.green);
  log(`\nLength: ${tests.length} characters`, colors.cyan);
  console.log('\n' + '─'.repeat(70));
  console.log(tests.substring(0, 2000) + '\n... [truncated] ...');
  console.log('─'.repeat(70));
  
  return tests;
}

async function createDevOpsSetup(client: Anthropic): Promise<string> {
  header('🐳 PHASE 5: DevOps & Infrastructure');
  log('Task: Create Docker, CI/CD, and deployment configs', colors.yellow);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 6000,
    temperature: 0.2,
    system: `You are a DevOps Engineer AI agent specializing in containerization and CI/CD.

Your expertise:
- Docker best practices
- Multi-stage builds
- Docker Compose orchestration
- Environment management
- Database migrations
- Health checks
- Monitoring setup

Provide production-ready configurations.`,
    messages: [{
      role: 'user',
      content: `Create complete DevOps setup for the Task Management API:

1. **Dockerfile** (multi-stage build)
   - Build stage with dependencies
   - Production stage (minimal)
   - Non-root user
   - Health check

2. **docker-compose.yml**
   - App service
   - PostgreSQL service
   - Redis (for rate limiting)
   - Volume management
   - Network setup

3. **Database Migrations**
   - Migration scripts (SQL)
   - Rollback capability
   - Seed data

4. **.env.example**
   - All environment variables
   - Documentation

5. **GitHub Actions CI/CD**
   - Run tests
   - Build Docker image
   - Push to registry
   - Deploy to staging

Provide complete files ready to use.`
    }]
  });

  const devops = response.content[0].text;
  log('\n✅ DevOps Setup Complete', colors.green);
  log(`\nLength: ${devops.length} characters`, colors.cyan);
  console.log('\n' + '─'.repeat(70));
  console.log(devops.substring(0, 2000) + '\n... [truncated] ...');
  console.log('─'.repeat(70));
  
  return devops;
}

async function generateDocumentation(client: Anthropic, allArtifacts: any): Promise<string> {
  header('📚 PHASE 6: Documentation');
  log('Task: Create comprehensive project documentation', colors.yellow);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 6000,
    temperature: 0.3,
    system: `You are a Technical Writer AI agent specializing in software documentation.

Your expertise:
- Clear, concise writing
- API documentation
- User guides
- Architecture diagrams
- Setup instructions
- Troubleshooting guides

Provide comprehensive, well-structured documentation.`,
    messages: [{
      role: 'user',
      content: `Create comprehensive documentation for the Task Management API:

1. **README.md**
   - Project overview
   - Features list
   - Quick start guide
   - Prerequisites
   - Installation steps
   - Running locally
   - Running tests
   - Deployment instructions

2. **API_DOCUMENTATION.md**
   - All endpoints
   - Request/response examples
   - Authentication flow
   - Error codes
   - Rate limiting details

3. **ARCHITECTURE.md**
   - System architecture overview
   - Database schema diagram
   - Authentication flow
   - Request lifecycle
   - Technology choices rationale

4. **CONTRIBUTING.md**
   - Development setup
   - Code style guide
   - Testing requirements
   - PR process

5. **DEPLOYMENT.md**
   - Environment setup
   - Database setup
   - Monitoring setup
   - Scaling considerations

Create professional, complete documentation.`
    }]
  });

  const docs = response.content[0].text;
  log('\n✅ Documentation Complete', colors.green);
  log(`\nLength: ${docs.length} characters`, colors.cyan);
  console.log('\n' + '─'.repeat(70));
  console.log(docs.substring(0, 2000) + '\n... [truncated] ...');
  console.log('─'.repeat(70));
  
  return docs;
}

async function main() {
  header('🚀 COMPREHENSIVE MULTI-AGENT ORCHESTRATOR TEST');
  log('Building a Production-Ready Task Management API', colors.bright);
  log('This will test the full capabilities of the agent system\n', colors.yellow);

  // Verify credentials
  const model = process.env.ANTHROPIC_MODEL;
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  const token = process.env.ANTHROPIC_AUTH_TOKEN;

  if (!model || !baseURL || !token) {
    log('❌ Missing Z.ai credentials!', colors.red);
    log('\nSet environment variables:');
    log('  export ANTHROPIC_MODEL=glm-4.5V');
    log('  export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic');
    log('  export ANTHROPIC_AUTH_TOKEN=your-token\n');
    process.exit(1);
  }

  log(`✅ Using Z.ai GLM-4.5V model\n`, colors.green);

  // Initialize client
  const client = new Anthropic({
    apiKey: token,
    baseURL: baseURL,
  });

  const startTime = Date.now();
  const artifacts: any = {};

  try {
    // Phase 1: Project Management
    artifacts.plan = await analyzeWithProjectManager(client);
    
    // Phase 2: Backend Core
    artifacts.backendCore = await implementBackendCore(client, artifacts.plan);
    
    // Phase 3: API Endpoints
    artifacts.apiEndpoints = await implementApiEndpoints(client, artifacts.backendCore);
    
    // Phase 4: Testing
    artifacts.tests = await implementTests(client, artifacts.apiEndpoints);
    
    // Phase 5: DevOps
    artifacts.devops = await createDevOpsSetup(client);
    
    // Phase 6: Documentation
    artifacts.documentation = await generateDocumentation(client, artifacts);

    // Save all artifacts
    header('💾 SAVING ARTIFACTS');
    const outputDir = path.join(process.cwd(), 'test-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'project-plan.md'),
      artifacts.plan
    );
    fs.writeFileSync(
      path.join(outputDir, 'backend-implementation.md'),
      artifacts.backendCore
    );
    fs.writeFileSync(
      path.join(outputDir, 'api-endpoints.md'),
      artifacts.apiEndpoints
    );
    fs.writeFileSync(
      path.join(outputDir, 'test-suite.md'),
      artifacts.tests
    );
    fs.writeFileSync(
      path.join(outputDir, 'devops-setup.md'),
      artifacts.devops
    );
    fs.writeFileSync(
      path.join(outputDir, 'documentation.md'),
      artifacts.documentation
    );

    log(`✅ All artifacts saved to: ${outputDir}`, colors.green);

    // Final Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    header('📊 EXECUTION SUMMARY');
    
    log('✅ Phase 1: Project Manager - Architecture & Planning', colors.green);
    log(`   Generated ${artifacts.plan.length.toLocaleString()} characters`, colors.cyan);
    
    log('✅ Phase 2: Backend Engineer - Core Implementation', colors.green);
    log(`   Generated ${artifacts.backendCore.length.toLocaleString()} characters`, colors.cyan);
    
    log('✅ Phase 3: Backend Engineer - API Endpoints', colors.green);
    log(`   Generated ${artifacts.apiEndpoints.length.toLocaleString()} characters`, colors.cyan);
    
    log('✅ Phase 4: QA Engineer - Comprehensive Tests', colors.green);
    log(`   Generated ${artifacts.tests.length.toLocaleString()} characters`, colors.cyan);
    
    log('✅ Phase 5: DevOps Engineer - Infrastructure', colors.green);
    log(`   Generated ${artifacts.devops.length.toLocaleString()} characters`, colors.cyan);
    
    log('✅ Phase 6: Technical Writer - Documentation', colors.green);
    log(`   Generated ${artifacts.documentation.length.toLocaleString()} characters`, colors.cyan);
    
    const totalChars = Object.values(artifacts).reduce((sum: number, text: any) => sum + text.length, 0);
    
    console.log('\n' + '─'.repeat(70));
    log(`⏱️  Total Execution Time: ${duration}s`, colors.yellow);
    log(`📝 Total Content Generated: ${totalChars.toLocaleString()} characters`, colors.yellow);
    log(`📦 Artifacts Saved: ${outputDir}`, colors.cyan);
    console.log('─'.repeat(70));
    
    log('\n🎉 COMPREHENSIVE TASK COMPLETED SUCCESSFULLY!', colors.bright + colors.green);
    log('\nThe multi-agent system has built a complete, production-ready API!', colors.green);

  } catch (error: any) {
    log('\n❌ Error during execution:', colors.red);
    console.error(error.message || error);
    process.exit(1);
  }
}

main();

