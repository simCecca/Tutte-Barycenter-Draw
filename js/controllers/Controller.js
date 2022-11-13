import { Graph } from "../dataStructures/graph/Graph.js";
import { GraphLoader } from "../dataStructures/graph/GraphLoader.js";
import { WebGLRenderer } from "../rendering/WebGLRenderer.js";
import { D3Renderer } from "../rendering/D3Renderer.js";
import { RaphsonNewtonAlgorithm } from "../algorithms/RaphsonNewtonAlgorithm.js";
import { SpringEmbeddersAlgorithm } from "../algorithms/springEmbedders/SpringEmbeddersAlgorithm.js";
import { SpringEmbeddersTransferrable } from "../algorithms/springEmbedders/SpringEmbeddersWorkerTransferrable.js";
import { SpringEmbeddersGPUAlgorithm } from "../algorithms/springEmbedders/SpringEmbeddersGPUAlgorithm.js";
import { BarnesHut } from "../algorithms/barnesHut/BarnesHut.js";

class Controller {
  constructor() {
    this.graph = new Graph();
    this.renderer = new D3Renderer();
    this.algorithm = new RaphsonNewtonAlgorithm(
      this.graph,
      window.innerWidth,
      window.innerHeight
    );

    window.addEventListener("resize", () => this.onWindowSizeChange());

    this.loader = new GraphLoader();

    this._animationFrameId = null;

    this.setSpringEmbeddersSettingsVisibility(false);
    this._timeStamp = 0;
  }

  openNav() {
    document.getElementById("sidemenu").style.width = "250px";
  }

  closeNav() {
    document.getElementById("sidemenu").style.width = "0";
  }

  showError(msg) {
    document.getElementById("errorDialog").style.top = "0";

    document.getElementById("errorMsg").innerText = msg;
  }

  closeErrorDialog() {
    document.getElementById("errorDialog").style.top = "-100%";
  }

  onWindowSizeChange() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.algorithm.onCanvasSizeChanged(window.innerWidth, window.innerHeight);
  }

  setSpringEmbeddersSettingsVisibility(visibility) {
    document.getElementById("springEmbeddersSettings").style.display =
      visibility ? "block" : "none";
  }

  onAlgorithmSpeedChanged(value) {
    const speed = parseInt(value) / 10;

    document.getElementById("renderSpeed").textContent = `${
      Math.round((speed + Number.EPSILON) * 100) / 100
    }%`;
    this.algorithm.setProperties(this._readAlgorithmProperties());
  }

  onConfirmSpringEmbeddersSettings() {
    this.algorithm.setProperties(this._readAlgorithmProperties());
  }

  _readAlgorithmProperties() {
    const speed =
      parseInt(document.getElementById("algorithmSpeed").value) / 1000.0;
    const springRestLength = parseFloat(
      document.getElementById("springRestLength").value
    );
    const springDampening = parseFloat(
      document.getElementById("springDampening").value
    );
    const charge = parseFloat(document.getElementById("charge").value);
    const newParams = {
      speed,
      springRestLength,
      springDampening,
      charge,
    };
    const theta = document.getElementById("theta");
    if (theta) {
      newParams.theta = theta.value;
    }
    return newParams;
  }

  _updateStats(totalTime, timeToCompute, timeToRender) {
    document.getElementById("totalTime").innerText = totalTime.toFixed(3);
    document.getElementById("algoTime").innerText = timeToCompute.toFixed(3);
    document.getElementById("renderTime").innerText = timeToRender.toFixed(3);
  }

  _resetStats() {
    document.getElementById("totalTime").innerText = "";
    document.getElementById("algoTime").innerText = "";
    document.getElementById("renderTime").innerText = "";
  }

  onPredefinedGraphSelectChange(value) {
    this.loader
      .loadEncodedFromServer(value)
      .then((graph) => this.drawGraph(graph))
      .catch((err) =>
        this
          .showError(`You need to run this website on a server to use this feature.
                    You can still open predefined graphs by loading them from file.`)
      );
  }

  onAlgorithmChanged(value) {
    if (this.algorithm) {
      this.algorithm.onRemove();
    }
    if (value === "Tutte") {
      this.algorithm = new RaphsonNewtonAlgorithm(
        this.graph,
        window.innerWidth,
        window.innerHeight
      );
      this.setSpringEmbeddersSettingsVisibility(false);
    } else if (value === "SpringEmbedders") {
      this.algorithm = new SpringEmbeddersAlgorithm(
        this.graph,
        window.innerWidth,
        window.innerHeight
      );
      this.setSpringEmbeddersSettingsVisibility(true);
    } else if (value === "SpringEmbeddersTrans") {
      this.algorithm = new SpringEmbeddersTransferrable(
        this.graph,
        window.innerWidth,
        window.innerHeight
      );
      this.setSpringEmbeddersSettingsVisibility(true);
    } else if (value === "SpringEmbeddersGPU") {
      this.algorithm = new SpringEmbeddersGPUAlgorithm(
        this.graph,
        window.innerWidth,
        window.innerHeight
      );
      this.setSpringEmbeddersSettingsVisibility(true);
    } else if (value === "BarnesHut") {
      this._addTheta();

      this.algorithm = new BarnesHut(
        this.graph,
        window.innerWidth,
        window.innerHeight
      );
      this.setSpringEmbeddersSettingsVisibility(true);
    }

    if (value != "BarnesHut") {
      this._removeTheta();
    }

    this.algorithm.setProperties(this._readAlgorithmProperties());
  }

  onRendererChanged(value) {
    if (this.renderer) {
      this.renderer.onRemove();
    }

    if (value === "d3") {
      this.renderer = new D3Renderer();
    } else if (value === "webgl") {
      this.renderer = new WebGLRenderer();
    }

    this.renderer.setGraph(this.graph);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onFileSelect(evt) {
    const files = evt.target.files;
    const file = files[0];

    this.loader
      .loadFromFile(file)
      .then((graph) => this.drawGraph(graph))
      .catch((err) => this.showError(err));
  }

  onGetFromServer() {
    const numOfNodes = document.getElementById("numOfNodes").value;
    const numOfEdges = document.getElementById("numOfEdges").value;

    const requestPath = document.getElementById("serverLocation").value;
    const requestQuery = `http://${requestPath}?nodes=${numOfNodes}&edges=${numOfEdges}`;

    this.loader
      .loadGLMFromServer(requestQuery)
      .then((graph) => this.drawGraph(graph))
      .catch((err) => this.showError(err));
  }

  onShowNodeLabelsChange(chkbox) {
    this.renderer.setRenderNodeLabels(chkbox.checked);
  }

  onShowEdgeLabelsChange(chkbox) {
    this.renderer.setRenderEdgeLabels(chkbox.checked);
  }

  drawGraph(graph) {
    cancelAnimationFrame(this._animationFrameId);
    if (this.algorithm.reset) {
      this.algorithm.reset();
    }
    this._resetStats();

    this.graph = graph;
    this.closeNav();

    this.renderer.setGraph(graph);
    this.algorithm.setGraph(graph);

    let numberOfFrames = 0;
    let totalTimeToCompute = 0;
    let totalTimeToRender = 0;
    let totalTime = 0;
    const renderFunction = async (now) => {
      totalTime += now - this._timeStamp;
      this._timeStamp = now;

      const timeBeforeComputing = performance.now();
      await this.algorithm.computeNextPositions();
      totalTimeToCompute += performance.now() - timeBeforeComputing;

      const timeBeforeRendering = performance.now();
      this.renderer.render();
      totalTimeToRender += performance.now() - timeBeforeRendering;

      numberOfFrames++;
      if (numberOfFrames % 10 === 0) {
        // update stats every 10 frames
        this._updateStats(
          totalTime / numberOfFrames,
          totalTimeToCompute / numberOfFrames,
          totalTimeToRender / numberOfFrames
        );
        numberOfFrames = 0;
        totalTimeToCompute = 0;
        totalTimeToRender = 0;
        totalTime = 0;
      }
      this._animationFrameId = requestAnimationFrame(renderFunction);
    };

    this._animationFrameId = requestAnimationFrame(renderFunction);
  }

  _addTheta = () => {
    const father = document.getElementById("thetaFather");
    const theta = document.createElement("input");
    theta.type = "number";
    theta.value = 0.5;
    theta.className = "controllerInput";
    theta.id = "theta";
    const text = document.createElement("span");
    text.textContent = "Theta: ";
    text.id = "thetaText";
    father.appendChild(text);
    father.appendChild(theta);
  };

  _removeTheta = () => {
    const father = document.getElementById("thetaFather");
    while (father.firstChild) {
      father.removeChild(father.firstChild);
    }
  };
}

export const ctrl = new Controller();
