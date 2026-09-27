import {
  loadRepositoryFiles,
} from "./src/services/repository/repositoryService.js";

async function testRepository() {
  const repositoryPath = "../demo-repo";

  const files = await loadRepositoryFiles(repositoryPath);

  console.log(`Loaded ${files.length} files`);

  for (const file of files) {
    console.log(`\nFILE: ${file.path}`);
    console.log(`LANGUAGE: ${file.language}`);
    console.log(file.content);
  }
}

testRepository();