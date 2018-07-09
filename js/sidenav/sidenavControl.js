function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function showRenderSpeed(value) {
    document.getElementById("renderSpeed").textContent = parseInt(value)/100;
}

function onPredefinedGraphSelectChange(value) {
    drawGraph(value);
}

function drawGraph(graphUrl) {
    const loader = new GraphLoader();
    const g = loader.loadGraph(graphUrl);
    g.then(graph => {
        renderer = new Renderer(graph);

        renderer.render();

        const renderFunction = () => {
            renderer.render();
            requestAnimationFrame(renderFunction);
        };

        requestAnimationFrame(renderFunction)
    });
}