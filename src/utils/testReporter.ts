import fs from 'fs/promises';
import path from 'path';
import { TestResult } from '../core/types';
import logger from '../core/logger';

export enum ReportFormat {
  JSON = 'json',
  XML = 'xml',
}

export interface ReportOptions {
  format: ReportFormat;
  outputPath: string;
  filename?: string;
  includeTimestamp?: boolean;
}

export class TestReporter {
  async generateReport(
    results: TestResult[],
    analysis: any,
    options: ReportOptions
  ): Promise<string> {
    const { format, outputPath, filename, includeTimestamp = true } = options;
    
    // Create output directory if it doesn't exist
    await fs.mkdir(outputPath, { recursive: true });
    
    // Generate filename if not provided
    const timestamp = includeTimestamp ? `-${new Date().toISOString().replace(/:/g, '-')}` : '';
    const reportFilename = filename || `test-report${timestamp}.${format}`;
    const filePath = path.join(outputPath, reportFilename);
    
    // Generate report content based on format
    let content: string;
    if (format === ReportFormat.JSON) {
      content = this.generateJsonReport(results, analysis);
    } else if (format === ReportFormat.XML) {
      content = this.generateXmlReport(results, analysis);
    } else {
      throw new Error(`Unsupported report format: ${format}`);
    }
    
    // Write to file
    await fs.writeFile(filePath, content, 'utf-8');
    logger.info(`Test report generated at ${filePath}`);
    
    return filePath;
  }
  
  private generateJsonReport(results: TestResult[], analysis: any): string {
    const report = {
      timestamp: new Date().toISOString(),
      summary: analysis.summary,
      tests: results.map(result => ({
        id: result.testId,
        status: result.passed ? 'passed' : 'failed',
        duration: result.duration,
        error: result.error || null,
      })),
      failures: analysis.failedTests || [],
    };
    
    return JSON.stringify(report, null, 2);
  }
  
  private generateXmlReport(results: TestResult[], analysis: any): string {
    // Format similar to JUnit XML
    const timestamp = new Date().toISOString();
    const totalTime = (analysis.summary.totalDuration / 1000).toFixed(2);
    
    // XML header
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="AI Testing Agent Results" time="${totalTime}" tests="${analysis.summary.total}" failures="${analysis.summary.failed}" timestamp="${timestamp}">\n`;
    xml += `  <testsuite name="TestSuite" tests="${analysis.summary.total}" failures="${analysis.summary.failed}" time="${totalTime}">\n`;
    
    // Add each test case
    for (const result of results) {
      const testTime = (result.duration / 1000).toFixed(2);
      xml += `    <testcase name="${this.escapeXml(result.testId)}" time="${testTime}"`;
      
      if (!result.passed) {
        xml += '>\n';
        xml += `      <failure message="${this.escapeXml(result.error || 'Test failed')}">${this.escapeXml(result.error || '')}</failure>\n`;
        xml += '    </testcase>\n';
      } else {
        xml += '/>\n';
      }
    }
    
    // Close XML
    xml += '  </testsuite>\n';
    xml += '</testsuites>';
    
    return xml;
  }
  
  private escapeXml(unsafe: string = ''): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}