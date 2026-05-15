export class WebGLRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = null;
    this.program = null;
    this.instances = [];
    this.isSupported = false;
    
    this.init();
  }
  
  init() {
    try {
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      if (!this.gl) throw new Error('WebGL not supported');
      
      this.isSupported = true;
      this.setupShaders();
      this.setupBuffers();
    } catch (e) {
      console.warn('WebGL not supported, falling back to DOM rendering');
      this.isSupported = false;
    }
  }
  
  setupShaders() {
    const vsSource = `#version 300 es
      in vec2 a_position;
      in vec3 a_color;
      in float a_size;
      uniform vec2 u_resolution;
      
      out vec3 v_color;
      
      void main() {
        vec2 position = a_position / u_resolution * 2.0 - 1.0;
        position.y = -position.y;
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;
    
    const fsSource = `#version 300 es
      precision highp float;
      in vec3 v_color;
      out vec4 outColor;
      
      void main() {
        outColor = vec4(v_color, 1.0);
      }
    `;

  }
  
  renderInstances(nodes) {
    if (!this.isSupported) return;
    
    const instances = nodes.map(node => ({
      position: [node.x, node.y],
      color: this.getNodeColor(node),
      size: 140
    }));
    
    this.updateBuffers(instances);
    this.draw();
  }
  
  updateBuffers(instances) {
  }
  
  draw() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.POINTS, 0, this.instances.length);
  }
  
  getNodeColor(node) {
    switch(node.type) {
      case 'number': return [1.0, 0.7, 0.3]; 
      case 'calc': return [0.3, 0.8, 0.3]; 
      case 'output': return [0.3, 0.5, 1.0]; 
      default: return [0.7, 0.7, 0.7];
    }
  }
}
