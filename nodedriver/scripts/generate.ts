import {
  GenerateRegisterFunctions,
  GenerateManifest,
  GenerateSingleton,
  GenerateSetupFunctions,
} from "./lib";

GenerateManifest("0.1.");

// Generate node index
GenerateRegisterFunctions(
  "src/tasks",
  "registerTasks",
  "App",
  "addTask",
  false
);
GenerateRegisterFunctions("src/modules", "registerModule", "App", "addModule");
GenerateRegisterFunctions(
  "src/controllers",
  "registerController",
  "App",
  "addController"
);
GenerateRegisterFunctions("src/rules", "registerRule", "App", "addRule");
// Generate web controller index
GenerateSetupFunctions("src/web", "setupRoute", "Application", "express");
// Generate Service Instance
GenerateSingleton("src/managers");
