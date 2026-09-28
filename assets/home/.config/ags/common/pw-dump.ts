/** The slice of Gio.SubprocessLauncher that spawning pw-dump needs. */
export type PwDumpLauncher<P> = {
  setenv(variable: string, value: string, overwrite: boolean): void;
  spawnv(argv: string[]): P;
};

/**
 * Spawn `pw-dump -N` through a launcher whose stdio flags the caller owns.
 *
 * libpipewire logs straight to journald (PIPEWIRE_LOG_SYSTEMD defaults to
 * true), bypassing stderr, so STDERR_SILENCE alone lets pw-dump's benign
 * races (streams vanishing mid-snapshot) spam the spawning unit's journal.
 * Journal logging is switched off before the spawn so the child inherits it.
 *
 * @param launcher - Launcher configured with the caller's stdio flags.
 * @returns The spawned process.
 */
export function spawnPwDump<P>(launcher: PwDumpLauncher<P>): P {
  launcher.setenv("PIPEWIRE_LOG_SYSTEMD", "false", true);
  return launcher.spawnv(["pw-dump", "-N"]);
}
