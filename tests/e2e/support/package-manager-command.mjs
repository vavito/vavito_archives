import { extname } from 'node:path';

const JAVASCRIPT_EXTENSIONS = new Set(['.cjs', '.js', '.mjs']);

export function packageManagerCommand(
  args,
  {
    execPath = process.execPath,
    npmExecPath = process.env.npm_execpath,
    platform = process.platform,
  } = {},
) {
  if (npmExecPath) {
    const isJavaScriptCli = JAVASCRIPT_EXTENSIONS.has(extname(npmExecPath).toLowerCase());

    return isJavaScriptCli
      ? { args: [npmExecPath, ...args], command: execPath, shell: false }
      : {
          args,
          command: platform === 'win32' ? 'pnpm.cmd' : npmExecPath,
          shell: platform === 'win32',
        };
  }

  return {
    args,
    command: platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    shell: platform === 'win32',
  };
}
