import { nextjsConfig } from '@vavito/eslint-config';

const config = [...nextjsConfig, { ignores: ['.next-e2e/**'] }];

export default config;
