export interface Component {
  name: string;
  type: ComponentType;
  files: Files;
  dependencies: string[];
  registryDependencies: string[];
}

export interface Files {
  angular: File[];
  vue: File[];
}

export interface File {
  path: string;
}

export enum ComponentType {
  ui,
  hook
}

export interface Config {
  api_key: string;
}
