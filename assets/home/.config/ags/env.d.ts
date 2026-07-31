// Editor-only declarations for what the bundler provides but TypeScript cannot
// see. Nothing here reaches a build: esbuild resolves both of these itself.

// Stylesheets import as plain strings — esbuild loads .css with its text
// loader (cli/lib/esbuild.go), which is how a surface hands its CSS to
// app.start({ css }) with no css-in-js and no runtime file read.
declare module "*.css" {
  const css: string
  export default css
}

// The directory the entry file was bundled from, defined by the bundler unless
// overridden with `ags bundle -d`. For the greeter that is its own store path,
// which is how it finds the icons shipped beside it.
declare const SRC: string
