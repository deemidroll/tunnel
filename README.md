gulp-start
==========
based on https://github.com/greypants/gulp-starter

Skeleton for projects based on gulp

- separate tasks are in ./gulp/tasks/
- browserify (with browserify-shim)
- bootstrap-sass (from npm)
- LiveReload
- Static Server
- Image optimization
- Error Notifications in Notification Center

If you've never used Node or npm before, you'll need to install Node.
If you use homebrew, do:
```
brew install node
```

Otherwise, you can download and install from [here](http://nodejs.org/download/).

### Install Gulp Globally
Gulp must be installed globally in order to use the command line tools. *You may need to use `sudo`*
```
npm install -g gulp
```

### Install npm dependencies
```
npm install
```
This runs through all dependencies listed in `package.json` and downloads them
to a `node_modules` folder in your project directory.

### Run gulp and be amazed.
```
gulp
```

This will create and run the task defined in `gulpfile.js`. If you're on OS X,
and have Chrome installed, a window will open displaying the demo page. If not,
you can visit http://localhost:8080 to view the test page.