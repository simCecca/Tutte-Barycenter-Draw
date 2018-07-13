//ogdf
#include <ogdf/basic/Graph.h>
#include <ogdf/fileformats/GraphIO.h>
#include <ogdf/basic/graph_generators.h>

//combinatorial embedding
#include <ogdf/basic/CombinatorialEmbedding.h>
#include <ogdf/planarity/BoothLueker.h>

//server
#include <httplib.h>

#include <vector>
#include <iostream>
#include <algorithm>
#include <functional>

#pragma comment(lib, "Ws2_32.lib")


using namespace ogdf;
using namespace std;
using namespace httplib;

void createGML(Graph G, std::stringstream& name){
	GraphAttributes GA(G, GraphAttributes::nodeLabel); // Create graph attributes for this graph

	node v;
	forall_nodes(v, G){ // iterate through all the node in the grap
		edge curre;
		string s;
		forall_adj_edges(curre, v){
			s += to_string(curre->index()) + ",";
		}
		char const *pchar = s.c_str(); //use char const* as target type
		GA.label(v) = pchar;
	}
	GraphIO::writeGML(GA, name);
}


int main(){

	Server svr;
	

	svr.Get("/graph", [](const Request& req, Response& res) {
		
		res.set_header("access-control-allow-origin", "*");
		Graph G;
		planarTriconnectedGraph(G, 50, 144);
		std::stringstream output;
		createGML(G, output);
		res.set_content(output.str(), "text/plain");
	});



	svr.listen("localhost", 1234);


}