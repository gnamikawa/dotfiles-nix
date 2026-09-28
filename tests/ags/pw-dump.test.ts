import { expect, test } from "vitest";

import {
  type PwDumpLauncher,
  spawnPwDump,
} from "../../assets/home/.config/ags/common/pw-dump";

test("spawns pw-dump with journald logging disabled", () => {
  const calls: string[] = [];
  const launcher: PwDumpLauncher<string> = {
    /** Record each environment override the spawn applies. */
    setenv: (variable, value, overwrite) => {
      calls.push(`setenv ${variable}=${value} overwrite=${overwrite}`);
    },
    /** Record the spawned argv and hand back a stand-in process. */
    spawnv: (argv) => {
      calls.push(`spawnv ${argv.join(" ")}`);
      return "proc";
    },
  };

  const proc = spawnPwDump(launcher);

  // libpipewire logs straight to journald, so STDERR_SILENCE alone let
  // pw-dump's mid-snapshot races flood ags.service's journal. The override
  // must land before the spawn, or the child never sees it.
  expect(calls).toEqual([
    "setenv PIPEWIRE_LOG_SYSTEMD=false overwrite=true",
    "spawnv pw-dump -N",
  ]);
  expect(proc).toBe("proc");
});
