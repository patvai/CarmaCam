# carma-cam-frontend-code
This is the repository for carma-cam front end code (web app).
## How to build
We uses gulp to build the source files in ./src folder
### Installing gulp cli globally
````
$ sudo npm install gulp-cli -g
````
### Install dependencies
````
$ npm install
````
### Run gulp to pipe src to build
````
$ gulp
````
### Why uses gulp
Currently, gulp is only used for piping JavaScript compiling with Babel and sourcemap creation.
I had some difficulty integrating JavaScript uglify (minimize JavaScript) (it still works but the sourcemap is wrong)
Minimizing CSS does not work for some files.
### What does Babel do
Babel compiles JavaScript to lower ECMAScript version so that we can use new ECMASCript features while maintaining compatibility for older browser.
### What does sourcemap do
With sourcemap, we can track the line in the JavaScript of the precompiled file.
## How to check files with ESLint
### check all JavaScript files
````
$ npx eslint ./src/js/*
````
### check one file
````
$ npx eslint ./src/js/login.js
````
