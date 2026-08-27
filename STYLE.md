# Coding style

Applies to every `.nix` file authored in this repository.

## 1. Function composition: use `|>`

Composing two or more function calls on a value uses the pipe operator
`|>`.

    # Good
    fileNames = testDir |> builtins.readDir |> builtins.attrNames;

    # Bad
    fileNames = builtins.attrNames (builtins.readDir testDir);

A single call is fine as-is (`builtins.listToAttrs testResults`).
Curried multi-argument application (`import path pkgs`,
`pkgs.mkShell attrs`) is not composition — the rule doesn't touch it.

### When to skip the pipe

1. **The value isn't the "natural subject" of the next function.** Some
   functions take the data as their second or third argument. Piping it
   in reads backwards — the reader expects the piped value at position 1.
   Name the value with `let` or write the call out normally.

2. **The next step would be a long inline lambda.** If the right-hand
   side of `|>` is a lambda that uses its argument several times, give
   the value a name with `let` and use the name.

3. **The value being piped is a big parenthesised expression.**
   `(some large thing) |> f |> g` hides where the chain starts. Bind the
   big thing with `let` first, then pipe.

4. **The chain needs to grab an attribute partway through.** Nix's
   `.attr` isn't a function call, so it can't join the chain. If a pipe
   wants to reach into an attrset mid-flight, break it into `let`-bound
   steps.

Anything else — personal taste, "cleaner code", "conceptually separate
steps" — is not an exception.

### `lib.pipe` — one narrow use

Prefer `|>` over `lib.pipe` for hand-written chains. Use `lib.pipe` only
when the sequence of steps is a list built at eval time
(e.g. `lib.pipe x (map wrap fns)`) — something `|>` cannot express.

## 2. Multi-line arguments to multi-argument calls

In a function call with **two or more positional arguments**, no
positional argument may span **five or more lines** at the call site.
Let-bind the multi-line argument and pass the name.

    # Bad — 37-line script buried behind two positional args
    fixtureFlake = pkgs.runCommand "project-env-fixture" { } ''
      mkdir $out
      ...
    '';

    # Good
    let
      fixtureFlakeScript = ''
        mkdir $out
        ...
      '';
      fixtureFlake = pkgs.runCommand "project-env-fixture" { } fixtureFlakeScript;

Single-argument calls are untouched — `stdenv.mkDerivation { … }` and
`pkgs.writeTextFile { … }` stay in their idiomatic attrset form.
