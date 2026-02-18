import { Project } from 'ts-morph';
import path from 'path';

export interface ApiRouteRecord {
  project: string;
  path: string;
  method: string;
  auth_type: string;
  params: Record<string, string>;
  response_type: string;
  file_path: string;
  line_start: number;
  tables_used: string[];
}

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function extractApiRoutes(
  project: Project,
  projectSlug: string,
  projectRoot: string
): ApiRouteRecord[] {
  const routes: ApiRouteRecord[] = [];

  const routeFiles = project.getSourceFiles().filter((sf) => {
    const filePath = sf.getFilePath();
    return filePath.includes('/app/api/') && path.basename(filePath).startsWith('route.');
  });

  for (const file of routeFiles) {
    const filePath = file.getFilePath();
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, '/');
    const apiPath = deriveApiPath(relativePath);
    const fileText = file.getFullText();
    const authType = detectAuthType(fileText);
    const tablesUsed = detectTablesUsed(fileText);

    for (const method of HTTP_METHODS) {
      const funcDecl = file.getFunction(method);
      const varDecl = file.getVariableDeclaration(method);

      if (!funcDecl && !varDecl) continue;

      const lineStart = funcDecl
        ? funcDecl.getStartLineNumber()
        : varDecl
          ? varDecl.getStartLineNumber()
          : 1;

      routes.push({
        project: projectSlug,
        path: apiPath,
        method,
        auth_type: authType,
        params: {},
        response_type: 'json',
        file_path: relativePath,
        line_start: lineStart,
        tables_used: tablesUsed,
      });
    }
  }

  return routes;
}

function deriveApiPath(filePath: string): string {
  const match = filePath.match(/app\/(api\/.+?)\/route\./);
  if (!match) return '/api/unknown';
  let apiPath = '/' + match[1];
  apiPath = apiPath.replace(/\[([^\]]+)\]/g, ':$1');
  return apiPath;
}

function detectAuthType(fileText: string): string {
  if (fileText.includes('x-api-key') || fileText.includes('SYNC_API_KEY')) return 'api_key';
  if (fileText.includes('Authorization') || fileText.includes('Bearer')) return 'bearer';
  if (fileText.includes('getSession') || fileText.includes('auth()')) return 'session';
  return 'none';
}

function detectTablesUsed(fileText: string): string[] {
  const tables = new Set<string>();
  const fromMatches = fileText.matchAll(/\.from\(['"]([a-z_]+)['"]\)/g);
  for (const m of fromMatches) {
    tables.add(m[1]);
  }
  return Array.from(tables);
}
