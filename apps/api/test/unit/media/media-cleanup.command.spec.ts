import {
  MediaCleanupCommandError,
  parseMediaCleanupOptions,
} from '@api/modules/media/commands/media-cleanup.command';

describe('media-cleanup command', () => {
  it('usa dry run e lote 100 por padrão', () => {
    expect(parseMediaCleanupOptions(['--older-than-hours=24'])).toEqual({
      dryRun: true,
      limit: 100,
      olderThanHours: 24,
    });
  });

  it('habilita execução destrutiva somente com flag explícita', () => {
    expect(
      parseMediaCleanupOptions(['--', '--older-than-hours=48', '--limit=25', '--execute']),
    ).toEqual({ dryRun: false, limit: 25, olderThanHours: 48 });
  });

  it.each([
    { args: [] },
    { args: ['--older-than-hours=0'] },
    { args: ['--older-than-hours=24', '--limit=501'] },
    { args: ['--older-than-hours=24', '--unknown'] },
  ])('rejeita argumentos ausentes, inválidos ou desconhecidos: $args', ({ args }) => {
    expect(() => parseMediaCleanupOptions(args)).toThrow(MediaCleanupCommandError);
  });
});
