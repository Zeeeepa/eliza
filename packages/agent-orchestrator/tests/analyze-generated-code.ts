#!/usr/bin/env tsx
/**
 * Deep Analysis of Generated Code
 * 
 * Verifies that the multi-agent system actually delivered what was requested
 * 
 * Usage: npx tsx tests/analyze-generated-code.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message: string) {
  console.log('\n' + '━'.repeat(70));
  log(`  ${message}  `, colors.cyan);
  console.log('━'.repeat(70) + '\n');
}

// Original requirements from the task
const REQUIREMENTS = {
  apiFeatures: [
    'User authentication (JWT-based)',
    'CRUD operations for tasks',
    'Task assignment to users',
    'Task status tracking (todo, in-progress, done)',
    'Task priority levels (low, medium, high, urgent)',
    'Task filtering and searching',
    'Due date management with notifications',
    'Task comments/activity log'
  ],
  techStack: [
    'TypeScript + Node.js + Express',
    'PostgreSQL database',
    'JWT authentication',
    'Input validation (Zod schemas)',
    'Error handling middleware',
    'Rate limiting',
    'Request logging',
    'API documentation (OpenAPI/Swagger)'
  ],
  database: [
    'users table',
    'tasks table',
    'comments table'
  ],
  security: [
    'Password hashing (bcrypt)',
    'JWT token validation',
    'SQL injection prevention',
    'XSS protection',
    'Rate limiting per user'
  ],
  testing: [
    'Unit tests for business logic',
    'Integration tests for API endpoints',
    'Mock database for tests',
    'Test coverage >80%',
    'E2E tests for critical flows'
  ],
  devops: [
    'Docker setup',
    'Docker Compose for local dev',
    'Environment configuration',
    'Database migrations',
    'Seed data scripts'
  ],
  documentation: [
    'README with setup instructions',
    'API endpoint documentation',
    'Database schema diagram',
    'Architecture decisions',
    'Deployment guide'
  ]
};

interface AnalysisResult {
  category: string;
  total: number;
  found: number;
  missing: string[];
  details: string[];
}

function analyzeFile(filePath: string, searchTerms: string[]): { found: string[], missing: string[] } {
  if (!fs.existsSync(filePath)) {
    return { found: [], missing: searchTerms };
  }

  const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
  const found: string[] = [];
  const missing: string[] = [];

  for (const term of searchTerms) {
    const searchTerm = term.toLowerCase();
    // More flexible matching
    const variations = [
      searchTerm,
      searchTerm.replace(/\s+/g, ''),
      searchTerm.replace(/-/g, ''),
      searchTerm.split(' ')[0] // First word
    ];

    if (variations.some(v => content.includes(v))) {
      found.push(term);
    } else {
      missing.push(term);
    }
  }

  return { found, missing };
}

function analyzeBackendImplementation(): AnalysisResult {
  const filePath = path.join(process.cwd(), '../../test-output/backend-implementation.md');
  const searchTerms = [
    'express', 'typescript', 'postgresql', 'jwt', 'bcrypt',
    'zod', 'cors', 'helmet', 'rate limit', 'morgan', 'error handler'
  ];

  const { found, missing } = analyzeFile(filePath, searchTerms);

  return {
    category: 'Backend Implementation',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function analyzeAPIEndpoints(): AnalysisResult {
  const filePath = path.join(process.cwd(), '../../test-output/api-endpoints.md');
  const searchTerms = [
    'POST /api/tasks', 'GET /api/tasks', 'PUT /api/tasks', 'DELETE /api/tasks',
    'POST /api/tasks/:id/comments', 'authentication', 'authorization',
    'filtering', 'pagination', 'sorting', 'validation'
  ];

  const { found, missing } = analyzeFile(filePath, searchTerms);

  return {
    category: 'API Endpoints',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function analyzeTestSuite(): AnalysisResult {
  const filePath = path.join(process.cwd(), '../../test-output/test-suite.md');
  const searchTerms = [
    'unit test', 'integration test', 'e2e', 'vitest', 'jest',
    'mock', 'coverage', 'validation test', 'auth test', 'task test'
  ];

  const { found, missing } = analyzeFile(filePath, searchTerms);

  return {
    category: 'Test Suite',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function analyzeDevOps(): AnalysisResult {
  const filePath = path.join(process.cwd(), '../../test-output/devops-setup.md');
  const searchTerms = [
    'dockerfile', 'docker-compose', 'postgresql', 'redis',
    'migration', 'seed data', 'environment', 'github actions', 'ci/cd'
  ];

  const { found, missing } = analyzeFile(filePath, searchTerms);

  return {
    category: 'DevOps Setup',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function analyzeDocumentation(): AnalysisResult {
  const filePath = path.join(process.cwd(), '../../test-output/documentation.md');
  const searchTerms = [
    'README', 'API documentation', 'architecture', 'setup',
    'deployment', 'endpoints', 'authentication', 'contributing'
  ];

  const { found, missing } = analyzeFile(filePath, searchTerms);

  return {
    category: 'Documentation',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function analyzeProjectPlan(): AnalysisResult {
  const filePath = path.join(process.cwd(), '../../test-output/project-plan.md');
  const searchTerms = [
    'architecture', 'phases', 'milestones', 'timeline', 'tasks',
    'risk assessment', 'testing strategy', 'technical decisions'
  ];

  const { found, missing } = analyzeFile(filePath, searchTerms);

  return {
    category: 'Project Plan',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function analyzeSecurity(): AnalysisResult {
  const backendPath = path.join(process.cwd(), '../../test-output/backend-implementation.md');
  const searchTerms = [
    'bcrypt', 'jwt', 'helmet', 'cors', 'rate limit',
    'sql injection', 'xss', 'validation', 'sanitize'
  ];

  const { found, missing } = analyzeFile(backendPath, searchTerms);

  return {
    category: 'Security Measures',
    total: searchTerms.length,
    found: found.length,
    missing,
    details: found
  };
}

function checkFileCompleteness() {
  const outputDir = path.join(process.cwd(), '../../test-output');
  const requiredFiles = [
    'project-plan.md',
    'backend-implementation.md',
    'api-endpoints.md',
    'test-suite.md',
    'devops-setup.md',
    'documentation.md'
  ];

  const existingFiles: string[] = [];
  const missingFiles: string[] = [];

  for (const file of requiredFiles) {
    const filePath = path.join(outputDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      existingFiles.push(`${file} (${(stats.size / 1024).toFixed(1)}KB)`);
    } else {
      missingFiles.push(file);
    }
  }

  return { existingFiles, missingFiles };
}

function calculateOverallScore(results: AnalysisResult[]): number {
  const totalItems = results.reduce((sum, r) => sum + r.total, 0);
  const foundItems = results.reduce((sum, r) => sum + r.found, 0);
  return Math.round((foundItems / totalItems) * 100);
}

function printResult(result: AnalysisResult) {
  const percentage = Math.round((result.found / result.total) * 100);
  const color = percentage >= 80 ? colors.green : percentage >= 60 ? colors.yellow : colors.red;
  
  log(`\n${result.category}:`, colors.cyan);
  log(`  ✓ Found: ${result.found}/${result.total} (${percentage}%)`, color);
  
  if (result.missing.length > 0) {
    log(`  ✗ Missing: ${result.missing.join(', ')}`, colors.red);
  }
}

async function main() {
  header('🔍 COMPREHENSIVE CODE ANALYSIS');
  log('Verifying generated code matches requirements\n', colors.cyan);

  // Check file existence
  header('📁 FILE COMPLETENESS CHECK');
  const { existingFiles, missingFiles } = checkFileCompleteness();
  
  log('Generated Files:', colors.green);
  existingFiles.forEach(f => log(`  ✓ ${f}`, colors.green));
  
  if (missingFiles.length > 0) {
    log('\nMissing Files:', colors.red);
    missingFiles.forEach(f => log(`  ✗ ${f}`, colors.red));
  }

  // Analyze each component
  header('📊 DETAILED COMPONENT ANALYSIS');
  
  const results: AnalysisResult[] = [
    analyzeProjectPlan(),
    analyzeBackendImplementation(),
    analyzeAPIEndpoints(),
    analyzeTestSuite(),
    analyzeDevOps(),
    analyzeDocumentation(),
    analyzeSecurity()
  ];

  results.forEach(printResult);

  // Overall assessment
  header('🎯 OVERALL ASSESSMENT');
  
  const overallScore = calculateOverallScore(results);
  const scoreColor = overallScore >= 80 ? colors.green : overallScore >= 60 ? colors.yellow : colors.red;
  
  log(`Overall Completion Score: ${overallScore}%`, scoreColor);
  
  if (overallScore >= 90) {
    log('\n✅ EXCELLENT: Code meets or exceeds all requirements!', colors.green);
  } else if (overallScore >= 80) {
    log('\n✅ GOOD: Code meets most requirements with minor gaps', colors.green);
  } else if (overallScore >= 70) {
    log('\n⚠️  ACCEPTABLE: Code meets basic requirements but needs improvement', colors.yellow);
  } else {
    log('\n❌ NEEDS WORK: Code has significant gaps', colors.red);
  }

  // Key findings
  header('🔑 KEY FINDINGS');
  
  const totalFound = results.reduce((sum, r) => sum + r.found, 0);
  const totalExpected = results.reduce((sum, r) => sum + r.total, 0);
  
  log(`✓ Implemented: ${totalFound} features`, colors.green);
  log(`✗ Missing: ${totalExpected - totalFound} features`, colors.yellow);
  
  // Recommendations
  header('💡 RECOMMENDATIONS');
  
  const gaps = results.filter(r => r.missing.length > 0);
  if (gaps.length === 0) {
    log('✅ No gaps found! All requirements met.', colors.green);
  } else {
    log('Priority items to address:', colors.yellow);
    gaps.forEach(gap => {
      if (gap.missing.length > 0) {
        log(`\n${gap.category}:`, colors.cyan);
        gap.missing.forEach(item => log(`  • Add ${item}`, colors.yellow));
      }
    });
  }

  // Production readiness
  header('🚀 PRODUCTION READINESS');
  
  const productionChecks = {
    'Error Handling': results.find(r => r.category === 'Backend Implementation')?.details.includes('error handler'),
    'Security (Helmet)': results.find(r => r.category === 'Security Measures')?.details.includes('helmet'),
    'Rate Limiting': results.find(r => r.category === 'Security Measures')?.details.includes('rate limit'),
    'Logging': results.find(r => r.category === 'Backend Implementation')?.details.includes('morgan'),
    'Testing': results.find(r => r.category === 'Test Suite')?.found > 0,
    'Docker Setup': results.find(r => r.category === 'DevOps Setup')?.details.includes('dockerfile'),
    'Documentation': results.find(r => r.category === 'Documentation')?.found > 0,
  };

  Object.entries(productionChecks).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(`${icon} ${check}`, color);
  });

  const productionReady = Object.values(productionChecks).filter(Boolean).length;
  const productionTotal = Object.keys(productionChecks).length;
  const productionScore = Math.round((productionReady / productionTotal) * 100);

  log(`\nProduction Readiness: ${productionScore}%`, 
    productionScore >= 80 ? colors.green : colors.yellow);

  if (productionScore >= 80) {
    log('\n🎉 Code is production-ready!', colors.green);
  } else {
    log('\n⚠️  Code needs more work before production deployment', colors.yellow);
  }
}

main().catch(console.error);

