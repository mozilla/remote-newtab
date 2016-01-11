# New tab

This is a remote implementation of the "new tab" page for Firefox. It can be run inside the browser, or on its own with a "platform" shim.

## Developer Setup

### Web assets

```bash
git clone https://github.com/mozilla/newtab.git
cd newtab
npm install && npm start
```

This will start a dev server and build all necessary files in developer mode

### Firefox

First, clone the Firefox code currently in development for this repo in at [mozilla/newtab-dev](https://github.com/mozilla/newtab-dev).

```bash
git clone https://github.com/mozilla/newtab-dev.git
```

Edit the file at `browser/components/newtab/RemoteNewTabLocation.jsm` to point to `http://localhost:1944`:

```diff
-const DEFAULT_PAGE_LOCATION = "http://localhost:8000/" +
-                              "v%VERSION%/%CHANNEL%/%LOCALE%/index.html";
+const DEFAULT_PAGE_LOCATION = "http://localhost:1944";
```

Finally, build and run with `mach`:

```
./mach build
./mach run
```
