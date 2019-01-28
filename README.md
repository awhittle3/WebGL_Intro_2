# WebGL Introduction using JavaScript

This is a simple example of how to use WebGL to generate interactive images for the web or for applications.

See the first part of this series [here](https://github.com/awhittle3/WebGL_Intro).

WebGL is very similar to [OpenGL](https://www.opengl.org/documentation/).  Both are used frequently in visualization software and game development, as well as in many GUI libraries.

## Viewing this example

Open [index.html](./html/index.html) in the src folder with your browser.

You can upload an .obj file to view using the [.obj viewer tab](./html/example03.html).

## Following the source code

The slides can be found [here](https://docs.google.com/presentation/d/1G0oI4RSXu9bhvVO_9nfJg-OdxvJwjYsFNBdAQPhrhP0/edit?usp=sharing).
They explain the flow of the code in the examples.

Start by looking at the comments in the HTML.  Each HTML document invokes an exampleXX.js script which is where the logic for setting up and running WebGL is.
Go through the code in these scripts and see if you can complete the tasks.

There is also a script with helper functions called [commonFunctions.js](commonFunctions.js).

## Note on the models

The [.obj models](./models) can be viewed in the [.obj viewer tab](./html/example03.html).
You can browse to any .obj file on your machine and try to load it.
[The code](./examples/example03.js) contains a method to fit the model to the viewing area.

## Note on supporting libraries

This example uses an additional JavaScript library called [glMatrix](http://glmatrix.net/) to help with creating structures for matrices and vectors and performing mathematical operations on them.
It is worth noting that there are many other libraries out there that can aid in using WebGL, and libraries that use WebGL behind the scenes.

The [three-object-loader library](./lib/three-object-loader.js) was taken from [here](https://github.com/sohamkamani/three-object-loader) and modified to fit the needs of this tutorial.
This library is usually used with [three.js](https://www.npmjs.com/package/three), a higher level rendering library.

Consider using a package manager like [npm](https://www.npmjs.com/) to organize your dependencies in a larger project.

The Bootstrap file is a style sheet obtained from [Bootswatch](https://bootswatch.com/). It allows the elements in the HTML to be styled according to a theme.

## Note on compatibility

This example uses WebGL 2, which is not fully supported by all browsers.  [This table](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2) shows which browsers support this functionality.

## Addtional resources

* [MDN Web Docs on WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
* [Khronos Group Specification](https://www.khronos.org/webgl/)
* [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
* [Wavefront .obj file on Wikipedia](https://en.wikipedia.org/wiki/Wavefront_.obj_file)