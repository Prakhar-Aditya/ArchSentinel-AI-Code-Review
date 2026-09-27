import fs from "fs/promises";
import path from "path";
import os from "os";
import { simpleGit } from "simple-git";

export interface RepositoryFile {
  path: string;
  content: string;
  language: string;
}

const SUPPORTED_EXTENSIONS: Record<string, string> = {
  ".js": "javascript",
  ".jsx": "javascript",
  ".ts": "typescript",
  ".tsx": "typescript",
  ".py": "python",
  ".java": "java",
  ".cpp": "cpp",
  ".c": "c",
  ".cs": "csharp",
  ".go": "go",
  ".rs": "rust",
};

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
]);

async function collectFiles(
  directory: string,
  rootDirectory: string
): Promise<RepositoryFile[]> {
  const entries = await fs.readdir(directory, {
    withFileTypes: true,
  });

  const files: RepositoryFile[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(
      directory,
      entry.name
    );

    if (entry.isDirectory()) {
      const nestedFiles = await collectFiles(
        fullPath,
        rootDirectory
      );

      files.push(...nestedFiles);

      continue;
    }

    const extension = path
      .extname(entry.name)
      .toLowerCase();

    const language =
      SUPPORTED_EXTENSIONS[extension];

    if (!language) {
      continue;
    }

    const content = await fs.readFile(
      fullPath,
      "utf-8"
    );

    files.push({
      path: path.relative(
        rootDirectory,
        fullPath
      ),
      content,
      language,
    });
  }

  return files;
}

/**
 * Normalize a repository URL so users can provide:
 *
 * github.com/owner/repository
 * https://github.com/owner/repository
 * https://github.com/owner/repository/
 * https://github.com/owner/repository.git
 *
 * Internally, GitHub URLs are converted to:
 *
 * https://github.com/owner/repository.git
 */
function normalizeRepositoryUrl(
  repositoryUrl: string
): string {
  let url = repositoryUrl.trim();

  // Remove trailing slashes.
  url = url.replace(/\/+$/, "");

  // Add HTTPS protocol if the user omitted it.
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Add .git to GitHub repository URLs
  // when it is not already present.
  if (
    /^https?:\/\/github\.com\//i.test(url) &&
    !url.endsWith(".git")
  ) {
    url = `${url}.git`;
  }

  return url;
}

export async function cloneRepository(
  repositoryUrl: string
) {
  const temporaryDirectory =
    await fs.mkdtemp(
      path.join(
        os.tmpdir(),
        "archsentinel-"
      )
    );

  const normalizedUrl =
    normalizeRepositoryUrl(repositoryUrl);

  console.log(
    `Normalized repository URL: ${normalizedUrl}`
  );

  const git = simpleGit();

  try {
    console.log(
      `Cloning repository: ${normalizedUrl}`
    );

    await git.clone(
      normalizedUrl,
      temporaryDirectory,
      ["--depth", "1"]
    );

    console.log(
      `Repository cloned to: ${temporaryDirectory}`
    );

    return temporaryDirectory;
  } catch (error) {
    // Remove the temporary directory if
    // repository cloning fails.
    await fs.rm(
      temporaryDirectory,
      {
        recursive: true,
        force: true,
      }
    );

    throw error;
  }
}

export async function loadRepositoryFiles(
  repositoryDirectory: string
): Promise<RepositoryFile[]> {
  return collectFiles(
    repositoryDirectory,
    repositoryDirectory
  );
}