export interface SmokeTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SmokeTestSuite {
  name: string;
  results: SmokeTestResult[];
  totalPassed: number;
  totalFailed: number;
  duration: number;
}

type SmokeTest = {
  name: string;
  test: () => Promise<void> | void;
  timeout?: number;
};

export class SmokeTestRunner {
  private tests: SmokeTest[] = [];
  private suiteName: string;

  constructor(suiteName: string) {
    this.suiteName = suiteName;
  }

  addTest(
    name: string,
    test: () => Promise<void> | void,
    timeout = 5000
  ): this {
    this.tests.push({ name, test, timeout });
    return this;
  }

  async run(): Promise<SmokeTestSuite> {
    const results: SmokeTestResult[] = [];
    const suiteStart = Date.now();

    for (const { name, test, timeout } of this.tests) {
      const testStart = Date.now();
      let passed = false;
      let error: string | undefined;

      try {
        await Promise.race([
          Promise.resolve(test()),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Test timed out after ${timeout}ms`)), timeout)
          ),
        ]);
        passed = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }

      results.push({
        name,
        passed,
        duration: Date.now() - testStart,
        error,
      });
    }

    return {
      name: this.suiteName,
      results,
      totalPassed: results.filter((r) => r.passed).length,
      totalFailed: results.filter((r) => !r.passed).length,
      duration: Date.now() - suiteStart,
    };
  }

  static formatResults(suite: SmokeTestSuite): string {
    const lines: string[] = [
      `\n${"=".repeat(60)}`,
      `SMOKE TEST SUITE: ${suite.name}`,
      `${"=".repeat(60)}`,
      "",
    ];

    for (const result of suite.results) {
      const status = result.passed ? "PASS" : "FAIL";
      const icon = result.passed ? "✓" : "✗";
      lines.push(`${icon} [${status}] ${result.name} (${result.duration}ms)`);
      if (result.error) {
        lines.push(`    Error: ${result.error}`);
      }
    }

    lines.push("");
    lines.push(`${"─".repeat(60)}`);
    lines.push(
      `Results: ${suite.totalPassed}/${suite.results.length} passed` +
        ` (${suite.totalFailed} failed) in ${suite.duration}ms`
    );
    lines.push(`${"=".repeat(60)}\n`);

    return lines.join("\n");
  }
}

export function createSmokeTestSuite(name: string): SmokeTestRunner {
  return new SmokeTestRunner(name);
}
