class Controller {

    constructor() {
        this.graph = new Graph();
        this.renderer = new D3Renderer();
        this.algorithm = new RaphsonNewtonAlgorithm(this.graph, window.innerWidth, window.innerHeight);

        window.addEventListener("resize", () => this.onWindowSizeChange());

        this.loader = new GraphLoader();

        this.setSpringEmbeddersSettingsVisibility(false);
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
        document.getElementById("springEmbeddersSettings").style.display = visibility ? "block" : "none";
    }

    onAlgorithmSpeedChanged(value) {
        const speed = parseInt(value) / 10;

        document.getElementById("renderSpeed").textContent = `${Math.round((speed + Number.EPSILON) * 100) / 100}%`;
        this.algorithm.setProperties(this._readAlgorithmProperties());
    }

    onConfirmSpringEmbeddersSettings() {
        this.algorithm.setProperties(this._readAlgorithmProperties());
    }

    _readAlgorithmProperties() {
        const speed = parseInt(document.getElementById("algorithmSpeed").value) / 1000.0;
        const springRestLength = parseFloat(document.getElementById("springRestLength").value);
        const springDampening = parseFloat(document.getElementById("springDampening").value);
        const charge = parseFloat(document.getElementById("charge").value);
        return {
            speed,
            springRestLength,
            springDampening,
            charge
        }
    }

    onPredefinedGraphSelectChange(value) {
            this.loader.loadEncodedFromServer(value)
                .then(graph => this.drawGraph(graph))
                .catch(err => this.showError(`You need to run this website on a server to use this feature.
                    You can still open predefined graphs by loading them from file.`));
    }

    onAlgorithmChanged(value) {
        if (this.algorithm) {
            this.algorithm.onRemove();
        }
        if (value === "Tutte") {
            this.algorithm = new RaphsonNewtonAlgorithm(this.graph, window.innerWidth, window.innerHeight);
            this.setSpringEmbeddersSettingsVisibility(false);
        }
        else if (value === "SpringEmbedders") {
            this.algorithm = new SpringEmbeddersAlgorithm(this.graph, window.innerWidth, window.innerHeight);
            this.setSpringEmbeddersSettingsVisibility(true);
        }
        else if (value === "SpringEmbeddersGPU") {
            this.algorithm = new SpringEmbeddersGPUAlgorithm(this.graph, window.innerWidth, window.innerHeight);
            this.setSpringEmbeddersSettingsVisibility(true);
        }

        this.algorithm.setProperties(this._readAlgorithmProperties());
    }

    onFileSelect(evt) {
        const files = evt.target.files;
        const file = files[0];

        this.loader.loadFromFile(file)
            .then(graph => this.drawGraph(graph))
            .catch(err => this.showError(err));
    }

    onGetFromServer() {
        const numOfNodes = document.getElementById("numOfNodes").value;
        const numOfEdges = document.getElementById("numOfEdges").value;

        const requestPath = document.getElementById("serverLocation").value;
        const requestQuery = `http://${requestPath}?nodes=${numOfNodes}&edges=${numOfEdges}`;

        this.loader.loadGLMFromServer(requestQuery)
            .then(graph => this.drawGraph(graph))
            .catch(err => this.showError(err));
    }

    onShowNodeLabelsChange(chkbox) {
        this.renderer.setRenderNodeLabels(chkbox.checked);
    }

    onShowEdgeLabelsChange(chkbox) {
        this.renderer.setRenderEdgeLabels(chkbox.checked);
    }

    drawGraph(graph) {
        this.graph = graph;
        console.log(this.graph.nodes.length);
        this.closeNav();

        this.renderer.setGraph(graph);
        this.algorithm.setGraph(graph);

        let i = 0;
        let tot = 0;
        const renderFunction = () => {
            const a = performance.now()
            this.algorithm.computeNextPositions();
            tot += performance.now() - a;
            i++;

            if (i % 100 === 0) {
                console.log(tot / i);
                i = 0;
                tot = 0;
            }

            this.renderer.render();
            requestAnimationFrame(renderFunction);
        };

        requestAnimationFrame(renderFunction);
    }
}

const ctrl = new Controller();