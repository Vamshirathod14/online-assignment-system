const ApiError = require('../utils/ApiError');

const JUDGE0_HOST = process.env.JUDGE0_API_HOST || '';
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || '';
const PISTON_API = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

const USE_JUDGE0 = Boolean(JUDGE0_HOST && JUDGE0_KEY);

const PISTON_LANGUAGE_MAP = {
  python: 'python',
  python3: 'python',
  java: 'java',
  c: 'c',
  cpp: 'c++',
  'c++': 'c++',
  javascript: 'javascript',
  js: 'javascript',
  node: 'javascript',
};

const JUDGE0_LANGUAGE_MAP = {
  python: 71,
  python3: 71,
  java: 62,
  c: 50,
  cpp: 54,
  'c++': 54,
  javascript: 63,
  js: 63,
  node: 63,
};

const STDIN_LANGUAGES = new Set(['java', 'c', 'c++']);

const DEFAULT_TIMEOUT = 5000;

function normalizeOutput(output) {
  if (!output) return '';
  return output
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .trim();
}

function outputsMatch(actual, expected) {
  return normalizeOutput(actual) === normalizeOutput(expected);
}

function normalizeJavaClass(sourceCode) {
  if (!sourceCode) return sourceCode;
  const hasMain = /\bclass\s+Main\b/.test(sourceCode);
  if (hasMain) return sourceCode;
  const classMatch = sourceCode.match(/\bpublic\s+class\s+(\w+)/);
  if (classMatch) {
    return sourceCode.replace(
      new RegExp(`(public\\s+class\\s+)${classMatch[1]}`),
      '$1Main'
    );
  }
  const anyClassMatch = sourceCode.match(/\bclass\s+(\w+)/);
  if (anyClassMatch && anyClassMatch[1] !== 'Main') {
    return sourceCode.replace(
      new RegExp(`(class\\s+)${anyClassMatch[1]}`),
      '$1Main'
    );
  }
  return sourceCode;
}

function getFileName(language) {
  const names = {
    python: 'main.py',
    java: 'Main.java',
    c: 'main.c',
    'c++': 'main.cpp',
    javascript: 'main.js',
  };
  return names[language] || 'main.txt';
}

async function executeViaPiston(sourceCode, language, stdin, timeLimit) {
  const body = {
    language,
    version: '*',
    files: [{ name: getFileName(language), content: sourceCode }],
    run_timeout: timeLimit,
  };
  if (stdin && STDIN_LANGUAGES.has(language)) {
    body.stdin = stdin;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeLimit + 10000);

  try {
    const response = await fetch(`${PISTON_API}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();

    if (data.message) {
      return {
        success: false,
        compileError: data.message,
        runtimeError: '',
        output: '',
        executionTime: 0,
        memoryUsed: 0,
        status: 'compile_error',
      };
    }

    const run = data.run || {};
    const compile = data.compile || {};
    const compileError = compile.stderr || '';
    const runtimeError = (!compileError && run.stderr) ? run.stderr : '';
    const output = run.stdout || '';

    let status = 'accepted';
    if (compileError) status = 'compile_error';
    else if (runtimeError) status = 'runtime_error';
    else if (run.signal === 'SIGKILL' || run.signal === 'SIGTERM') status = 'timeout';

    return {
      success: status === 'accepted',
      compileError,
      runtimeError,
      output: output.trim(),
      executionTime: run.time ? Math.round(run.time * 1000) : 0,
      memoryUsed: run.memory || 0,
      status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, compileError: '', runtimeError: '', output: '', executionTime: timeLimit, memoryUsed: 0, status: 'timeout' };
    }
    throw error;
  }
}

async function executeViaJudge0(sourceCode, languageId, stdin, timeLimit) {
  const baseUrl = `https://${JUDGE0_HOST}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-RapidAPI-Key': JUDGE0_KEY,
    'X-RapidAPI-Host': JUDGE0_HOST,
  };

  const body = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin || '',
    cpu_time_limit: Math.ceil(timeLimit / 1000),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeLimit + 15000);

  try {
    const submitRes = await fetch(`${baseUrl}/submissions?base64_encoded=false&wait=false`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const submitData = await submitRes.json();
    const token = submitData.token;

    if (!token) {
      clearTimeout(timeoutId);
      return {
        success: false,
        compileError: submitData.stderr || submitData.compile_error || 'Submission failed',
        runtimeError: '',
        output: '',
        executionTime: 0,
        memoryUsed: 0,
        status: 'compile_error',
      };
    }

    const deadline = Date.now() + timeLimit + 10000;
    let result = null;

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 500));
      const pollRes = await fetch(`${baseUrl}/submissions/${token}?base64_encoded=false`, {
        headers: { 'X-RapidAPI-Key': JUDGE0_KEY, 'X-RapidAPI-Host': JUDGE0_HOST },
        signal: controller.signal,
      });
      result = await pollRes.json();
      if (result.status && result.status.id > 2) break;
    }

    clearTimeout(timeoutId);

    if (!result) {
      return { success: false, compileError: '', runtimeError: 'Execution timed out', output: '', executionTime: timeLimit, memoryUsed: 0, status: 'timeout' };
    }

    const statusCode = result.status?.id || 0;
    const compileError = result.compile_error || result.stderr || '';
    const output = result.stdout || '';

    let status = 'accepted';
    if (statusCode === 6) status = 'compile_error';
    else if (statusCode === 5) status = 'runtime_error';
    else if (statusCode === 3) status = 'timeout';
    else if (statusCode > 3) status = 'runtime_error';

    const runtimeError = (status === 'runtime_error' && !result.compile_error) ? (result.stderr || result.status?.description || '') : '';
    const finalCompileError = status === 'compile_error' ? compileError : '';

    return {
      success: status === 'accepted',
      compileError: finalCompileError,
      runtimeError,
      output: output.trim(),
      executionTime: result.time ? Math.round(parseFloat(result.time) * 1000) : 0,
      memoryUsed: result.memory || 0,
      status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, compileError: '', runtimeError: '', output: '', executionTime: timeLimit, memoryUsed: 0, status: 'timeout' };
    }
    throw error;
  }
}

async function executeCode(sourceCode, language, stdin = '', timeLimit = DEFAULT_TIMEOUT) {
  const langLower = language.toLowerCase();

  if (USE_JUDGE0) {
    const langId = JUDGE0_LANGUAGE_MAP[langLower];
    if (!langId) {
      throw ApiError.badRequest(`Unsupported language: ${language}. Supported: Java, Python, C, C++, JavaScript`);
    }
    let code = sourceCode;
    if (langLower === 'java') code = normalizeJavaClass(sourceCode);
    const startTime = Date.now();
    try {
      const result = await executeViaJudge0(code, langId, stdin, timeLimit);
      if (!result.executionTime) result.executionTime = Date.now() - startTime;
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return { success: false, compileError: '', runtimeError: `Execution service error: ${error.message}`, output: '', executionTime, memoryUsed: 0, status: 'runtime_error' };
    }
  }

  const pistonLang = PISTON_LANGUAGE_MAP[langLower];
  if (!pistonLang) {
    throw ApiError.badRequest(`Unsupported language: ${language}. Supported: Java, Python, C, C++, JavaScript`);
  }
  let code = sourceCode;
  if (pistonLang === 'java') code = normalizeJavaClass(sourceCode);
  const startTime = Date.now();
  try {
    const result = await executeViaPiston(code, pistonLang, stdin, timeLimit);
    if (!result.executionTime) result.executionTime = Date.now() - startTime;
    return result;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    if (error.name === 'AbortError') {
      return { success: false, compileError: '', runtimeError: '', output: '', executionTime, memoryUsed: 0, status: 'timeout' };
    }
    return { success: false, compileError: '', runtimeError: `Execution service error: ${error.message}`, output: '', executionTime, memoryUsed: 0, status: 'runtime_error' };
  }
}

async function runAgainstTestCases(sourceCode, language, testCases, timeLimit = DEFAULT_TIMEOUT) {
  const results = [];
  let passed = 0;

  for (const tc of testCases) {
    const result = await executeCode(sourceCode, language, tc.input || '', timeLimit);
    const isPassed = result.success && outputsMatch(result.output, tc.expectedOutput || '');
    if (isPassed) passed++;

    results.push({
      input: tc.input || '',
      expectedOutput: tc.expectedOutput || '',
      actualOutput: result.output,
      compileError: result.compileError || '',
      runtimeError: result.runtimeError || '',
      passed: isPassed,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed || 0,
      status: result.status,
    });
  }

  return { results, passed, total: testCases.length };
}

module.exports = { executeCode, runAgainstTestCases, normalizeOutput, outputsMatch, normalizeJavaClass, LANGUAGE_MAP: PISTON_LANGUAGE_MAP };
