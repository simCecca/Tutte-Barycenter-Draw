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
                .catch(err => this.showError(err));
    }

    onFileSelect(evt) {
        const files = evt.target.files;
        const file = files[0];

        this.loader.loadFromFile(file)
            .then(graph => this.drawGraph(graph))
            .catch(err => this.showError(err));
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

const controller = new Controller();
export {controller};