class GMLtoJSON{

    async _fetchGML(path) {
        const gml = await fetch(path);

        const gmlText = await gml.text();
        return new Promise(resolve => resolve(gmlText));
    }

    _parseGML(text){
        const jsonGraph = { "directed":0,"nodes":[], "edges":[] };
        const splitGml = text.split("\n");
        let isANode = false;
        let isAEdge = false;
        let currentNode = {"id":0, "rotationScheme":[]};
        let currentEdge = {"source":0, "target":0};
        splitGml.forEach(line => {
           if(/ *direct/.test(line)){
               const splitLine = line.split(" ");
               jsonGraph.directed = splitLine[splitLine.length - 1];
           }
           else if(/ *node/.test(line)){
               isANode = true;
           }
           else if(/ *edge/.test(line)){
               isAEdge = true;
           }
           else{
               if(isANode){
                   if(/ *label/.test(line)){
                       let rotationScheme = line.replace('"',"").split(" ");
                       rotationScheme = rotationScheme[rotationScheme.length - 1].split(",");
                       rotationScheme.splice(rotationScheme.length - 1,1);
                       currentNode.rotationScheme.push(rotationScheme);
                       jsonGraph.nodes.push(currentNode);
                       isANode = false;
                       currentNode = {"id":0, "rotationScheme":[]};
                   }
                   else{
                       let id = line.split(" ");
                       id = id[id.length - 1];
                       currentNode.id = id;
                   }
               }
               else if(isAEdge){
                   if(/ *source/.test(line)){
                        let source = line.split(" ");
                        source = source[source.length - 1];
                        currentEdge.source = source;
                   }
                   else{
                       let target = line.split(" ");
                       target = target[target.length - 1];
                       currentEdge.target = target;
                       jsonGraph.edges.push(currentEdge);
                       isAEdge = false;
                       currentEdge = {"source":0, "target":0};
                   }
               }
           }
        });
        return jsonGraph;
    }

    async loadGML(path){

        //load the gml file from the c++ server
        const textGml = await this._fetchGML(path);

        //parse the gml to json
        return this._parseGML(textGml);
    }

}