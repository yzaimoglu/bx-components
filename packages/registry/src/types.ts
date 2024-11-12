export interface Component {
  name: string;
  type: ComponentType;
  files: Files;
  dependencies: string[];
  registryDependencies: string[];
}

interface Files {
  angular: File[];
  vue: File[];
}

interface File {
  path: string;
}

enum ComponentType {
  ui,
  hook
}
