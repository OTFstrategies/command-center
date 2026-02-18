import { Project } from "ts-morph";
import * as path from "path";
import * as fs from "fs";

/**
 * Initialize a ts-morph Project from a given root directory.
 * Looks for tsconfig.json, falls back to default compiler options.
 */
export function loadProject(projectPath: string): Project {
  const tsconfigPath = findTsConfig(projectPath);

  if (tsconfigPath) {
    return new Project({ tsConfigFilePath: tsconfigPath });
  }

  // Fallback: no tsconfig, load .ts/.tsx files manually
  const project = new Project({
    compilerOptions: {
      target: 99, // ESNext
      module: 199, // NodeNext
      moduleResolution: 99, // NodeNext
      jsx: 4, // react-jsx
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
    },
  });

  project.addSourceFilesAtPaths(path.join(projectPath, "src/**/*.{ts,tsx}"));

  return project;
}

function findTsConfig(dir: string): string | null {
  const candidates = ["tsconfig.json", "tsconfig.app.json"];
  for (const name of candidates) {
    const fullPath = path.join(dir, name);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  return null;
}

/**
 * Compute the project slug from a directory path.
 * E.g., "~/projects/command-center" -> "command-center"
 */
export function getProjectSlug(projectPath: string): string {
  return path.basename(projectPath).toLowerCase().replace(/\s+/g, "-");
}
