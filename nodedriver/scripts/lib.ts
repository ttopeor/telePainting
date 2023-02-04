import { execSync } from "child_process";
import { writeFileSync, readdirSync } from "fs";
import { join, basename } from "path";

export function GenerateSingleton(pathName: string) {
  const serviceFileNames = readdirSync(pathName, { withFileTypes: false });
  let content = generateHeader();
  content += generateImport(serviceFileNames as string[]);
  content += addLineBreak(1);
  content += forEachNonIndexFile(serviceFileNames as string[], (className) => {
    return `export const ${className}_Instance : ${className} = new ${className}();`;
  });

  writeFileSync(join(pathName, "index.ts"), content, { flag: "w+" });
}

export function GenerateSetupFunctions(
  pathName: string,
  generateFunctionName: string,
  usedByClass: string,
  usedByImport: string
) {
  const controllerFileNames = readdirSync(pathName, {
    withFileTypes: false,
  });

  let content = generateHeader();
  content += importFrom(usedByClass, usedByImport);

  // Add require
  content += generateImport(controllerFileNames as string[]);

  content += generateFunction(
    generateFunctionName,
    controllerFileNames as string[],
    "app: " + usedByClass,
    (className) => `${className}(app);`
  );

  writeFileSync(join(pathName, "index.ts"), content, { flag: "w+" });
}

export function GenerateRegisterFunctions(
  pathname: string,
  generateFunctionName: string,
  usedByClass: string,
  usedByFunction: string,
  registerInstance = true
) {
  const nodesFileNames = readdirSync(pathname, {
    withFileTypes: false,
  });
  let content = generateHeader();
  content += importFrom(usedByClass, "../" + usedByClass);
  // Add require
  content += generateImport(nodesFileNames as string[]);
  content += generateFunction(
    generateFunctionName,
    nodesFileNames as string[],
    "mainProc: " + usedByClass,
    (className) =>
      registerInstance
        ? `mainProc.${usedByFunction}(new ${className}());`
        : `mainProc.${usedByFunction}(${className});`
  );
  writeFileSync(join(pathname, "index.ts"), content, { flag: "w+" });
}

export function GenerateManifest(
  basicVersion: string,
  fileName: string = "manifest.json"
) {
  // Generate manifest.json
  const buildVersion = execSync("git rev-parse HEAD");
  const buildNumber = execSync("git rev-list --count HEAD")
    .toString()
    .replace(/(\r\n|\n|\r)/gm, "");
  const manifestPath = join("src", "manifest.json");

  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        buildCommit: buildVersion.toString().replace(/(\r\n|\n|\r)/gm, ""),
        buildVersion: basicVersion + buildNumber,
      },
      null,
      2
    ),
    { flag: "w+" }
  );
}

export function generateImport(fileNames: string[]) {
  let tempContent = "\n";
  fileNames.forEach((fileName: any) => {
    const className = basename(fileName, ".ts");
    if (className !== "index") {
      tempContent += importFrom(className, `./${className}`);
    }
  });
  return tempContent;
}

export function generateFunction(
  functionName: string,
  fileNames: string[],
  parameters: string,
  fn: (className: string) => string
): string {
  let tempContent = addLineBreak(1);
  tempContent += `export function ${functionName}(${parameters}): void {\n`;
  tempContent += forEachNonIndexFile(
    fileNames,
    (className) => `  ${fn(className)}`
  );
  tempContent += "}\n";
  return tempContent;
}

export function importFrom(className: string, pathName: string): string {
  return `import { ${className} } from '${pathName}';\n`;
}

export function addLineBreak(numberOfBreaks: number) {
  return Array(numberOfBreaks).fill("\n").join(" ");
}

export function forEachNonIndexFile(
  fileNames: string[],
  fn: (className: string) => string
): string {
  let tempContent = "";
  fileNames.forEach((filesName: any) => {
    const className = basename(filesName, ".ts");
    if (className !== "index") {
      tempContent += `${fn(className)}\n`;
    }
  });
  return tempContent;
}
// Helper Functions
function generateHeader() {
  return `// This file is auto generated, DO NOT modify yourself
// Use 'yarn gen' to auto generate
`;
}
