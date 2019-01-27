// This is where the entrypoint is
main();

// Mozilla's tutorial on WebGL was used as a base for this example.
// See https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
// The original source is here: https://github.com/mdn/webgl-examples

function main() {

    console.log("Setting up the canvas");

    // Find the canavas tag in the HTML document
    const canvas = document.querySelector("#exampleCanvas");

    // Initialize the WebGL2 context
    // The `gl` variable represents the context for which we access WebGL.
    // By calling it `gl`, the calls are similar in syntax to the OpenGL ES API.
    const gl = canvas.getContext("webgl2");

    // Only continue if WebGL2 is available and working
    if (gl === null) {
        printError('WebGL 2 not supported by your browser',
            'Check to see you are using a <a href="https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API#WebGL_2_2" class="alert-link">modern browser</a>.');
        return;
    }

    console.log("Initializing program");

    // Create a state for our scene
    var state = {
        camera: {
            position: vec3.fromValues(5.0, 5.0, 5.0),
            center: vec3.fromValues(0.0, 0.0, 0.0),
            up: vec3.fromValues(0.0, 1.0, 0.0),
        },
        canvas: canvas,
    };

    function onLoaderLoad(mesh) {
        // Initialize shader
        var programInfo = intializeShaderProgram(gl);

        var meshVertices = new Float32Array(mesh.vertices);
        var meshNormals =  new Float32Array(mesh.normals);

        var buffers = initBuffers(gl, programInfo, 
            meshVertices,
            meshNormals,
        );

        var maxPos = Math.max(Math.max.apply(null, meshVertices), Math.abs(Math.min.apply(null, meshVertices)));

        console.log("Starting rendering loop");

        // A variable for keeping track of time between frames
        var then = 0.0;

        // This function is called when we want to render a frame to the canvas
        function render(now) {
            now *= 0.001; // convert to seconds
            const deltaTime = now - then;
            then = now;

            // Rotate the camera
            state.camera.position = vec3.fromValues(Math.sin(now) * (maxPos + 10.0), maxPos + 5.0, Math.cos(now) * (maxPos + 10.0));

            // Draw our scene
            drawScene(gl, deltaTime, programInfo, buffers, state);

            // Request another frame when this one is done
            requestAnimationFrame(render);
        }

        requestAnimationFrame(render); // Draw the scene
    }

    // Hook up the button
    const fileSubmitButton = document.querySelector("#fileSubmitButton");
    fileSubmitButton.addEventListener("click", () => {
        console.log("Submitting file...");
        let fileInput  = document.getElementById('objInputFile');
        let files = fileInput.files;
        
        let url = URL.createObjectURL(files[0]);

        fetch(url, {
            mode: 'no-cors' // 'cors' by default
        }).then(res=>{return res.text();})
        .then(data => {
            console.log("Parsing file...");
            objState = OBJLoader.prototype.parse(data);
            onLoaderLoad(objState.object.geometry);
        });

    });


}


/**
 * Draws the scene. Should be called every frame
 * 
 * @param  {} gl WebGL2 context
 * @param {number} deltaTime Time between each rendering call
 * @param  {} programInfo Custom object containing shader program and locations
 * @param  {} buffers Buffer data to use to draw shapes
 * @param {} state State of objects in the scene
 */
function drawScene(gl, deltaTime, programInfo, buffers, state) {
    // Set clear colour
    // This is a Red-Green-Blue-Alpha colour
    // See https://en.wikipedia.org/wiki/RGB_color_model
    // Here we use floating point values. In other places you may see byte representation (0-255).
    gl.clearColor(0.55686, 0.54902, 0.52157, 1.0);

    // Depth testing allows WebGL to figure out what order to draw our objects such that the look natural.
    // We want to draw far objects first, and then draw nearer objects on top of those to obscure them.
    // To determine the order to draw, WebGL can test the Z value of the objects.
    // The z-axis goes out of the screen
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL); // Near things obscure far things
    gl.clearDepth(1.0); // Clear everything

    gl.disable(gl.CULL_FACE);

    // Clear the color and depth buffer with specified clear colour.
    // This will replace everything that was in the previous frame with the clear colour.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    // Choose to use our shader
    gl.useProgram(programInfo.program);

    {
        // Update uniforms

        var projectionMatrix = mat4.create();
        var fovy = 60.0 * Math.PI / 180.0; // Vertical field of view in radians
        var aspect = state.canvas.clientWidth / state.canvas.clientHeight; // Aspect ratio of the canvas
        var near = 0.1; // Near clipping plane
        var far = 10000.0; // Far clipping plane
        // Generate the projection matrix using perspective
        mat4.perspective(projectionMatrix, fovy, aspect, near, far);

        gl.uniformMatrix4fv(programInfo.uniformLocations.projection, false, projectionMatrix);
    
        var viewMatrix = mat4.create();
        mat4.lookAt(
            viewMatrix,
            state.camera.position,
            state.camera.center,
            state.camera.up,
        );
        gl.uniformMatrix4fv(programInfo.uniformLocations.view, false, viewMatrix);

        gl.uniformMatrix4fv(programInfo.uniformLocations.model, false, mat4.create());

        // Bind the buffer we want to draw
        gl.bindVertexArray(buffers.vao);

        // Draw the object
        const offset = 0; // Number of elements to skip before starting
        gl.drawArrays(gl.TRIANGLES, offset, buffers.numVertices);
    }
}

function intializeShaderProgram(gl){

    // Vertex shader source code
    const vsSource =
        `#version 300 es
        in vec3 aPosition;
        in vec3 aNormal;

        uniform mat4 uProjectionMatrix;
        uniform mat4 uViewMatrix;
        uniform mat4 uModelMatrix;

        out vec4 oColor;

        void main() {
            // Position needs to be a vec4 with w as 1.0
            gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);

            // Pass the colour to the fragment shader
            oColor = abs(vec4(aNormal, 1.0));
            //oColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
        `;

    // Fragment shader source code
    const fsSource =
        `#version 300 es
        precision highp float;

        in vec4 oColor;

        out vec4 fragColor;

        void main() {
            fragColor = oColor;
        }
        `;


    // Create our shader program with our custom function
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    // Collect all the info needed to use the shader program.
    const programInfo = {
        // The actual shader program
        program: shaderProgram,
        // The attribute locations. WebGL will use there to hook up the buffers to the shader program.
        // NOTE: it may be wise to check if these calls fail by seeing that the returned location is not -1.
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
            vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
        },
        uniformLocations: {
            projection: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
            view: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
            model: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
        }
    };

       // Check to see if we found the locations of our uniforms and attributes
    // Typos are a common source of failure
    if (programInfo.attribLocations.vertexPosition === -1 ||
        programInfo.attribLocations.vertexNormal === -1 ||
        programInfo.uniformLocations.projection === -1 ||
        programInfo.uniformLocations.view === -1 ||
        programInfo.uniformLocations.model === -1 ) {
        printError('Shader Location Error', 'One or more of the uniform and attribute variables in the shaders could not be located');
    }

    return programInfo;
}

/**
 * Initialize our buffer
 * 
 * @param  {} gl WebGL2 context
 * @param  {} programInfo Custom object containing shader program and locations
 * @returns {} An object containing the buffers
 */
function initBuffers(gl, programInfo, positionArray, normalArray) {

    // Allocate and assign a Vertex Array Object to our handle
    var vertexArrayObject = gl.createVertexArray();

    // Bind our Vertex Array Object as the current used object
    gl.bindVertexArray(vertexArrayObject);

    return {
        vao: vertexArrayObject,
        attributes: {
            position: initPositionAttribute(gl, programInfo, positionArray),
            normals: initNormalAttribute(gl, programInfo, normalArray),
        },
        numVertices: positionArray.length / 3,
    };
}

function initPositionAttribute(gl, programInfo, positionArray) {

    // Create a buffer for the positions.
    const positionBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        positionArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3; // pull out 3 values per iteration, ie vec3
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from


        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    return positionBuffer;
}


function initNormalAttribute(gl, programInfo, normalArray) {

    // Create a buffer for the positions.
    const normalBuffer = gl.createBuffer();

    // Select the buffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(
        gl.ARRAY_BUFFER, // The kind of buffer this is
        normalArray, // The data in an Array object
        gl.STATIC_DRAW // We are not going to change this data, so it is static
    );

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
        const numComponents = 3; // pull out 4 values per iteration, ie vec4
        const type = gl.FLOAT; // the data in the buffer is 32bit floats
        const normalize = false; // don't normalize between 0 and 1
        const stride = 0; // how many bytes to get from one set of values to the next
        // Set stride to 0 to use type and numComponents above
        const offset = 0; // how many bytes inside the buffer to start from

        // Set the information WebGL needs to read the buffer properly
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        // Tell WebGL to use this attribute
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal);
    }

    return normalBuffer;
}
