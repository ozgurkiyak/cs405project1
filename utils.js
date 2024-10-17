function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
  	0.17677669529663687, -0.30618621784789724, 0.3535533905932738, 0.3,
  	0.3838834764831843,  0.4330127018922193,  -0.25,             -0.25,
  	-0.30618621784789724, 0.1767766952966369,  0.43301270189221935, 0,
  	0,                  0,                    0,                 1
    ]);
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    // calculate the model view matrix by using the transformation
    // methods and return the modelView matrix in this method	
    	let matrix = createIdentityMatrix()
	matrix = multiplyMatrices(matrix, createTranslationMatrix(0.3, -0.25, 0));
	matrix = multiplyMatrices(matrix, createRotationMatrix_X(Math.PI/6)); 
        matrix = multiplyMatrices(matrix, createRotationMatrix_Y(Math.PI/4));
        matrix = multiplyMatrices(matrix, createRotationMatrix_Z(Math.PI/3));
	matrix = multiplyMatrices(matrix, createScaleMatrix(0.5, 0.5, 1)); 
	return matrix;

}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */

function getPeriodicMovement(startTime) {
    // this metdo should return the model view matrix at the given time
    // to get a smooth animation
        // Get the current time (using Date.now to match the startTime)
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTime; // Elapsed time in milliseconds

    const period = 10000; // Total period is 10 seconds (10000 ms)
    const halfPeriod = period / 2; // 5 seconds for each phase

    // Calculate the cycle time (0 to 10000 milliseconds)
    let cycleTime = elapsedTime % period;

    // Calculate interpolation factor t (between 0 and 1)
    let t = cycleTime / halfPeriod;

    if (t > 1) {
        t = 2 - t; // Reverse interpolation after 5 seconds (going back to identity)
    }

    // Create the identity matrix (initial state)
    let matrix = createIdentityMatrix();

    // Interpolate between the identity matrix and the target matrix (task 2)
    let translationX = 0.3 * t; // Interpolate translation X (0 to 0.3)
    let translationY = -0.25 * t; // Interpolate translation Y (0 to -0.25)
    let rotationX = (Math.PI / 6) * t; // Interpolate rotation around X-axis
    let rotationY = (Math.PI / 4) * t; // Interpolate rotation around Y-axis
    let rotationZ = (Math.PI / 3) * t; // Interpolate rotation around Z-axis
    let scaleX = 1 - 0.5 * t; // Interpolate scale X (1 to 0.5)
    let scaleY = 1 - 0.5 * t; // Interpolate scale Y (1 to 0.5)

    // Apply transformations in order: translation, scale, then rotation
    matrix = multiplyMatrices(matrix, createTranslationMatrix(translationX, translationY, 0));
    matrix = multiplyMatrices(matrix, createRotationMatrix_X(rotationX));
    matrix = multiplyMatrices(matrix, createRotationMatrix_Y(rotationY));
    matrix = multiplyMatrices(matrix, createRotationMatrix_Z(rotationZ));
    matrix = multiplyMatrices(matrix, createScaleMatrix(scaleX, scaleY, 1));

    // Return the final transformation matrix
    return matrix;
}


