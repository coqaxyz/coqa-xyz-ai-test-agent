import fs from 'fs/promises';
import path from 'path';
import logger from '../core/logger';

export interface ParsedFunction {
  name: string;
  params: string[];
  returnType?: string;
  body: string;
  isAsync: boolean;
  isExported: boolean;
}

export interface ParsedClass {
  name: string;
  methods: ParsedFunction[];
  properties: string[];
  extends?: string;
  implements?: string[];
  isExported: boolean;
}

export interface ParsedModule {
  imports: string[];
  exports: string[];
  functions: ParsedFunction[];
  classes: ParsedClass[];
  interfaces: string[];
  filePath: string;
}

export async function parseFile(filePath: string): Promise<ParsedModule> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseCode(content, filePath);
  } catch (error) {
    logger.error(`Error parsing file ${filePath}`, { error });
    throw new Error(`Failed to parse file ${filePath}: ${(error as Error).message}`);
  }
}

export async function parseDirectory(dirPath: string, fileExtensions: string[] = ['.ts', '.js', '.tsx', '.jsx']): Promise<ParsedModule[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const modules: ParsedModule[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const subModules = await parseDirectory(fullPath, fileExtensions);
        modules.push(...subModules);
      } else if (entry.isFile() && fileExtensions.includes(path.extname(entry.name))) {
        const module = await parseFile(fullPath);
        modules.push(module);
      }
    }

    return modules;
  } catch (error) {
    logger.error(`Error parsing directory ${dirPath}`, { error });
    throw new Error(`Failed to parse directory ${dirPath}: ${(error as Error).message}`);
  }
}

// Basic code parsing functionality
// In a real implementation, this would use a proper TypeScript parser like ts-morph
export function parseCode(code: string, filePath: string): ParsedModule {
  // This is a simplified implementation
  // A real implementation would use the TypeScript compiler API
  
  const result: ParsedModule = {
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    interfaces: [],
    filePath,
  };

  // Extract imports
  const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
  const imports = code.match(importRegex) || [];
  result.imports = imports.map(imp => imp.trim());

  // Extract exports
  const exportRegex = /export\s+(?:const|function|class|interface|type|default)/g;
  const exports = code.match(exportRegex) || [];
  result.exports = exports.map(exp => exp.trim());

  // Simple function extraction
  // This is extremely simplified and won't handle complex cases
  const functionRegex = /(export\s+)?(async\s+)?function\s+(\w+)\s*\((.*?)\)(\s*:\s*(\w+))?\s*\{/g;
  let match;
  
  while ((match = functionRegex.exec(code)) !== null) {
    const isExported = Boolean(match[1]);
    const isAsync = Boolean(match[2]);
    const name = match[3];
    const params = match[4].split(',').map(p => p.trim()).filter(p => p);
    const returnType = match[6];
    
    // Extremely simplified body extraction
    const startIndex = match.index + match[0].length;
    let braceCount = 1;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < code.length; i++) {
      if (code[i] === '{') braceCount++;
      if (code[i] === '}') braceCount--;
      if (braceCount === 0) {
        endIndex = i;
        break;
      }
    }
    
    const body = code.substring(startIndex, endIndex);
    
    result.functions.push({
      name,
      params,
      returnType,
      body,
      isAsync,
      isExported,
    });
  }

  // Basic class extraction (very simplified)
  const classRegex = /(export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([\w,\s]+))?\s*\{/g;
  
  while ((match = classRegex.exec(code)) !== null) {
    const isExported = Boolean(match[1]);
    const name = match[2];
    const extendedClass = match[3];
    const implementedInterfaces = match[4] ? match[4].split(',').map(i => i.trim()) : undefined;
    
    result.classes.push({
      name,
      methods: [], // Would need further parsing to extract methods
      properties: [], // Would need further parsing to extract properties
      extends: extendedClass,
      implements: implementedInterfaces,
      isExported,
    });
  }

  return result;
}