class Controller {

    constructor() {
        this.renderer = new Renderer();

        window.addEventListener("resize", () => this.onWindowSizeChange());

        this.loader = new GraphLoader();

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

    }

    showRenderSpeed(value) {
        const speed = parseInt(value) / 1000;

        document.getElementById("renderSpeed").textContent = speed;
        this.renderer.setRenderSpeed(speed);
    }

    onPredefinedGraphSelectChange(value) {
            this.loader.loadEncodedFromServer(value)
                .then(graph => this.drawGraph(graph))
                .catch(err => this.showError("You need to run this website on a server to use this feature." +
                    "You can still open predefined graphs by loading them from file"));
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
        this.closeNav();
        this.renderer.setGraph(graph);

        const renderFunction = () => {
            this.renderer.render();
            requestAnimationFrame(renderFunction);
        };

        requestAnimationFrame(renderFunction)

    }
}

const ctrl = new Controller();