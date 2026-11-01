# legat.ml

My personal site: a CV you read by using a terminal, on a small macOS-style desktop.

**Live:** https://legat.ml

The intro types out `whoami`, `about.md`, skills, work history (as a `git log`) and contact details. After that the prompt is yours: run `help`, browse the files with `ls`, `cd` and `cat`, change the theme, or open the other apps in the dock. Some things on the page react to clicks, and `help` doesn't list all of them.

## What's in it

**A small shell.** It isn't a list of hard-coded strings. Each command line is split into words the way bash does it: quotes, backslash escapes, `~` and `$VARS` all work. Commands run against a fake home directory. `ls` takes `-1alA`, `cat` reads several files, `cd` handles `..` and absolute paths, and `./contact.sh` runs while `cat contact.sh` shows its source. Tab completes commands and paths at the caret. ↑/↓ walks the history and brings back the line you were typing. Ctrl+C and Ctrl+L behave as they do in a terminal, and Ctrl+C still copies when text is selected. Keys pressed while an input method (e.g. Japanese) is composing are left alone.

**Windows and a dock.** The terminal and a browser window close, minimize, zoom and drag like macOS windows. Keyboard focus follows whichever window is on screen. Windows that are hidden are `inert`, so Tab never lands inside them.

**Wallpapers.** The stars move away from the pointer and burst when clicked. The black hole wallpaper pulls in the stars that are already on screen and throws them back out when you switch it off. Its code is only downloaded the first time you use it. The orbit math is in a pure, tested module ([orbits.ts](src/lib/wallpaper/orbits.ts)), apart from the code that moves the DOM.

**Readable without the show.**

- The full CV is in the server-rendered HTML, so crawlers can read it.
- Screen readers get a plain copy instead of the typing animation, and command output is announced as it appears.
- Without JavaScript, that plain copy is what you see.
- "Reduced motion" turns off the typing, the scrolling animations and the moving stars.

**Phones.** The page follows the part of the screen that is actually visible ([use-fit-visible-viewport.ts](src/hooks/use-fit-visible-viewport.ts)). Android resizes the page for the on-screen keyboard, while iOS covers the page with it and pans, so the two need different handling. The wallpaper stays still while the keyboard opens. On touch screens the prompt doesn't take focus by itself, because that would pop the keyboard open, unless the visitor is typing on a hardware keyboard.

**Performance.**

- The prompt is its own component, so typing doesn't re-render the page.
- The star animation loop runs only while something is moving.
- Star colors cross-fade between opacity layers instead of animating `color`.
- Star positions come from a seeded random generator, so the server and the browser draw the same sky.

## Stack

TypeScript, React 19, TanStack Start (server rendering), Tailwind CSS 4, Vite, Vitest. Deployed on Vercel.

## Running it

```sh
npm install
npm run dev      # dev server
npm test         # unit tests (shell, completion, orbits, window drag, server HTML)
npm run lint
npm run build    # production build for Vercel
```

## Where things are

```
src/
  routes/index.tsx           the page: terminal, windows, dock, focus handling
  lib/terminal.tsx           CV content, fake filesystem, command parser, completion, history
  components/CommandLine.tsx the prompt and its block cursor
  components/Transcript.tsx  the typed intro and `replay`
  components/StarsBackground.tsx
  lib/wallpaper/             black hole effect and orbit math
  hooks/                     viewport fitting, window dragging, reduced motion
```
