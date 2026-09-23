/**
 * Playwright Test Utilities & Assertions
 * Common helpers for unit, integration, and system tests
 */

const { test, expect } = require('@playwright/test');

/**
 * Test Report class for tracking assertions
 */
class TestReport {
  constructor(testName) {
    this.testName = testName;
    this.assertions = [];
    this.startTime = Date.now();
  }

  logAssertion(description, passed, details = '') {
    const icon = passed ? '✅' : '❌';
    this.assertions.push({ description, passed, details });
    console.log(`  ${icon} ${description}${details ? ` (${details})` : ''}`);
  }

  print() {
    const duration = Date.now() - this.startTime;
    const passed = this.assertions.filter((a) => a.passed).length;
    const total = this.assertions.length;

    console.log(`\n📋 Test Report: ${this.testName}`);
    console.log(`   Assertions: ${passed}/${total} passed in ${duration}ms`);

    if (passed < total) {
      console.log(`   ❌ Failed assertions:`);
      this.assertions
        .filter((a) => !a.passed)
        .forEach((a) => console.log(`      - ${a.description}`));
    }
  }

  summary() {
    const passed = this.assertions.filter((a) => a.passed).length;
    const total = this.assertions.length;
    return {
      testName: this.testName,
      passed,
      total,
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
    };
  }
}

/**
 * Assertion Helpers - Wrapping Playwright expect
 */
const assertion = {
  assertTruthy: (value, message = 'Value should be truthy') => {
    expect(!!value).toBe(true);
  },

  assertFalsy: (value, message = 'Value should be falsy') => {
    expect(!!value).toBe(false);
  },

  assertIncludes: (array, element, message = 'Array should include element') => {
    expect(array).toContain(element);
  },

  assertProperty: (obj, property, value, message = null) => {
    if (value !== undefined) {
      expect(obj[property]).toBe(value);
    } else {
      expect(obj[property]).toBeDefined();
    }
  },

  assertErrorMessage: (error, expectedMessage) => {
    expect(error.message).toContain(expectedMessage);
  },

  assertDeepEqual: (actual, expected, message = null) => {
    expect(actual).toEqual(expected);
  },

  assertThrows: async (fn, expectedMessage = null) => {
    try {
      await fn();
      throw new Error('Expected function to throw, but it did not');
    } catch (error) {
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error to contain "${expectedMessage}", got "${error.message}"`
        );
      }
    }
  },

  assertWithinRange: (value, min, max, message = null) => {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  },

  assertApiSuccess: (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    if (response.body && response.body.success !== undefined) {
      expect(response.body.success).toBe(true);
    }
  },

  assertApiError: (response, expectedStatusCode = 400) => {
    expect(response.status).toBeGreaterThanOrEqual(400);
    if (response.body && response.body.success !== undefined) {
      expect(response.body.success).toBe(false);
    }
  },

  assertEqual: (actual, expected) => {
    expect(actual).toBe(expected);
  },

  assertNotEqual: (actual, unexpected) => {
    expect(actual).not.toBe(unexpected);
  },

  assertExists: (value) => {
    expect(value).toBeDefined();
  },

  assertLength: (array, length) => {
    expect(array).toHaveLength(length);
  },

  assertGreaterThan: (value, threshold) => {
    expect(value).toBeGreaterThan(threshold);
  },

  assertLessThan: (value, threshold) => {
    expect(value).toBeLessThan(threshold);
  },
};

/**
 * Utility Functions
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateRandomEmail = () => {
  return `test${Math.random().toString(36).substr(2, 9)}@example.com`;
};

const generateRandomString = (length = 10) => {
  return Math.random().toString(36).substr(2, length);
};

const cloneObject = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const mockConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  const logs = [];
  const errors = [];
  const warnings = [];

  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => errors.push(args.join(' '));
  console.warn = (...args) => warnings.push(args.join(' '));

  const restore = () => {
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
  };

  return { logs, errors, warnings, restore };
};

module.exports = {
  // Playwright test and expect
  test,
  expect,

  // Assertions
  assertion,
  assertTruthy: assertion.assertTruthy,
  assertFalsy: assertion.assertFalsy,
  assertIncludes: assertion.assertIncludes,
  assertProperty: assertion.assertProperty,
  assertErrorMessage: assertion.assertErrorMessage,
  assertDeepEqual: assertion.assertDeepEqual,
  assertThrows: assertion.assertThrows,
  assertWithinRange: assertion.assertWithinRange,
  assertApiSuccess: assertion.assertApiSuccess,
  assertApiError: assertion.assertApiError,

  // Utilities
  delay,
  generateRandomEmail,
  generateRandomString,
  cloneObject,
  mockConsole,

  // Test Report
  TestReport,
};
