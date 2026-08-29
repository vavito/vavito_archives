import { libraryConfig } from '@vavito/eslint-config';
import { globalIgnores } from 'eslint/config';

export default [...libraryConfig, globalIgnores(['src/generated/**'])];
