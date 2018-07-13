class Controller {

    constructor() {
        this.renderer = new Renderer();
        this.renderSpeed = 0.1;

        window.addEventListener("resize", () => this.onWindowSizeChange());
    }

    openNav() {
        document.getElementById("mySidenav").style.width = "250px";
    }

    closeNav() {
        document.getElementById("mySidenav").style.width = "0";
    }

    onWindowSizeChange() {
        if (this.renderer.algorithm !== null) {
            this.renderer.algorithm.width = window.innerWidth;
            this.renderer.algorithm.height = window.innerHeight;
            this.renderer.algorithm.positionExternalFace();
        }

    }

    showRenderSpeed(value) {
        this.renderSpeed = parseInt(value) / 1000;

        document.getElementById("renderSpeed").textContent = this.renderSpeed;
        if (this.renderer.algorithm !== null)
            this.renderer.algorithm.renderSpeed = this.renderSpeed;
    }

    onPredefinedGraphSelectChange(value) {
        this.drawGraph(value);
    }

    drawGraph(graphUrl) {
        const loader = new GraphLoader();
        const g = loader.loadGraph(graphUrl);
        g.then(graph => {

            this.renderer.setGraph(graph);
            this.renderer.algorithm.renderSpeed = this.renderSpeed;

            const renderFunction = () => {
                this.renderer.render();
                requestAnimationFrame(renderFunction);
            };

            requestAnimationFrame(renderFunction)
        });
    }
}

const controller = new Controller();
export {controller};