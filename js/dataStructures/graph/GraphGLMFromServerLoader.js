
export class GraphGLMFromServerLoader{
    async _fetchGML(path) {
        const gml = await fetch(path);

        const gmlText = await gml.text();
        return new Promise(resolve => resolve(gmlText));
    }

    _parseGML(text){
        const jsonGraph = {"directed": false ,"nodes":[], "edges":[] };
        const splitGml = text.split("\n");
        let isANode = false;
        let isAEdge = false;
        let currentNode = {"id":0, "rotationScheme":""};
        //u is the source and v is the target
        let currentEdge = {"id":0, "u":0, "v":0};
        splitGml.forEach(line => {

           if(/ *direct/.test(line)){
               const splitLine = line.split(" ");
               jsonGraph.directed = (splitLine[splitLine.length - 1] == "1") ? true : false;
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
                       currentNode.rotationScheme = rotationScheme;
                       jsonGraph.nodes.push(currentNode);
                       isANode = false;
                       currentNode = {"id":0, "rotationScheme":[]};
                   }
                   else{
                       let id = line.split(" ");
                       id = id[id.length - 1];
                       currentNode.id = parseInt(id);
                   }
               }
               else if(isAEdge){
                   if(/ *source/.test(line)){
                        let u = line.split(" ");
                        u = u[u.length - 1];
                        currentEdge.u = parseInt(u);
                   }
                   else if(/ *target/.test(line)){
                       let v = line.split(" ");
                       v = v[v.length - 1];
                       currentEdge.v = parseInt(v);

                   }
                   else{ //is the id of the edge
                       let id = line.replace('"',"").replace('"',"").split(" ");
                       id = id[id.length - 1];
                       currentEdge.id = id;
                       jsonGraph.edges.push(currentEdge);
                       isAEdge = false;
                       currentEdge = {"id":0, "u":0, "v":0};
                   }
               }
           }
        });
        return jsonGraph;
    }

    async loadGML(path){
        // load the gml file from the c++ server
        const textGml = await this._fetchGML(path);

        // parse the gml to json
        var parsedGraph = this._parseGML(textGml);

        return parsedGraph;
    }
}
